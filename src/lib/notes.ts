import type { Call, CallNotes } from "./types";

const NOTES_SCHEMA = {
  type: "object",
  properties: {
    outcome: { type: "string", enum: ["success", "partial", "declined"] },
    summary: { type: "string" },
    negotiatedTerms: { type: "string" },
    keyQuotes: { type: "array", items: { type: "string" } },
    discrepancies: {
      type: "array",
      items: {
        type: "object",
        properties: {
          topic: { type: "string" },
          claimed: { type: "string" },
          confirmed: { type: "string" },
        },
        required: ["topic", "claimed", "confirmed"],
        additionalProperties: false,
      },
    },
  },
  required: ["outcome", "summary", "negotiatedTerms", "keyQuotes", "discrepancies"],
  additionalProperties: false,
} as const;

function fallbackNotes(call: Call): CallNotes {
  return {
    outcome: "partial",
    summary: "Call completed, but automatic note extraction failed. Review the full transcript below.",
    negotiatedTerms: "",
    keyQuotes: call.transcript.slice(-3).map((t) => t.text),
    discrepancies: [],
  };
}

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
}

export async function generateNotes(call: Call): Promise<CallNotes> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackNotes(call);
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";
  const transcriptText = call.transcript
    .map((turn) => `${turn.speaker.toUpperCase()}: ${turn.text}`)
    .join("\n");
  const researchText = call.research.length
    ? call.research.map((r) => `- ${r.fact} (source: ${r.source})`).join("\n")
    : "(no pre-call research gathered)";

  const prompt = `You are structuring notes from a phone call a travel advisor's AI agent made to a hotel.

Booking objective: ${call.brief.objective}
Guest: ${call.brief.guestName}, booking ref ${call.brief.bookingRef}
Advisor context: ${call.brief.context || "(none provided)"}

Pre-call research about the hotel (may be empty):
${researchText}

Full call transcript:
${transcriptText}

Produce structured notes for the advisor. Set "outcome" based on whether the objective was met.
Populate "discrepancies" ONLY where something confirmed on the call contradicts a specific pre-call research fact (e.g. website claims breakfast included, front desk says it costs extra). Leave it empty if there's no contradiction or no research.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: {
          type: "json_schema",
          json_schema: { name: "call_notes", schema: NOTES_SCHEMA, strict: true },
        },
      }),
    });

    if (!res.ok) {
      return fallbackNotes(call);
    }

    const data = (await res.json()) as ChatCompletionResponse;
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      return fallbackNotes(call);
    }

    const parsed = JSON.parse(text) as CallNotes;
    return {
      outcome: parsed.outcome,
      summary: parsed.summary,
      negotiatedTerms: parsed.negotiatedTerms,
      keyQuotes: parsed.keyQuotes ?? [],
      discrepancies: parsed.discrepancies ?? [],
    };
  } catch {
    return fallbackNotes(call);
  }
}
