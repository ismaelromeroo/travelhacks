import type { Call, CallNotes } from "./types";

const NOTES_SCHEMA = {
  type: "OBJECT",
  properties: {
    outcome: { type: "STRING", enum: ["success", "partial", "declined"] },
    summary: { type: "STRING" },
    negotiatedTerms: { type: "STRING" },
    keyQuotes: { type: "ARRAY", items: { type: "STRING" } },
    discrepancies: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          topic: { type: "STRING" },
          claimed: { type: "STRING" },
          confirmed: { type: "STRING" },
        },
        required: ["topic", "claimed", "confirmed"],
      },
    },
  },
  required: ["outcome", "summary", "negotiatedTerms", "keyQuotes", "discrepancies"],
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

interface GenerateContentResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export async function generateNotes(call: Call): Promise<CallNotes> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallbackNotes(call);
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
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
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: NOTES_SCHEMA,
          },
        }),
      }
    );

    if (!res.ok) {
      return fallbackNotes(call);
    }

    const data = (await res.json()) as GenerateContentResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
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
