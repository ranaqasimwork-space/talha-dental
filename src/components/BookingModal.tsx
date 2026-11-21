"use client";

import React, { useState, useEffect } from "react";
import { clinicConfig } from "@/config/clinicConfig";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultService?: string;
}

export default function BookingModal({
  isOpen,
  onClose,
  defaultService,
}: BookingModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState(
    defaultService || clinicConfig.services[0].name
  );
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [webhookSent, setWebhookSent] = useState(false);

  useEffect(() => {
    if (defaultService) {
      setService(defaultService);
    }
  }, [defaultService]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setWebhookSent(false);

    const formData = {
      name,
      phone,
      service,
      preferredDate: date,
      notes,
    };

    const mode = clinicConfig.bookingIntegration.mode;

    // 1. POST to webhook API if configured
    if (
      (mode === "webhook" || mode === "both") &&
      clinicConfig.bookingIntegration.webhookUrl
    ) {
      try {
        const body: Record<string, unknown> = {
          ...formData,
        };
        if (clinicConfig.bookingIntegration.apiKey) {
          body.access_key = clinicConfig.bookingIntegration.apiKey;
        }
        await fetch(clinicConfig.bookingIntegration.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        setWebhookSent(true);
      } catch {
        // Webhook failure is non-fatal; still offer WhatsApp fallback
      }
    }

    // 2. Open pre-filled WhatsApp if configured
    if (mode === "whatsapp" || mode === "both") {
      const message = clinicConfig.getBookingWhatsAppMessage(formData);
      const url = clinicConfig.getWhatsAppUrl(message);
      window.open(url, "_blank", "noopener,noreferrer");
    }

    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-neutral-950/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isSubmitted ? (
          <div className="py-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            {clinicConfig.bookingIntegration.mode !== "whatsapp" && webhookSent ? (
              <>
                <h3 className="text-xl font-light text-white">Booking Sent to API</h3>
                <p className="mt-2 text-xs text-neutral-400 font-mono">
                  Your request has been submitted to our booking system.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const message = clinicConfig.getBookingWhatsAppMessage({
                      name,
                      phone,
                      service,
                      preferredDate: date,
                      notes,
                    });
                    window.open(
                      clinicConfig.getWhatsAppUrl(message),
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  className="mt-5 px-6 py-2.5 rounded-full text-xs font-mono font-medium tracking-wider text-black bg-white hover:bg-neutral-200 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 cursor-pointer"
                >
                  1-Click Confirm via WhatsApp
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-light text-white">Opening WhatsApp...</h3>
                <p className="mt-2 text-xs text-neutral-400 font-mono">
                  Connecting you directly to our clinical concierge.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-400">
                Talha Concierge
              </span>
              <h3 className="text-2xl font-light text-white mt-1">
                Book an Appointment
              </h3>
              <p className="text-xs text-neutral-400 font-light mt-1.5 leading-relaxed">
                Schedule your private dental consultation. Direct confirmation via WhatsApp.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Julian Meyer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5">
                  Phone / WhatsApp Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder={clinicConfig.contact.phoneDisplay}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5">
                  Preferred Treatment
                </label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                >
                  {clinicConfig.services.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5">
                  Additional Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                  rows={2}
                  placeholder="Any special requests or questions..."
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-full text-xs font-mono font-medium tracking-wider text-black bg-white hover:bg-neutral-200 transition-all duration-200 shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:shadow-[0_0_35px_rgba(255,255,255,0.4)] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.966.527 1.836.88 2.791.88 3.181 0 5.767-2.587 5.768-5.766.001-3.181-2.585-5.766-5.768-5.766zm9.969 5.766c0 5.405-4.394 9.799-9.799 9.799-1.688 0-3.273-.432-4.662-1.189l-5.539 1.452 1.48-5.405c-.86-1.442-1.359-3.136-1.359-4.94 0-5.405 4.394-9.799 9.799-9.799 5.405 0 9.799 4.394 9.799 9.799z" />
                  </svg>
                  <span>
                    {clinicConfig.bookingIntegration.mode === "webhook"
                      ? "Submit to API"
                      : clinicConfig.bookingIntegration.mode === "whatsapp"
                        ? "Open WhatsApp"
                        : "Submit & Open WhatsApp"}
                  </span>
                </button>
              </div>

              <div className="pt-3 text-center border-t border-white/10">
                <p className="text-[11px] text-neutral-400">
                  Or call directly:{" "}
                  <a
                    href={clinicConfig.getPhoneUrl()}
                    className="text-cyan-400 font-mono hover:underline ml-1"
                  >
                    {clinicConfig.contact.phoneDisplay}
                  </a>
                </p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
