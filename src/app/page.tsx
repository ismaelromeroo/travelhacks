"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusPill, OutcomePill } from "@/components/pills";
import { OBJECTIVES, type CallSummary } from "@/lib/types";

export default function Dashboard() {
  const [calls, setCalls] = useState<CallSummary[] | null>(null);

  useEffect(() => {
    fetch(`/api/calls`)
      .then((r) => r.json())
      .then((d) => setCalls(d.calls ?? []))
      .catch(() => setCalls([]));
  }, []);

  return (
    <main className="flex flex-col gap-10 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-10">
        <div className="flex flex-col gap-3">
          <h1 className="max-w-[18ch] text-[44px] font-semibold leading-[1.05] tracking-[-0.035em]">
            Calls placed on your behalf.
          </h1>
          <p className="max-w-[62ch] text-[17px] leading-[1.55] text-muted">
            Brief the agent once. It dials the hotel, negotiates live, and files structured notes
            back to you.
          </p>
        </div>
        <Link
          href="/calls/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ink px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#262626]"
        >
          <span>↓</span> New call
        </Link>
      </div>

      <section className="flex flex-col gap-4">
        <div className="font-mono text-[11px] tracking-[0.06em] text-faint">CALL HISTORY</div>

        {calls === null && <div className="text-sm text-faint">Loading…</div>}

        {calls?.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-[14px] border border-dashed border-line px-6 py-20 text-center">
            <div className="text-[17px] font-semibold">No calls yet</div>
            <p className="max-w-[42ch] text-sm leading-[1.55] text-muted">
              Start with a brief — hotel, guest, and what you want out of the call. The transcript
              streams in live.
            </p>
            <Link
              href="/calls/new"
              className="rounded-full border border-border-input px-5 py-2.5 text-[15px] font-semibold transition-colors hover:border-ink"
            >
              Place the first call
            </Link>
          </div>
        )}

        {!!calls?.length && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {calls.map((c) => (
              <Link
                key={c.callId}
                href={`/calls/${c.callId}`}
                className="flex flex-col gap-3.5 rounded-[12px] border border-line p-[18px] transition-shadow hover:shadow-raised"
              >
                <div className="flex items-center justify-between gap-2">
                  <StatusPill status={c.status} />
                  {c.outcome && <OutcomePill outcome={c.outcome} />}
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="text-[15px] font-semibold tracking-[-0.01em]">{c.hotelName}</div>
                  <div className="text-[13px] text-faint">
                    {OBJECTIVES[c.objective]} · {c.guestName}
                  </div>
                </div>
                <div className="border-t border-line-2 pt-2.5 font-mono text-[11px] text-[#b0b0b0]">
                  {c.callId}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
