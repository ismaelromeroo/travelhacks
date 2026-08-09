import type { CallMode, CallProvider, CallStatus, ProviderConversationStatus } from "../../types";
import * as vapiProvider from "./vapi";
import * as mockProvider from "./mock";

/** Per-call mode wins; otherwise the CALL_MODE env default. */
export function getProvider(mode?: CallMode): CallProvider {
  const effective = mode ?? (process.env.CALL_MODE === "live" ? "live" : "mock");
  return effective === "live" ? vapiProvider : mockProvider;
}

/** Collapses a provider's conversation status into this app's simpler call lifecycle. */
export function mapConversationStatus(providerStatus: ProviderConversationStatus): CallStatus {
  if (providerStatus === "done") return "completed";
  if (providerStatus === "failed") return "failed";
  return "in_progress";
}
