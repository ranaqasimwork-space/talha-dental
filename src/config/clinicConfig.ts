/**
 * Central Clinic Configuration File
 *
 * Single source of truth for all clinic contact details, WhatsApp numbers,
 * doctor info, and booking API/webhook settings. Update everything here and
 * it propagates across the hero nav, booking modal, WhatsApp links, and
 * service pads automatically (zero hardcoded values elsewhere in `src/`).
 */

export interface DentalService {
  id: string;
  name: string;
  tagline: string;
  description: string;
}

/**
 * Brand identity shown in the nav, preloader, and pads.
 */
export interface BrandInfo {
  name: string;
  tagline: string;
  description?: string;
}

/**
 * Contact details (Easily editable here).
 */
export interface ContactInfo {
  /** WhatsApp number with country code, without '+' or spaces (e.g. "923001234567") */
  whatsappNumber: string;
  whatsappDefaultMessage: string;
  /** Display-formatted phone number shown to users */
  phoneDisplay: string;
  /** Raw digits used for tel: links */
  phone: string;
  email: string;
  address: string;
  workingHours: string;
}

/**
 * Booking integration: WhatsApp and/or API webhook.
 */
export interface BookingIntegration {
  mode: "whatsapp" | "webhook" | "both";
  /** Optional: Paste Formspree, Web3Forms, or custom Booking API endpoint URL here */
  webhookUrl: string;
  /** Optional: Paste Web3Forms or CRM API key here */
  apiKey: string;
}

/**
 * Lead doctor information.
 */
export interface DoctorInfo {
  name: string;
  credentials: string;
  experience: string;
}

export const clinicConfig = {
  // ---------------------------------------------------------------------------
  // brand
  // ---------------------------------------------------------------------------
  brand: {
    name: "Talha Dental",
    tagline: "Architectural Dentistry & Implantology",
    description:
      "High-performance cinematic dental clinic experience built with modern web technologies.",
  },

  // ---------------------------------------------------------------------------
  // contact
  // ---------------------------------------------------------------------------
  contact: {
    whatsappNumber: "923001234567", // Enter WhatsApp number with country code without '+'
    whatsappDefaultMessage:
      "Hello Talha Dental, I would like to book a dental consultation.",
    phoneDisplay: "+92 300 1234567",
    phone: "923001234567",
    email: "info@talhadental.com",
    address: "Lahore, Pakistan",
    workingHours: "Mon - Sat: 10:00 AM - 8:00 PM",
  },

  // ---------------------------------------------------------------------------
  // bookingIntegration
  // ---------------------------------------------------------------------------
  bookingIntegration: {
    mode: "both",
    webhookUrl: "", // Optional: Paste Formspree, Web3Forms, or custom Booking API endpoint URL here
    apiKey: "", // Optional: Paste Web3Forms or CRM API key here
  },

  // ---------------------------------------------------------------------------
  // doctor
  // ---------------------------------------------------------------------------
  doctor: {
    name: "Dr. Talha",
    credentials: "BDS, RDS",
    experience:
      "6 years of clinical experience in dentistry, including house job training at CMH Lahore.",
  },

  // ---------------------------------------------------------------------------
  // services
  // ---------------------------------------------------------------------------
  services: [
    {
      id: "whitening",
      name: "Teeth Whitening",
      tagline: "Laser & Custom Tray Radiance",
      description:
        "Professional in-office laser activation and custom-fitted trays brightening your smile up to 8 shades with zero enamel erosion.",
    },
    {
      id: "braces",
      name: "Fixed Braces",
      tagline: "Precision Orthodontic Alignment",
      description:
        "High-grade ceramic and low-profile metal bracket systems engineered for comprehensive bite correction and lifelong stability.",
    },
    {
      id: "crown-bridge",
      name: "Crown & Bridge",
      tagline: "Biomimetic Tooth Restoration",
      description:
        "Custom-milled porcelain prosthetics that seamlessly restore compromised dentition, replicating natural anatomy and chewing force.",
    },
    {
      id: "fillings",
      name: "Tooth Colored Fillings",
      tagline: "Invisible Composite Bonding",
      description:
        "Multi-shaded biomimetic composite resins bonded seamlessly with your natural tooth matrix, eliminating silver amalgam completely.",
    },
    {
      id: "root-canal",
      name: "Root Canal Treatment",
      tagline: "Microscope-Guided Endodontics",
      description:
        "Gentle, high-magnification canal debridement delivering immediate pain relief while permanently salvaging your natural tooth.",
    },
    {
      id: "scaling",
      name: "Scaling & Polishing",
      tagline: "Ultrasonic Prophylaxis Care",
      description:
        "Sub-gingival ultrasonic biofilm removal and gentle diamond air-polishing to safeguard periodontal health and prevent staining.",
    },
    {
      id: "implants",
      name: "Implants",
      tagline: "Titanium & Zirconia Roots",
      description:
        "3D computer-guided placement of surgical-grade implants for lifetime bone preservation and permanent tooth replacement.",
    },
    {
      id: "zirconia",
      name: "Zirconia Crown & Bridge",
      tagline: "Diamond-Hard Monolithic Esthetics",
      description:
        "Indestructible, biocompatible monolithic zirconia designed with natural optical translucency for supreme esthetics and longevity.",
    },
    {
      id: "dentures",
      name: "Dentures",
      tagline: "Precision Functional Prosthetics",
      description:
        "Ultra-lightweight anatomical full and partial prosthetics engineered for comfortable suction, clear speech, and confident chewing.",
    },
    {
      id: "invisalign",
      name: "Invisalign Aligners",
      tagline: "Discreet Clear Aligners",
      description:
        "Virtually invisible, removable clear aligners custom 3D-planned with SmartTrack material for gentle, predictable teeth straightening.",
    },
  ] as DentalService[],

  // ---------------------------------------------------------------------------
  // helper generators for direct action links
  // ---------------------------------------------------------------------------
  getWhatsAppUrl(customMessage?: string): string {
    const text = encodeURIComponent(
      customMessage || clinicConfig.contact.whatsappDefaultMessage
    );
    return `https://wa.me/${clinicConfig.contact.whatsappNumber}?text=${text}`;
  },

  getPhoneUrl(): string {
    return `tel:${clinicConfig.contact.phone.replace(/[\s()-]/g, "")}`;
  },

  getEmailUrl(): string {
    return `mailto:${clinicConfig.contact.email}?subject=Consultation%20Inquiry`;
  },

  /**
   * Build a pre-filled WhatsApp booking message from booking form fields.
   */
  getBookingWhatsAppMessage(fields: {
    name?: string;
    phone?: string;
    service?: string;
    preferredDate?: string;
    notes?: string;
  }): string {
    const message =
      `Hello ${clinicConfig.brand.name}, my name is ${fields.name || "a prospective patient"}. ` +
      `I would like to schedule a consultation for "${fields.service || ""}" ` +
      `on ${fields.preferredDate || "the earliest available date"}. ` +
      `My contact number is: ${fields.phone || "provided in chat"}.` +
      (fields.notes ? ` Notes: ${fields.notes}` : "");
    return message;
  },
};

export default clinicConfig;
