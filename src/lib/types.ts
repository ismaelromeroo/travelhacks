export type Objective = "negotiate_rate" | "confirm_amenity" | "request_upgrade";
export type Language = "en" | "es";
export type CallStatus = "queued" | "in_progress" | "completed" | "failed";
export type CallOutcome = "success" | "partial" | "declined";
export type Speaker = "agent" | "hotel";

export interface CallBrief {
  hotelName: string;
  hotelPhone: string;
  guestName: string;
  bookingRef: string;
  objective: Objective;
  context: string;
  language: Language;
}

export interface TranscriptTurn {
  speaker: Speaker;
  text: string;
  timestamp: string;
}

export interface ResearchFact {
  fact: string;
  source: string;
}

export interface Discrepancy {
  topic: string;
  claimed: string;
  confirmed: string;
}

export interface CallNotes {
  outcome: CallOutcome;
  summary: string;
  negotiatedTerms: string;
  keyQuotes: string[];
  discrepancies: Discrepancy[];
}

/** Per-call provider override; absent means the CALL_MODE env default. */
export type CallMode = "mock" | "live";

export interface Call {
  callId: string;
  status: CallStatus;
  brief: CallBrief;
  transcript: TranscriptTurn[];
  notes: CallNotes | null;
  research: ResearchFact[];
  createdAt: string;
  conversationId?: string;
  mode?: CallMode;
}

export interface CallSummary {
  callId: string;
  hotelName: string;
  guestName: string;
  objective: Objective;
  status: CallStatus;
  outcome: CallOutcome | null;
  createdAt: string;
}

/** Raw turn as returned by a call provider, before we stamp our own timestamp. */
export interface ProviderTranscriptTurn {
  speaker: Speaker;
  text: string;
}

export type ProviderConversationStatus =
  | "initiated"
  | "in-progress"
  | "processing"
  | "done"
  | "failed";

export interface ConversationState {
  status: ProviderConversationStatus;
  transcript: ProviderTranscriptTurn[];
}

export interface CallProvider {
  /** Starts the call and returns a provider-specific conversation id to poll. */
  startCall(brief: CallBrief, researchSummary: string): Promise<string>;
  getConversation(conversationId: string): Promise<ConversationState>;
}

/* ---- UI ---- */

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
  { id: "ar", label: "Arabic", code: "ar-SA", hue: "#2f8f86", tint: "#e3f2f0", wire: "en" },
  { id: "zh", label: "Mandarin", code: "zh-CN", hue: "#c2410c", tint: "#fbede6", wire: "en" },
  // The agent picks from the hotel's country. Speech input falls back to en-US.
  { id: "auto", label: "Let the agent pick", code: "auto", hue: "#0a0a0a", tint: "#f3f3f3", wire: "en" },
];

export const SPEECH_FALLBACK_CODE = "en-US";

/**
 * Sent for phone / booking ref when the advisor picks "let the agent find it".
 * The backend requires both fields non-empty, so this is a plain instruction it
 * can pass through to the agent rather than a blank.
 */
export const AGENT_LOOKUP = {
  phone: "to be looked up",
  // Spoken aloud by the agent ("calling about booking reference …"), so keep it short.
  bookingRef: "on file",
} as const;
