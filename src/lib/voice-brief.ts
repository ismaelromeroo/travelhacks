import type { Objective } from "./types";

/**
 * Frontend-only brain for the spoken brief. The agent asks about one field at a
 * time, so "extraction" is just cleaning up the answer to the question it asked.
 *
 * ponytail: keyword matching, not an LLM. When the backend exposes a real
 * conversational agent, replace QUESTIONS + parseAnswer and the UI stays put.
 */

export type BriefField =
  | "hotelName"
  | "guestName"
  | "hotelPhone"
  | "bookingRef"
  | "objectiveText"
  | "context";

export const QUESTIONS: Record<BriefField, string> = {
  hotelName: "Which hotel should I call?",
  guestName: "Who is the guest?",
  hotelPhone: "What number should I dial?",
  bookingRef: "What is the booking reference?",
  objectiveText: "What should I try to get out of this call?",
  context: "Anything else I should know before I dial?",
};

/** Asked in this order, skipping fields that are already filled. */
export const FIELD_ORDER: BriefField[] = [
  "hotelName",
  "guestName",
  "objectiveText",
  "hotelPhone",
  "bookingRef",
  "context",
];

const OBJECTIVE_HINTS: [Objective, RegExp][] = [
  ["request_upgrade", /\b(?:upgrade|suite|better room)\b/i],
  ["confirm_amenity", /\b(?:breakfast|wifi|amenit\w*|parking|pool|included)\b/i],
  ["negotiate_rate", /\b(?:rate|price|nightly|discount|cheaper|negotiat\w*|euro|dollar)\b/i],
];

/** Maps a free-text goal onto the closest objective enum, or null if unclear. */
export function guessObjective(text: string): Objective | null {
  return OBJECTIVE_HINTS.find(([, re]) => re.test(text))?.[0] ?? null;
}

/** Speech comes back as a loose sentence. Tidy it per field. */
export function parseAnswer(field: BriefField, spoken: string): string {
  const text = spoken.trim().replace(/\s+/g, " ");
  if (!text) return "";

  if (field === "hotelPhone") {
    const digits = text.replace(/[^\d+]/g, "");
    return digits.length >= 6 ? digits : text;
  }
  if (field === "bookingRef") {
    // "b k dash four four seven one" comes back messy; keep it short and upper.
    return text.replace(/\s+/g, "").toUpperCase();
  }
  if (field === "hotelName" || field === "guestName") {
    return text.replace(/[.,]$/, "").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return text.replace(/^(um|uh|so|okay|ok)[,\s]+/i, "");
}

/** Answers that mean "nothing to add" rather than a value. Whole-utterance only, so "no smoking room" still counts as an answer. */
export function isSkip(text: string): boolean {
  return /^(?:no|nope|nothing|skip|that'?s (?:it|all)|none)[.!]?$/i.test(text.trim());
}
