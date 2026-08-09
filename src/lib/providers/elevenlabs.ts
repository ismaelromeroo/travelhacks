import type { CallProvider, ConversationState, Speaker } from "../types";

const BASE_URL = "https://api.elevenlabs.io/v1/convai";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

/** Calls the ElevenLabs Convai API and throws with response context on any non-OK status. */
async function elevenLabsFetch(path: string, init?: RequestInit): Promise<Response> {
  const apiKey = requireEnv("ELEVENLABS_API_KEY");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...init?.headers, "xi-api-key": apiKey },
  });
  if (!res.ok) {
    throw new Error(`ElevenLabs request to ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res;
}

interface OutboundCallResponse {
  success: boolean;
  message: string;
  conversation_id: string | null;
}

export const startCall: CallProvider["startCall"] = async (brief, researchSummary) => {
  const agentId = requireEnv("ELEVENLABS_AGENT_ID");
  const agentPhoneNumberId = requireEnv("ELEVENLABS_AGENT_PHONE_NUMBER_ID");

  const res = await elevenLabsFetch("/twilio/outbound-call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agent_id: agentId,
      agent_phone_number_id: agentPhoneNumberId,
      to_number: brief.hotelPhone,
      conversation_initiation_client_data: {
        dynamic_variables: {
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

  const data = (await res.json()) as OutboundCallResponse;
  if (!data.success || !data.conversation_id) {
    throw new Error(`ElevenLabs outbound-call did not return a conversation_id: ${data.message}`);
  }
  return data.conversation_id;
};

interface ConversationResponse {
  status: ConversationState["status"];
  transcript: { role: "user" | "agent"; message?: string; time_in_call_secs: number }[];
}

function mapRole(role: "user" | "agent"): Speaker {
  return role === "agent" ? "agent" : "hotel";
}

export const getConversation: CallProvider["getConversation"] = async (conversationId) => {
  const res = await elevenLabsFetch(`/conversations/${conversationId}`);
  const data = (await res.json()) as ConversationResponse;
  return {
    status: data.status,
    transcript: data.transcript
      .filter((turn) => Boolean(turn.message))
      .map((turn) => ({
        speaker: mapRole(turn.role),
        text: turn.message as string,
      })),
  };
};
