"use client";

import React, { useEffect, useState } from "react";
import { clinicConfig } from "@/config/clinicConfig";

interface HeroOverlayProps {
  isVisible: boolean;
  onOpenBooking?: () => void;
  onAbout?: () => void;
}

export default function HeroOverlay({
  isVisible,
  onOpenBooking,
  onAbout,
}: HeroOverlayProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Transition navbar to glassmorphic blur and hide scroll-down cue once scrolling starts
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      {/* Top Navigation Bar: Transparent initially, transitions to glassmorphism on scroll */}
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ease-out select-none ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        } ${
          isScrolled
            ? "bg-black/25 backdrop-blur-md border-b border-white/5 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
            : "bg-transparent border-b border-transparent py-6"
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 flex items-center justify-between">
          {/* Top-Left: Clean Dental Clinic Brand Mark & Logo */}
          <div className="flex items-center gap-3 pointer-events-auto cursor-pointer group">
            {/* Minimalist Architectural Tooth Contour Icon */}
            <div className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-sm flex items-center justify-center transition-colors group-hover:border-cyan-500/40 group-hover:bg-cyan-950/20">
              <svg
                className="w-5 h-5 text-cyan-400 transition-transform group-hover:scale-105 duration-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2C8.5 2 6 4.5 6 8c0 3.5 1.5 8 3 13 1-1.5 2-4 3-4s2 2.5 3 4c1.5-5 3-9.5 3-13 0-3.5-2.5-6-6-6z" />
                <path d="M10 7c.8-.7 1.4-.7 2 0 .6-.7 1.2-.7 2 0" />
              </svg>
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-light tracking-[0.22em] uppercase text-white font-sans transition-colors group-hover:text-cyan-200">
                {clinicConfig.brand.name}
              </span>
              <span className="text-[9px] tracking-[0.25em] text-neutral-400 font-mono uppercase mt-0.5">
                {clinicConfig.brand.tagline}
              </span>
            </div>
          </div>

          {/* Top-Right: Minimal Navigation Links & Interactive Action Buttons */}
          <nav className="pointer-events-auto flex items-center gap-6 sm:gap-8">
            <div className="hidden sm:flex items-center gap-6 text-xs font-mono tracking-wider text-neutral-300">
              <a
                href={clinicConfig.getWhatsAppUrl("Hello, I would like to know more about your clinic services.")}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-400 transition-colors duration-200"
              >
                Services
              </a>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  onAbout?.();
                }}
                className="hover:text-cyan-400 transition-colors duration-200 cursor-pointer"
              >
                About
              </a>
              <a
                href={clinicConfig.getPhoneUrl()}
                className="hover:text-cyan-400 transition-colors duration-200"
              >
                Contact
              </a>
            </div>

            <button
              type="button"
              onClick={onOpenBooking || (() => window.open(clinicConfig.getWhatsAppUrl(), "_blank"))}
              className="px-4 py-2 rounded-full text-xs font-mono font-medium tracking-wider text-black bg-white hover:bg-neutral-200 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.35)] active:scale-95 cursor-pointer inline-block"
            >
              Consultation
            </button>
          </nav>
        </div>
      </header>

      {/* Bottom Center: Subtle Animated Scroll-Down Indicator (Fades out when scroll begins) */}
      <div
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center gap-2.5 transition-all duration-700 ease-out select-none ${
          isVisible && !isScrolled
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <span className="text-[9px] font-mono tracking-[0.3em] uppercase text-neutral-400">
          Scroll
        </span>

        {/* Minimal Mouse Track Indicator with Animated Dot */}
        <div className="w-5 h-8 rounded-full border border-neutral-600/60 bg-black/30 backdrop-blur-sm flex justify-center pt-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
          <div className="w-1 h-2 rounded-full bg-cyan-400 animate-bounce" />
        </div>
      </div>
    </>
  );
}
