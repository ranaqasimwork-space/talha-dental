"use client";

import CanvasSequence from "@/components/CanvasSequence";
import { useLenis } from "@/hooks/useLenis";

export default function Home() {
  // Initialize Lenis smooth scrolling with cinematic easing (lerp: 0.08, smoothWheel: true)
  useLenis();

  return (
    <main className="relative w-full overflow-x-hidden bg-black">
      <CanvasSequence totalFrames={960} initialPreloadCount={60} />
    </main>
  );
}
