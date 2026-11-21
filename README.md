# Talha Dental Clinic

High-performance cinematic dental clinic experience built with Next.js 16, GSAP ScrollTrigger, Lenis smooth scrolling, and an HTML5 canvas image sequence.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Project Structure

```
src/
  app/
    page.tsx              # Entry point: initializes Lenis + CanvasSequence (960 frames)
    layout.tsx            # Root layout with metadata and fonts
    api/frames/route.ts   # Server API: reports total frame count + preferred extension
  components/
    CanvasSequence.tsx    # Canvas frame driver + ScrollTrigger + background caching
    StoryPads.tsx         # Scroll-driven glassmorphism story pads (Reception 140-208, 10 Service Pads 210-925, Final Relief 930-960)
    HeroOverlay.tsx       # Top navigation + scroll-down indicator
    Preloader.tsx         # Luxury tooth preloader (~2s startup, first 240 frames)
    BookingModal.tsx      # WhatsApp appointment booking modal
  config/
    clinicConfig.ts       # Central config: brand, contact, WhatsApp, 10 dental services
  hooks/
    useLenis.ts           # Lenis smooth scroll hook synced with GSAP ScrollTrigger
  lib/
    frames.ts             # Client frame URL helper
    frames.server.ts      # Server frame count + extension detection
public/
  frames/                 # 960 WebP frames (frame_0001.webp to frame_0960.webp)
```

## Editing Clinic Details

All clinic information lives in a single config file:

**`src/config/clinicConfig.ts`**

Update any field here and it propagates across the hero nav, preloader, booking modal, WhatsApp links, and service pads automatically (zero hardcoded values elsewhere in `src/`).

The config is organized into nested sections:

### `brand`
- `name` — clinic name shown in nav and preloader (e.g. `"Talha Dental"`)
- `tagline` — clinic tagline (e.g. `"Architectural Dentistry & Implantology"`)
- `description` — optional brand description

### `contact`
- `whatsappNumber` — WhatsApp number with country code, **without `+`** (e.g. `"923001234567"`)
- `whatsappDefaultMessage` — default message pre-filled in WhatsApp
- `phoneDisplay` — display-formatted phone number shown to users (e.g. `"+92 300 1234567"`)
- `phone` — raw digits used for `tel:` links
- `email` — contact email (e.g. `"info@talhadental.com"`)
- `address` — clinic address (e.g. `"Lahore, Pakistan"`)
- `workingHours` — clinic working hours (e.g. `"Mon - Sat: 10:00 AM - 8:00 PM"`)

### `bookingIntegration`
- `mode` — `"whatsapp" | "webhook" | "both"` (default `"both"`)
- `webhookUrl` — optional Formspree, Web3Forms, or custom Booking API endpoint URL
- `apiKey` — optional Web3Forms or CRM API key (sent as `access_key`)

When `mode` includes `"webhook"` and a `webhookUrl` is set, submitting the booking form `POST`s the form data (`name`, `phone`, `service`, `preferredDate`, `notes`) as JSON to the webhook. When `mode` includes `"whatsapp"`, a pre-filled WhatsApp message is opened. A 1-click "Confirm via WhatsApp" button is offered after a webhook submission.

### `doctor`
- `name` — doctor name (e.g. `"Dr. Talha"`)
- `credentials` — doctor credentials (e.g. `"BDS, RDS"`)
- `experience` — doctor experience summary

### `services`
Array of 10 `DentalService` objects (`id`, `name`, `tagline`, `description`) used by the service pads and booking modal.

### Helper methods
- `clinicConfig.getWhatsAppUrl(customMessage?)` — builds a `wa.me` link
- `clinicConfig.getPhoneUrl()` — builds a `tel:` link
- `clinicConfig.getEmailUrl()` — builds a `mailto:` link
- `clinicConfig.getBookingWhatsAppMessage(fields)` — builds a pre-filled WhatsApp booking message from form fields

## Frame Timings (do not change)

Total frame count is **960** and must remain unchanged:

- Reception Pad ("Book an Appointment"): frames 140–208
- 10 individual Service Pads: frames 210–925
- Lead Doctor Profile Pad ("Dr. Talha"): frames 930–960

## Available Scripts

- `npm run dev` — start development server (Turbopack)
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — run ESLint
- `npx tsc --noEmit` — TypeScript type check
