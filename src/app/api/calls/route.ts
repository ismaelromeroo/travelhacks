import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/providers";
import { gatherResearch } from "@/lib/research";
import { callStore } from "@/lib/store";
import type { Call, CallBrief, CallSummary, Language, Objective } from "@/lib/types";

const OBJECTIVES = new Set<Objective>(["negotiate_rate", "confirm_amenity", "request_upgrade"]);
const LANGUAGES = new Set<Language>(["en", "es"]);
const REQUIRED_STRING_FIELDS = ["hotelName", "hotelPhone", "guestName", "bookingRef", "objective", "language"] as const;

function validateBrief(body: unknown): CallBrief {
  if (typeof body !== "object" || body === null) {
    throw new Error("Request body must be a JSON object");
  }
  const b = body as Record<string, unknown>;

  for (const field of REQUIRED_STRING_FIELDS) {
    if (typeof b[field] !== "string" || (b[field] as string).trim() === "") {
      throw new Error(`Missing or invalid field: ${field}`);
    }
  }
  if (!OBJECTIVES.has(b.objective as Objective)) {
    throw new Error(`Invalid objective: ${String(b.objective)}`);
  }
  if (!LANGUAGES.has(b.language as Language)) {
    throw new Error(`Invalid language: ${String(b.language)}`);
  }

  return {
    hotelName: b.hotelName as string,
    hotelPhone: b.hotelPhone as string,
    guestName: b.guestName as string,
    bookingRef: b.bookingRef as string,
    objective: b.objective as Objective,
    context: typeof b.context === "string" ? b.context : "",
    language: b.language as Language,
  };
}

export async function POST(request: NextRequest) {
  let brief: CallBrief;
  try {
    brief = validateBrief(await request.json());
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const call: Call = {
    callId: randomUUID(),
    status: "queued",
    brief,
    transcript: [],
    notes: null,
    research: [],
    createdAt: new Date().toISOString(),
  };
  callStore.set(call.callId, call);

  call.research = await gatherResearch(brief.hotelName);
  const researchSummary = call.research.map((fact) => fact.fact).join(" | ");

  try {
    const provider = getProvider();
    call.conversationId = await provider.startCall(brief, researchSummary);
    call.status = "in_progress";
  } catch (err) {
    call.status = "failed";
    return NextResponse.json(
      { error: `Failed to start call: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ callId: call.callId, status: call.status }, { status: 201 });
}

export async function GET() {
  const calls: CallSummary[] = Array.from(callStore.values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((call) => ({
      callId: call.callId,
      hotelName: call.brief.hotelName,
      guestName: call.brief.guestName,
      objective: call.brief.objective,
      status: call.status,
      outcome: call.notes?.outcome ?? null,
      createdAt: call.createdAt,
    }));

  return NextResponse.json({ calls });
}
