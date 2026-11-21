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

const MAX_CACHED_FRAMES = 300;
const PRELOAD_RADIUS = 40;

export default function CanvasSequence({
  totalFrames: initialTotalFrames = 960,
  initialPreloadCount = 280,
  className = "",
}: CanvasSequenceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const triggerRef = useRef<ScrollTrigger | null>(null);
  const isSeekingRef = useRef<boolean>(false);

  const [totalFrames, setTotalFrames] = useState<number>(initialTotalFrames);
  const [currentFrame, setCurrentFrame] = useState<number>(1);
  const [frameExtension, setFrameExtension] = useState<"webp" | "jpg">("webp");

  const targetFrameRef = useRef<number>(1);
  const currentFrameRef = useRef<number>(1);
  const lastDrawnFrameRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastScrollDirectionRef = useRef<1 | -1>(1);
  const lastProgressRef = useRef<number>(0);

  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [bookingService, setBookingService] = useState<string | undefined>(undefined);

  const [preloadedCount, setPreloadedCount] = useState<number>(0);
  const [isPreloadComplete, setIsPreloadComplete] = useState<boolean>(false);
  const [preloaderHidden, setPreloaderHidden] = useState<boolean>(false);
  const [totalCached, setTotalCached] = useState<number>(0);

  const imagesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const loadQueueRef = useRef<Set<number>>(new Set());
  const loadingRef = useRef<boolean>(false);
  const decodeQueueRef = useRef<Set<number>>(new Set());

  const handleOpenBooking = (serviceName?: string) => {
    setBookingService(serviceName);
    setIsBookingOpen(true);
  };

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

  const loadSingleFrame = useCallback(
    (frameIndex: number): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        if (frameIndex < 1 || frameIndex > totalFrames) {
          resolve(null);
          return;
        }

        const existing = imagesRef.current.get(frameIndex);
        if (existing && existing.complete && existing.naturalWidth > 0) {
          resolve(existing);
          return;
        }

        const img = new Image();
        img.decoding = "async";
        img.src = getFrameUrl(frameIndex, frameExtension);

        img.onload = () => {
          imagesRef.current.set(frameIndex, img);
          resolve(img);
        };

        img.onerror = () => {
          if (frameExtension === "webp") {
            const fallbackImg = new Image();
            fallbackImg.decoding = "async";
            fallbackImg.src = getFrameUrl(frameIndex, "jpg");
            fallbackImg.onload = () => {
              imagesRef.current.set(frameIndex, fallbackImg);
              resolve(fallbackImg);
            };
            fallbackImg.onerror = () => {
              imagesRef.current.set(frameIndex, null as any);
              resolve(null);
            };
          } else {
            imagesRef.current.set(frameIndex, null as any);
            resolve(null);
          }
        };
      });
    },
    [frameExtension, totalFrames]
  );

  const evictOldFrames = useCallback(
    (keepAround: number, radius: number = PRELOAD_RADIUS) => {
      const minKeep = Math.max(1, keepAround - radius * 2);
      const maxKeep = Math.min(totalFrames, keepAround + radius * 2);

      if (imagesRef.current.size <= MAX_CACHED_FRAMES) return;

      const toDelete: number[] = [];
      imagesRef.current.forEach((_, index) => {
        if (index < minKeep || index > maxKeep) {
          toDelete.push(index);
        }
      });

      toDelete.forEach((index) => {
        imagesRef.current.delete(index);
      });

      setTotalCached(imagesRef.current.size);
    },
    [totalFrames]
  );

  const drawFrameToContext = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, img: HTMLImageElement) => {
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
    },
    []
  );

  const getBestAvailableFrame = useCallback(
    (targetFrame: number): HTMLImageElement | null => {
      let img = imagesRef.current.get(targetFrame) ?? null;
      if (img && img.complete && img.naturalWidth > 0) return img;

      let bestFrame = targetFrame;
      let bestDistance = Infinity;

      for (let d = 1; d <= PRELOAD_RADIUS; d++) {
        const lower = targetFrame - d;
        const upper = targetFrame + d;

        if (lower >= 1) {
          const candidate = imagesRef.current.get(lower);
          if (candidate && candidate.complete && candidate.naturalWidth > 0) {
            const dist = d;
            if (dist < bestDistance) {
              bestDistance = dist;
              bestFrame = lower;
            }
          }
        }

        if (upper <= totalFrames) {
          const candidate = imagesRef.current.get(upper);
          if (candidate && candidate.complete && candidate.naturalWidth > 0) {
            const dist = d;
            if (dist < bestDistance) {
              bestDistance = dist;
              bestFrame = upper;
            }
          }
        }

        if (bestDistance !== Infinity) break;
      }

      return imagesRef.current.get(bestFrame) ?? null;
    },
    [totalFrames]
  );

  const drawFrame = useCallback(
    (frameNumber: number) => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) return;

      const img = getBestAvailableFrame(frameNumber);
      if (!img) {
        loadSingleFrame(frameNumber);
        return;
      }

      drawFrameToContext(ctx, canvas, img);
    },
    [getBestAvailableFrame, loadSingleFrame, drawFrameToContext]
  );

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

    const ctx = canvas.getContext("2d", { alpha: false });
    if (ctx) {
      ctxRef.current = ctx;
    }

    drawFrame(Math.round(currentFrameRef.current));
  }, [drawFrame]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  const prioritizeFramesAroundTarget = useCallback(() => {
    if (loadingRef.current) return;
    const target = Math.round(targetFrameRef.current);
    const direction = lastScrollDirectionRef.current;

    const start = Math.max(1, target - PRELOAD_RADIUS);
    const end = Math.min(totalFrames, target + PRELOAD_RADIUS);

    const missing: number[] = [];
    for (let i = start; i <= end; i++) {
      const img = imagesRef.current.get(i);
      if (!img || !img.complete || img.naturalWidth === 0) {
        if (!loadQueueRef.current.has(i)) {
          missing.push(i);
        }
      }
    }

    if (missing.length === 0) return;

    if (direction === 1) {
      missing.sort((a, b) => a - b);
    } else {
      missing.sort((a, b) => b - a);
    }

    loadingRef.current = true;
    missing.forEach((frame) => {
      loadQueueRef.current.add(frame);
      loadSingleFrame(frame).finally(() => {
        loadQueueRef.current.delete(frame);
      });
    });
    loadingRef.current = false;

    evictOldFrames(target);
  }, [totalFrames, loadSingleFrame, evictOldFrames]);

  useEffect(() => {
    if (totalFrames <= 0) return;

    imagesRef.current.clear();
    loadQueueRef.current.clear();

    let isCancelled = false;
    const target = Math.min(initialPreloadCount, totalFrames);
    const BATCH_SIZE = 30;
    let nextIndex = 1;
    let completed = 0;

    const loadBatch = async () => {
      while (nextIndex <= target && !isCancelled) {
        const batchEnd = Math.min(nextIndex + BATCH_SIZE, target + 1);
        const promises: Promise<HTMLImageElement | null>[] = [];
        for (let i = nextIndex; i < batchEnd; i++) {
          if (!loadQueueRef.current.has(i)) {
            loadQueueRef.current.add(i);
            promises.push(loadSingleFrame(i).finally(() => loadQueueRef.current.delete(i)));
          }
        }
        await Promise.all(promises);
        nextIndex = batchEnd;
        completed = nextIndex - 1;
        if (!isCancelled) {
          setPreloadedCount(completed);
          setTotalCached(imagesRef.current.size);
        }
      }
      if (!isCancelled) {
        setIsPreloadComplete(true);
        drawFrame(1);
        setTimeout(() => {
          setPreloaderHidden(true);
          ScrollTrigger.refresh();
        }, 500);
      }
    };

    loadBatch();

    return () => {
      isCancelled = true;
    };
  }, [totalFrames, initialPreloadCount, loadSingleFrame, drawFrame]);

  useEffect(() => {
    if (!isPreloadComplete || totalFrames <= initialPreloadCount) return;

    let isCancelled = false;
    let nextIndex = initialPreloadCount + 1;
    const BATCH_SIZE = 20;

    const loadNextBatch = async () => {
      if (isCancelled || nextIndex > totalFrames) return;

      const batchEnd = Math.min(nextIndex + BATCH_SIZE, totalFrames + 1);
      const promises: Promise<HTMLImageElement | null>[] = [];
      for (let i = nextIndex; i < batchEnd; i++) {
        if (!loadQueueRef.current.has(i)) {
          loadQueueRef.current.add(i);
          promises.push(loadSingleFrame(i).finally(() => loadQueueRef.current.delete(i)));
        }
      }
      await Promise.all(promises);
      nextIndex = batchEnd;

      if (!isCancelled) {
        setTotalCached(imagesRef.current.size);
        if (nextIndex <= totalFrames) {
          setTimeout(loadNextBatch, 50);
        }
      }
    };

    loadNextBatch();

    return () => {
      isCancelled = true;
    };
  }, [isPreloadComplete, totalFrames, initialPreloadCount, loadSingleFrame]);

  useEffect(() => {
    if (!containerRef.current || !canvasWrapperRef.current || totalFrames <= 0) return;

    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "+=4500",
      pin: canvasWrapperRef.current,
      pinSpacing: true,
      scrub: true,
      horizontal: false,
      onUpdate: (self) => {
        if (isSeekingRef.current) return;
        const targetIndex = Math.min(
          totalFrames,
          Math.max(1, Math.floor(self.progress * (totalFrames - 1)) + 1)
        );
        targetFrameRef.current = targetIndex;

        const direction = self.progress > lastProgressRef.current ? 1 : -1;
        lastScrollDirectionRef.current = direction;
        lastProgressRef.current = self.progress;

        prioritizeFramesAroundTarget();
      },
    });

    triggerRef.current = trigger;
    ScrollTrigger.refresh();

    return () => {
      trigger.kill();
      ScrollTrigger.refresh();
    };
  }, [totalFrames, prioritizeFramesAroundTarget]);

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

      const targetFrame = targetFrameRef.current;
      currentFrameRef.current += (targetFrame - currentFrameRef.current) * 0.25;
      const frame = Math.max(1, Math.min(totalFrames, Math.round(currentFrameRef.current)));

      if (frame !== lastDrawnFrameRef.current) {
        lastDrawnFrameRef.current = frame;
        drawFrame(frame);

        if (frame !== currentFrame) {
          setCurrentFrame(frame);
        }
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const lenis = getActiveLenis();
    if (!lenis) return;

    const onLenisScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on("scroll", onLenisScroll);

    return () => {
      lenis.off("scroll", onLenisScroll);
    };
  }, []);

  const handleSeek = (newFrame: number, syncScroll = false) => {
    targetFrameRef.current = newFrame;
    currentFrameRef.current = newFrame;
    drawFrame(newFrame);
    setCurrentFrame(newFrame);
    prioritizeFramesAroundTarget();

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

  const targetPreload = totalFrames > 0 ? Math.min(initialPreloadCount, totalFrames) : initialPreloadCount;

  const preloadProgress =
    targetPreload > 0 ? Math.min(100, Math.round((preloadedCount / targetPreload) * 100)) : 0;

  const backgroundProgress =
    totalFrames > 0 ? Math.min(100, Math.round((totalCached / totalFrames) * 100)) : 0;

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black overflow-x-hidden select-none ${className}`}
    >
      <div ref={canvasWrapperRef} className="relative w-full h-screen overflow-hidden">
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
        <HeroOverlay
          isVisible={isPreloadComplete}
          onOpenBooking={() => handleOpenBooking()}
          onAbout={() => handleSeek(960, true)}
        />
        <StoryPads currentFrame={currentFrame} onOpenBooking={handleOpenBooking} />
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          defaultService={bookingService}
        />
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