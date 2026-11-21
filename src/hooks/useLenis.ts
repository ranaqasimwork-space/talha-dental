"use client";

import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Global reference for child components to access active Lenis instance without duplicate initialization
let globalLenisInstance: Lenis | null = null;

export function getActiveLenis(): Lenis | null {
  return globalLenisInstance;
}

/**
 * Custom React hook that initializes Lenis smooth scrolling with cinematic easing,
 * synchronizes scroll events with GSAP ScrollTrigger, and connects to gsap.ticker.
 */
export function useLenis() {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // 1. Initialize Lenis with smooth cinematic easing
    const instance = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      autoRaf: false, // Managed by GSAP ticker for 60/120fps lock
    });

    lenisRef.current = instance;
    globalLenisInstance = instance;
    setLenis(instance);

    // 2. Synchronize Lenis scroll events with GSAP ScrollTrigger
    instance.on("scroll", ScrollTrigger.update);

    // 3. Connect to GSAP ticker with lag smoothing disabled
    const tickerUpdate = (time: number) => {
      instance.raf(time * 1000);
    };
    gsap.ticker.add(tickerUpdate);
    gsap.ticker.lagSmoothing(0);

    // Initial recalculation
    ScrollTrigger.refresh();

    // 4. Proper cleanup on component unmount to prevent memory leaks
    return () => {
      gsap.ticker.remove(tickerUpdate);
      instance.destroy();
      lenisRef.current = null;
      if (globalLenisInstance === instance) {
        globalLenisInstance = null;
      }
      setLenis(null);
    };
  }, []);

  return lenis;
}

export default useLenis;
