export type Objective = "negotiate_rate" | "confirm_amenity" | "request_upgrade";
export type Language = "en" | "es";
export type CallStatus = "queued" | "in_progress" | "completed" | "failed";
export type Outcome = "success" | "partial" | "declined";

export type Brief = {
  hotelName: string;
  hotelPhone: string;
  guestName: string;
  bookingRef: string;
  objective: Objective;
  context: string;
  language: Language;
};

export type TranscriptLine = {
  speaker: "agent" | "hotel";
  text: string;
  timestamp: string;
};

export type ResearchFact = { fact: string; source: string };
export type Discrepancy = { topic: string; claimed: string; confirmed: string };

export type Notes = {
  outcome: Outcome;
  summary: string;
  negotiatedTerms: string;
  keyQuotes: string[];
  discrepancies: Discrepancy[];
};

export type Call = {
  callId: string;
  status: CallStatus;
  brief: Brief;
  transcript: TranscriptLine[];
  research: ResearchFact[];
  notes: Notes | null;
};

export type CallSummary = {
  callId: string;
  hotelName: string;
  guestName: string;
  objective: Objective;
  status: CallStatus;
  outcome: Outcome | null;
  createdAt: string;
};

export const OBJECTIVES: Record<Objective, string> = {
  negotiate_rate: "Rate negotiation",
  confirm_amenity: "Confirm amenity",
  request_upgrade: "Request upgrade",
};

export const LANGUAGES: Record<Language, string> = {
  en: "en-GB",
  es: "es-ES",
};

/**
 * Languages offered in the brief. `wire` is what actually goes to the backend —
 * the contract is still en|es, so anything else rides as `en` until voice configs land.
 */
export const SPOKEN_LANGUAGES: {
  id: string;
  label: string;
  code: string;
  hue: string;
  tint: string;
  wire: Language;
}[] = [
  { id: "en", label: "English", code: "en-GB", hue: "#1b6ef3", tint: "#eaf1fe", wire: "en" },
  { id: "es", label: "Spanish", code: "es-ES", hue: "#c98a2e", tint: "#fbf1e2", wire: "es" },
  { id: "fr", label: "French", code: "fr-FR", hue: "#7a5af8", tint: "#f0edfe", wire: "en" },
  { id: "de", label: "German", code: "de-DE", hue: "#3a3a3a", tint: "#f3f3f3", wire: "en" },
  { id: "it", label: "Italian", code: "it-IT", hue: "#3f9a63", tint: "#e4f3ea", wire: "en" },
  { id: "pt", label: "Portuguese", code: "pt-PT", hue: "#c6453d", tint: "#fbe9e8", wire: "en" },
  { id: "ar", label: "Arabic", code: "ar-SA", hue: "#2f8f86", tint: "#e3f2f0", wire: "en" },
  { id: "zh", label: "Mandarin", code: "zh-CN", hue: "#c2410c", tint: "#fbede6", wire: "en" },
  { id: "ja", label: "Japanese", code: "ja-JP", hue: "#d98ab0", tint: "#fbedf3", wire: "en" },
];

/** Backend lands at /api. Point NEXT_PUBLIC_API_BASE at /api/mock to use the local fixture server. */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";
