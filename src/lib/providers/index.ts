import type { CallProvider, CallStatus, ProviderConversationStatus } from "../types";
import * as elevenLabsProvider from "./elevenlabs";
import * as mockProvider from "./mock";

export function getProvider(): CallProvider {
  return process.env.CALL_MODE === "live" ? elevenLabsProvider : mockProvider;
}

/** Collapses a provider's conversation status into this app's simpler call lifecycle. */
export function mapConversationStatus(providerStatus: ProviderConversationStatus): CallStatus {
  if (providerStatus === "done") return "completed";
  if (providerStatus === "failed") return "failed";
  return "in_progress";
}
