import type { Brief, Call, TranscriptLine } from "./types";

// ponytail: fixture backend so the UI is demoable before the real /api lands.
// Delete src/app/api/mock/** + this file once the server is up; the UI switches
// with NEXT_PUBLIC_API_BASE and needs no changes.

type Stored = Call & { createdAt: string };

const store: Map<string, Stored> = ((globalThis as Record<string, unknown>).__calldeskMock ??=
  new Map()) as Map<string, Stored>;

export const listCalls = () =>
  [...store.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((c) => ({
      callId: c.callId,
      hotelName: c.brief.hotelName,
      guestName: c.brief.guestName,
      objective: c.brief.objective,
      status: c.status,
      outcome: c.notes?.outcome ?? null,
      createdAt: c.createdAt,
    }));

export const getCall = (callId: string) => store.get(callId);

const SCRIPT: [TranscriptLine["speaker"], string][] = [
  ["agent", "Hi, I'm calling on behalf of a travel advisor about an upcoming stay — is there any flexibility on the nightly price?"],
  ["hotel", "For those dates the junior suite is listed at 420 euro a night."],
  ["agent", "The advisor is working to 360. Is there anything you can do at that level for a three-night stay?"],
  ["hotel", "I can do 375 including breakfast, and hold it until Friday without a deposit."],
  ["agent", "That works. Could you note the hold under the guest name and confirm by email?"],
  ["hotel", "Of course — I'll send the confirmation to the address on file this afternoon."],
];

export function createCall(brief: Brief): string {
  const callId = `c_${Math.random().toString(16).slice(2, 8)}`;
  store.set(callId, {
    callId,
    status: "queued",
    brief,
    transcript: [],
    research: [
      { fact: "Junior suites listed at €398–€440 for Sept 12–15.", source: "booking.com · cached" },
      { fact: "Property ran a 15% advisor rate last September.", source: "advisor notes" },
    ],
    notes: null,
    createdAt: new Date().toISOString(),
  });

  const step = (i: number) => {
    const call = store.get(callId);
    if (!call) return;
    if (i === 0) call.status = "in_progress";
    if (i < SCRIPT.length) {
      const [speaker, text] = SCRIPT[i];
      call.transcript.push({ speaker, text, timestamp: new Date().toISOString() });
      setTimeout(() => step(i + 1), 2600);
      return;
    }
    call.status = "completed";
    call.notes = {
      outcome: "success",
      summary:
        "Front desk agreed to €375 including breakfast for two and will hold the junior suite until Friday without a deposit.",
      negotiatedTerms:
        "€375/night (from €420), breakfast for two included, hold until Friday with no deposit. Contact: Amélie, front desk.",
      keyQuotes: [
        "I can do 375 including breakfast, and hold it until Friday without a deposit.",
        "For those dates the junior suite is listed at 420 euro a night.",
      ],
      discrepancies: [
        { topic: "Nightly rate", claimed: "€420 listed", confirmed: "€375 agreed" },
        { topic: "Breakfast", claimed: "Not included", confirmed: "Included for two" },
      ],
    };
  };
  setTimeout(() => step(0), 1500);

  return callId;
}
