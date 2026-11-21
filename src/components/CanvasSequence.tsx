"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getFrameUrl } from "@/lib/frames";
import { getActiveLenis } from "@/hooks/useLenis";
import Preloader from "./Preloader";
import HeroOverlay from "./HeroOverlay";
import StoryPads from "./StoryPads";
import BookingModal from "./BookingModal";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface CanvasSequenceProps {
  totalFrames?: number;
  initialPreloadCount?: number;
  className?: string;
}

export default function CanvasSequence({
  totalFrames: initialTotalFrames = 960,
  initialPreloadCount = 40,
  className = "",
}: CanvasSequenceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const triggerRef = useRef<ScrollTrigger | null>(null);
  const isSeekingRef = useRef<boolean>(false);

  // Total frames in sequence
  const [totalFrames, setTotalFrames] = useState<number>(initialTotalFrames);
  const [currentFrame, setCurrentFrame] = useState<number>(1);
  const [frameExtension, setFrameExtension] = useState<"webp" | "jpg">("webp");

  // Smooth frame playback: display frame lerps toward scroll-driven target
  const targetFrameRef = useRef<number>(1);
  const displayFrameRef = useRef<number>(1);
  const animationFrameRef = useRef<number | null>(null);
  const lastReportedFrameRef = useRef<number>(1);

  // Booking modal state
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [bookingService, setBookingService] = useState<string | undefined>(undefined);

  const handleOpenBooking = (serviceName?: string) => {
    setBookingService(serviceName);
    setIsBookingOpen(true);
  };

  // Preloader state
  const [preloadedCount, setPreloadedCount] = useState<number>(0);
  const [isPreloadComplete, setIsPreloadComplete] = useState<boolean>(false);
  const [preloaderHidden, setPreloaderHidden] = useState<boolean>(false);

  // Background caching state
  const [totalCached, setTotalCached] = useState<number>(0);

  // In-memory image cache: maps 1-based frame number -> HTMLImageElement
  const imageCache = useRef<Map<number, HTMLImageElement>>(new Map());
  const lastDrawnImage = useRef<HTMLImageElement | null>(null);

  // Target preload count cannot exceed total frames
  const targetPreload = totalFrames > 0 ? Math.min(initialPreloadCount, totalFrames) : initialPreloadCount;

  // 1. Detect total frames and preferred extension if needed
  useEffect(() => {
    if (initialTotalFrames > 0) {
      setTotalFrames(initialTotalFrames);
    }

    let isMounted = true;
    fetch("/api/frames")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.totalFrames && (!initialTotalFrames || initialTotalFrames === 0)) {
          setTotalFrames(data.totalFrames);
        }
        if (data.extension) {
          setFrameExtension(data.extension);
        }
      })
      .catch((err) => {
        console.warn("Could not query /api/frames:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [initialTotalFrames]);

  // 2. Pre-decode images (img.decode()) during loading to eliminate GPU/main-thread jank
  const loadSingleFrame = useCallback(
    (frameIndex: number): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const existing = imageCache.current.get(frameIndex);
        if (existing && existing.complete && existing.naturalWidth > 0) {
          resolve(existing);
          return;
        }

        const img = new Image();
        img.src = getFrameUrl(frameIndex, frameExtension);

        img.onload = async () => {
          try {
            if ("decode" in img) {
              await img.decode();
            }
          } catch {
            // decode failure is non-fatal
          }
          imageCache.current.set(frameIndex, img);
          resolve(img);
        };

        img.onerror = () => {
          if (frameExtension === "webp") {
            const fallbackImg = new Image();
            fallbackImg.src = getFrameUrl(frameIndex, "jpg");
            fallbackImg.onload = async () => {
              try {
                if ("decode" in fallbackImg) await fallbackImg.decode();
              } catch {}
              imageCache.current.set(frameIndex, fallbackImg);
              resolve(fallbackImg);
            };
            fallbackImg.onerror = () => {
              reject(new Error(`Failed to load frame ${frameIndex}`));
            };
          } else {
            reject(new Error(`Failed to load frame ${frameIndex}`));
          }
        };
      });
    },
    [frameExtension]
  );

  // High-performance context drawer with aspect-ratio preservation and high smoothing quality
  const drawFrameToContext = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      img: HTMLImageElement
    ) => {
      const w = canvas.width;
      const h = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;

      if (!iw || !ih) return;

      const scale = Math.max(w / iw, h / ih);
      const nw = iw * scale;
      const nh = ih * scale;
      const cx = (w - nw) * 0.5;
      const cy = (h - nh) * 0.5;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, cx, cy, nw, nh);
      lastDrawnImage.current = img;
    },
    []
  );

  // 3. Draw a specific frame to canvas with zero pixel drops
  const drawFrame = useCallback(
    (frameNumber: number) => {
       const canvas = canvasRef.current;
       if (!canvas) return;
       const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
       if (!ctx) return;

       let img = imageCache.current.get(frameNumber);
       if (!img || !img.complete || img.naturalWidth === 0) {
         // Strict backward nearest-frame fallback (never forward)
         for (let i = frameNumber - 1; i >= 1; i--) {
           const candidate = imageCache.current.get(i);
           if (candidate && candidate.complete && candidate.naturalWidth > 0) {
             img = candidate;
             break;
           }
         }
       }
       if (!img) {
         loadSingleFrame(frameNumber)
           .then((loadedImg) => {
             const c = canvasRef.current?.getContext("2d", { alpha: false, desynchronized: true });
             if (c) drawFrameToContext(c, canvasRef.current!, loadedImg);
           })
           .catch(() => {});
         return;
       }
       drawFrameToContext(ctx, canvas, img);
    },
    [loadSingleFrame, drawFrameToContext]
  );

  // Resize canvas backing store to match display size and device pixel ratio for Full HD sharpness
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const targetWidth = Math.round(rect.width * dpr);
    const targetHeight = Math.round(rect.height * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    drawFrame(currentFrame);
  }, [currentFrame, drawFrame]);

  // Resize event listener
  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  // 4. Preloader: Fetch and pre-decode first 40 frames
  useEffect(() => {
    if (totalFrames <= 0) return;

    let isCancelled = false;
    const target = Math.min(initialPreloadCount, totalFrames);
    const CONCURRENCY = 12;
    let nextIndex = 1;
    let completed = 0;

    const runWorker = async () => {
      while (nextIndex <= target && !isCancelled) {
        const frameIndex = nextIndex++;
        try {
          await loadSingleFrame(frameIndex);
        } catch {
          // Gracefully continue
        }

        if (!isCancelled) {
          completed++;
          setPreloadedCount(completed);
          setTotalCached((prev) => Math.max(prev, completed));
        }
      }
    };

    const workers = Array.from({ length: CONCURRENCY }, () => runWorker());

    Promise.all(workers).then(() => {
      if (!isCancelled) {
        setIsPreloadComplete(true);
        drawFrame(1);
        setTimeout(() => {
          setPreloaderHidden(true);
          ScrollTrigger.refresh();
        }, 500);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [totalFrames, initialPreloadCount, loadSingleFrame, drawFrame]);

  // 5. Background Caching: Pre-decode remaining frames non-blocking using idle time
  useEffect(() => {
    if (!isPreloadComplete || totalFrames <= targetPreload) return;

    let isCancelled = false;
    let nextIndex = targetPreload + 1;
    let cachedTotal = targetPreload;
     const BATCH_SIZE = 25;

    const loadNextBatch = () => {
      if (isCancelled || nextIndex > totalFrames) return;

      const batchPromises: Promise<HTMLImageElement>[] = [];
      const end = Math.min(nextIndex + BATCH_SIZE, totalFrames + 1);

      for (let i = nextIndex; i < end; i++) {
        batchPromises.push(loadSingleFrame(i));
      }

      nextIndex = end;

      Promise.allSettled(batchPromises).then(() => {
        if (!isCancelled) {
          cachedTotal = Math.min(nextIndex - 1, totalFrames);
          setTotalCached(cachedTotal);

          if ("requestIdleCallback" in window) {
            (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
              loadNextBatch();
            });
          } else {
            setTimeout(loadNextBatch, 20);
          }
        }
      });
    };

    loadNextBatch();

    return () => {
      isCancelled = true;
    };
  }, [isPreloadComplete, totalFrames, targetPreload, loadSingleFrame]);

  // 6. Strictly Vertical ScrollTrigger synchronized with Lenis
  useEffect(() => {
    if (!containerRef.current || !canvasWrapperRef.current || totalFrames <= 0) return;

    // Pinned vertical ScrollTrigger driven through Lenis smooth scroll
    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "+=4500",
      pin: canvasWrapperRef.current,
      pinSpacing: true,
       scrub: 0.35,
       horizontal: false,
       onUpdate: (self) => {
         if (isSeekingRef.current) return;
         const targetIndex = Math.min(
           totalFrames,
           Math.max(1, Math.floor(self.progress * (totalFrames - 1)) + 1)
         );
         targetFrameRef.current = targetIndex;
         displayFrameRef.current = targetIndex;
         drawFrame(targetIndex);
         if (targetIndex !== lastReportedFrameRef.current) {
           lastReportedFrameRef.current = targetIndex;
           setCurrentFrame(targetIndex);
         }
       },
    });

    triggerRef.current = trigger;
    ScrollTrigger.refresh();

    return () => {
      trigger.kill();
      ScrollTrigger.refresh();
    };
  }, [totalFrames, drawFrame]);

  // Smooth zero-jump frame playback via lerp interpolation toward the scroll target
  useEffect(() => {
    if (!canvasRef.current || !preloaderHidden) {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    let running = true;
    const loop = () => {
      if (!running) return;
      displayFrameRef.current +=
        (targetFrameRef.current - displayFrameRef.current) * 0.18;
      const frame = Math.max(
        1,
        Math.min(totalFrames, Math.round(displayFrameRef.current))
      );
      drawFrame(frame);
      if (frame !== lastReportedFrameRef.current) {
        lastReportedFrameRef.current = frame;
        setCurrentFrame(frame);
      }
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [preloaderHidden, totalFrames, drawFrame]);

  // Seek handler for manual scrubber interaction utilizing Lenis smooth navigation
  const handleSeek = (newFrame: number, syncScroll = false) => {
    targetFrameRef.current = newFrame;
    displayFrameRef.current = newFrame;
    drawFrame(newFrame);
    setCurrentFrame(newFrame);

    if (syncScroll && totalFrames > 1 && triggerRef.current) {
      isSeekingRef.current = true;
      const progress = (newFrame - 1) / (totalFrames - 1);
      const scrollTarget =
        triggerRef.current.start + progress * (triggerRef.current.end - triggerRef.current.start);

      const lenis = getActiveLenis();
      if (lenis) {
        lenis.scrollTo(scrollTarget, { immediate: false });
      } else {
        window.scrollTo({ top: scrollTarget, behavior: "smooth" });
      }

      setTimeout(() => {
        isSeekingRef.current = false;
      }, 100);
    }
  };

  // Preloader progress calculation (0 - 100%)
  const preloadProgress =
    targetPreload > 0
      ? Math.min(100, Math.round((preloadedCount / targetPreload) * 100))
      : 0;

  const backgroundProgress =
    totalFrames > 0
      ? Math.min(100, Math.round((totalCached / totalFrames) * 100))
      : 0;

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black overflow-x-hidden select-none ${className}`}
    >
      {/* Pinned Vertical Viewport Container */}
      <div
        ref={canvasWrapperRef}
        className="relative w-full h-screen overflow-hidden"
      >
        {/* HTML5 Canvas Surface */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block cursor-ns-resize object-cover"
          onMouseMove={(e) => {
            if (e.buttons === 1 && totalFrames > 0 && canvasWrapperRef.current) {
              const rect = canvasWrapperRef.current.getBoundingClientRect();
              const pct = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
              const targetIndex = Math.min(
                totalFrames,
                Math.max(1, Math.floor(pct * (totalFrames - 1)) + 1)
              );
              handleSeek(targetIndex, true);
            }
          }}
        />

        {/* Minimal Premium Dental Clinic Header & Navigation */}
        <HeroOverlay
          isVisible={isPreloadComplete}
          onOpenBooking={() => handleOpenBooking()}
          onAbout={() => handleSeek(960, true)}
        />

        {/* 3 Frame-Synchronized Storytelling Glassmorphism Pads */}
        <StoryPads
          currentFrame={currentFrame}
          onOpenBooking={handleOpenBooking}
        />

        {/* Functional Appointment Booking Modal */}
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          defaultService={bookingService}
        />

        {/* Preloader Component */}
        <Preloader
          progress={preloadProgress}
          preloadedCount={preloadedCount}
          targetCount={targetPreload}
          isComplete={isPreloadComplete}
          isHidden={preloaderHidden}
        />
      </div>
    </div>
  );
}

