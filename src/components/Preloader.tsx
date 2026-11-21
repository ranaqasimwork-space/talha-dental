"use client";

import React from "react";
import { clinicConfig } from "@/config/clinicConfig";

export interface PreloaderProps {
  progress: number;
  preloadedCount: number;
  targetCount: number;
  isComplete: boolean;
  isHidden: boolean;
}

export default function Preloader({
  progress,
  preloadedCount,
  targetCount,
  isComplete,
  isHidden,
}: PreloaderProps) {
  if (isHidden) return null;

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-black backdrop-blur-md transition-opacity duration-1000 ease-out ${
        isComplete ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative flex flex-col items-center max-w-sm w-full px-6">
        {/* Luxury Tooth Icon with Shimmer Ring */}
        <div className="relative mb-10">
          <div className="absolute inset-0 flex items-center justify-center animate-pulse">
            <div className="w-32 h-32 rounded-full border border-cyan-500/20 animate-[spin_10s_linear_infinite]" />
          </div>
          <div className="relative z-10 w-24 h-24 rounded-full border border-cyan-500/30 bg-black/40 backdrop-blur-md flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.25)]">
            <svg
              className="w-12 h-12 text-white drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>

        {/* Clinic Name */}
        <h2 className="text-3xl font-light tracking-tight text-white mb-1">
          {clinicConfig.brand.name}
        </h2>
        <p className="text-xs font-mono tracking-widest text-cyan-400/70 uppercase mb-8">
          {clinicConfig.brand.tagline}
        </p>

        {/* Sleek Progress Bar */}
        <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden mb-6 border border-neutral-800/50">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Frame Progress Metrics */}
        <div className="flex justify-between w-full text-[10px] font-mono text-neutral-500 tracking-widest uppercase mb-2">
          <span>Loading Sequence</span>
          <span>{preloadedCount} / {targetCount}</span>
        </div>

        <p className="text-[10px] text-neutral-600 tracking-widest uppercase">
          Preparing cinematic experience
        </p>
      </div>
    </div>
  );
}
