import type { CallProvider, ConversationState, Speaker } from "../../types";

const BASE_URL = "https://api.vapi.ai";

/** endedReason substrings that mean the call did not reach a normal conclusion. */
const FAILURE_ENDED_REASON_TOKENS = [
  "error",
  "failed",
  "busy",
  "did-not-answer",
  "no-answer",
  "unanswered",
  "voicemail",
];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

/** Calls the Vapi API and throws with response context on any non-OK status. */
async function vapiFetch(path: string, init?: RequestInit): Promise<Response> {
  const apiKey = requireEnv("VAPI_API_KEY");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    throw new Error(`Vapi request to ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res;
}

interface CreateCallResponse {
  id: string;
}

/** Places the outbound call via Vapi, injecting the brief as prompt variables. */
export const startCall: CallProvider["startCall"] = async (brief, researchSummary) => {
  const assistantId = requireEnv("VAPI_ASSISTANT_ID");
  const phoneNumberId = requireEnv("VAPI_PHONE_NUMBER_ID");

  const res = await vapiFetch("/call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assistantId,
      phoneNumberId,
      customer: { number: brief.hotelPhone },
      assistantOverrides: {
        variableValues: {
          hotel_name: brief.hotelName,
          guest_name: brief.guestName,
          booking_ref: brief.bookingRef,
          objective: brief.objective,
          context: brief.context,
          language: brief.language,
          research: researchSummary,
        },
      },
    }),
  });

  const data = (await res.json()) as CreateCallResponse;
  return data.id;
};

type VapiCallStatus = "scheduled" | "queued" | "ringing" | "in-progress" | "forwarding" | "ended";

interface VapiMessage {
  role: "assistant" | "user" | "system" | "bot" | "function";
  message?: string;
}

interface GetCallResponse {
  status: VapiCallStatus;
  endedReason?: string;
  artifact?: { messages?: VapiMessage[] };
}

function mapRole(role: VapiMessage["role"]): Speaker {
  return role === "assistant" || role === "bot" ? "agent" : "hotel";
}

/** Vapi has no "failed" status of its own — failure is inferred from endedReason once the call ends. */
function mapStatus(data: GetCallResponse): ConversationState["status"] {
  if (data.status !== "ended") return "in-progress";
  const reason = data.endedReason ?? "";
  const isFailure = FAILURE_ENDED_REASON_TOKENS.some((token) => reason.includes(token));
  return isFailure ? "failed" : "done";
}

/** Polls a Vapi call's status and transcript, mapped into provider-neutral shapes. */
export const getConversation: CallProvider["getConversation"] = async (conversationId) => {
  const res = await vapiFetch(`/call/${conversationId}`);
  const data = (await res.json()) as GetCallResponse;
  const messages = data.artifact?.messages ?? [];
  return {
    status: mapStatus(data),
    transcript: messages
      .filter((m) => (m.role === "assistant" || m.role === "user") && Boolean(m.message))
      .map((m) => ({
        speaker: mapRole(m.role),
        text: m.message as string,
      })),
  };
};
