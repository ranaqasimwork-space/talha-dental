"use client";

import React from "react";
import { clinicConfig, DentalService } from "@/config/clinicConfig";

interface StoryPadsProps {
  currentFrame: number;
  onOpenBooking: (serviceName?: string) => void;
}

// Frame ranges for the 10 individual service pads (210 to 925)
const SERVICE_PAD_RANGES = [
  { start: 210, end: 280 },
  { start: 281, end: 352 },
  { start: 353, end: 423 },
  { start: 424, end: 495 },
  { start: 496, end: 566 },
  { start: 567, end: 638 },
  { start: 639, end: 709 },
  { start: 710, end: 781 },
  { start: 782, end: 852 },
  { start: 853, end: 925 },
] as const;

export default function StoryPads({
  currentFrame,
  onOpenBooking,
}: StoryPadsProps) {
  // Stage 1: Reception Pad (Frames 140 to 208)
  const isStage1Active = currentFrame >= 140 && currentFrame <= 208;

  // Stage 3: Final Relief Pad (Frames 930 to 960)
  const isStage3Active = currentFrame >= 930 && currentFrame <= 960;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden">
      {/* ========================================================
          STAGE 1: Reception Pad (Frames 140 to 208)
          Centered near middle of screen, compact refined square glass pad
          ======================================================== */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out ${
          isStage1Active
            ? "opacity-100 scale-100 filter-none pointer-events-auto"
            : "opacity-0 scale-95 blur-sm pointer-events-none"
        }`}
      >
        <div className="w-[320px] sm:w-[360px] aspect-square rounded-2xl p-6 sm:p-7 backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl flex flex-col items-center justify-between text-center relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />

          {/* Top Micro-Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 border border-white/10 text-[10px] font-mono tracking-widest text-cyan-300 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Reception Desk</span>
          </div>

          {/* Center Content & Primary Functional Button */}
          <div className="my-auto py-2 flex flex-col items-center">
              <h3 className="text-xl sm:text-2xl font-light text-white tracking-tight leading-snug">
                Welcome to {clinicConfig.brand.name}
              </h3>
            <p className="mt-2 text-xs text-neutral-300 font-light leading-relaxed max-w-[240px]">
              Step into tailored, calm clinical hospitality.
            </p>

            <button
              type="button"
              onClick={() => onOpenBooking()}
              className="mt-5 px-6 py-3 rounded-full text-xs font-mono font-medium tracking-wider text-black bg-white hover:bg-neutral-200 transition-all duration-200 shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:shadow-[0_0_35px_rgba(255,255,255,0.5)] active:scale-95 cursor-pointer"
            >
              Book an Appointment
            </button>
          </div>

          {/* Stylish Subtitle with Downward Pulse */}
          <div className="flex flex-col items-center gap-1.5 text-neutral-300">
            <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-300">
              Scroll to see services
            </span>
            <div className="w-4 h-4 text-cyan-400 animate-bounce">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          STAGE 2: 10 Individual Scroll-Driven Service Pads (Frames 210 to 925)
          Only ONE pad visible at a time at bottom-6 left-6, cross-fading/sliding
          ======================================================== */}
      {clinicConfig.services.map((service: DentalService, index: number) => {
        const range = SERVICE_PAD_RANGES[index];
        const isActive =
          currentFrame >= range.start && currentFrame <= range.end;
        const step = `${String(index + 1).padStart(2, "0")} / 10`;

        return (
          <div
            key={service.id}
            className={`absolute bottom-6 left-6 z-40 max-w-sm w-[calc(100%-3rem)] sm:w-[370px] transition-all duration-700 ease-out ${
              isActive
                ? "opacity-100 translate-y-0 filter-none pointer-events-auto"
                : "opacity-0 -translate-y-4 pointer-events-none"
            }`}
          >
            <div className="rounded-2xl p-6 backdrop-blur-md bg-black/45 border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.7)] text-white overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-cyan-400 tracking-wider uppercase">
                  {step}
                </span>
                <h3 className="text-lg font-bold text-white leading-tight">
                  {service.name}
                </h3>
              </div>

              <p className="text-[12px] text-neutral-300 font-light leading-relaxed line-clamp-2 mb-4">
                {service.description}
              </p>

              <div className="mt-auto pt-3 border-t border-white/10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenBooking(service.name)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-[11px] font-mono font-medium tracking-wider text-black bg-white hover:bg-neutral-200 transition-all duration-200 shadow-[0_0_15px_rgba(255,255,255,0.2)] active:scale-95 cursor-pointer text-center"
                >
                  Get in Touch
                </button>

                <a
                  href={clinicConfig.getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Contact via WhatsApp"
                  className="w-9 h-9 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-400 hover:text-emerald-300 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-[0_0_15px_rgba(52,211,153,0.2)] active:scale-95"
                >
                  <svg className="w-5 h-5 fill-currentColor" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.966.527 1.836.88 2.791.88 3.181 0 5.767-2.587 5.768-5.766.001-3.181-2.585-5.766-5.768-5.766zm9.969 5.766c0 5.405-4.394 9.799-9.799 9.799-1.688 0-3.273-.432-4.662-1.189l-5.539 1.452 1.48-5.405c-.86-1.442-1.359-3.136-1.359-4.94 0-5.405 4.394-9.799 9.799-9.799 5.405 0 9.799 4.394 9.799 9.799z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        );
      })}

      {/* ========================================================
          STAGE 3: Lead Doctor Profile Pad (Frames 930 to 960)
          Side-positioned Apple-style dark glassmorphism pad
          ======================================================== */}
      <div
        className={`absolute bottom-6 left-6 z-40 transition-all duration-600 ease-out max-w-md w-[calc(100%-3rem)] sm:w-[340px] ${
          isStage3Active
            ? "opacity-100 translate-y-0 filter-none pointer-events-auto"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="rounded-2xl p-6 backdrop-blur-md bg-black/50 border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.7)] text-white overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono text-cyan-400/80 tracking-wider uppercase">
              Lead Dental Surgeon
            </span>
          </div>

          <h3 className="text-lg font-bold text-white leading-tight mb-2">
            {clinicConfig.doctor.name}
          </h3>

          <p className="text-[12px] text-neutral-300 font-light leading-relaxed mb-2">
            {clinicConfig.doctor.credentials}
          </p>
          <p className="text-[12px] text-neutral-300 font-light leading-relaxed mb-6">
            {clinicConfig.doctor.experience}
          </p>

          <div className="pt-3 border-t border-white/10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenBooking()}
              className="flex-1 py-2.5 px-4 rounded-xl text-[11px] font-mono font-medium tracking-wider text-black bg-white hover:bg-neutral-200 transition-all duration-200 shadow-[0_0_15px_rgba(255,255,255,0.2)] active:scale-95 cursor-pointer text-center"
            >
              Book Consultation
            </button>

            <a
              href={clinicConfig.getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact via WhatsApp"
              className="w-9 h-9 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-400 hover:text-emerald-300 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-[0_0_15px_rgba(52,211,153,0.2)] active:scale-95"
            >
              <svg className="w-5 h-5 fill-currentColor" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.966.527 1.836.88 2.791.88 3.181 0 5.767-2.587 5.768-5.766.001-3.181-2.585-5.766-5.768-5.766zm9.969 5.766c0 5.405-4.394 9.799-9.799 9.799-1.688 0-3.273-.432-4.662-1.189l-5.539 1.452 1.48-5.405c-.86-1.442-1.359-3.136-1.359-4.94 0-5.405 4.394-9.799 9.799-9.799 5.405 0 9.799 4.394 9.799 9.799z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
