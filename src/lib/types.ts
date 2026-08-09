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

export interface Call {
  callId: string;
  status: CallStatus;
  brief: CallBrief;
  transcript: TranscriptTurn[];
  notes: CallNotes | null;
  research: ResearchFact[];
  createdAt: string;
  conversationId?: string;
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
