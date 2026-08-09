import type { Call } from "./types";

declare global {
  var __callDeskStore: Map<string, Call> | undefined;
}

export const callStore: Map<string, Call> = globalThis.__callDeskStore ?? new Map();
globalThis.__callDeskStore = callStore;

/** Strips provider-internal fields (e.g. conversationId) before a Call is sent to the client. */
export function toPublicCall(call: Call): Omit<Call, "conversationId"> {
  const publicCall = { ...call };
  delete publicCall.conversationId;
  return publicCall;
}
