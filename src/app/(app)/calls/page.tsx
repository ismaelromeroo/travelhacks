"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusPill, OutcomePill } from "@/components/pills";
import { OBJECTIVES, type CallSummary } from "@/lib/types";

/** Seeded examples from src/lib/demo-call.ts share this id prefix. */
const isSample = (c: CallSummary) => c.callId.startsWith("demo-");

export default function Dashboard() {
  const [calls, setCalls] = useState<CallSummary[] | null>(null);
  const [showSamples, setShowSamples] = useState(true);

  useEffect(() => {
    fetch(`/api/calls`)
      .then((r) => r.json())
      .then((d) => setCalls(d.calls ?? []))
      .catch(() => setCalls([]));
  }, []);

  const visible = calls?.filter((c) => showSamples || !isSample(c)) ?? null;
  const hasSamples = calls?.some(isSample) ?? false;

  return (
    <main className="flex flex-col gap-10 pt-10">
      <div className="ambient" aria-hidden>
        <span className="blob-sky" />
        <span className="blob-blush" />
        <span className="blob-mist" />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-white/70 pb-10">
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
        <div className="flex items-center justify-between gap-4">
          <div className="font-mono text-[11px] tracking-[0.06em] text-faint">CALL HISTORY</div>
          {hasSamples && (
            <button
              type="button"
              onClick={() => setShowSamples((v) => !v)}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                showSamples
                  ? "border-accent bg-accent-tint text-accent"
                  : "border-border-input bg-white/60 text-muted hover:border-ink"
              }`}
            >
              {showSamples ? "◉ sample calls shown" : "show sample calls"}
            </button>
          )}
        </div>

        {visible === null && <div className="text-sm text-faint">Loading…</div>}

        {visible?.length === 0 && (
          <div className="glass flex flex-col items-center gap-4 rounded-[14px] px-6 py-20 text-center">
            <div className="text-[17px] font-semibold">No calls yet</div>
            <p className="max-w-[42ch] text-sm leading-[1.55] text-muted">
              Start with a brief: hotel, guest, and what you want out of the call. The transcript
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

        {!!visible?.length && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((c) => (
              <Link
                key={c.callId}
                href={`/calls/${c.callId}`}
                className="glass flex flex-col gap-3.5 rounded-[12px] p-[18px] transition-shadow hover:shadow-overlay"
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
                <div className="flex items-center justify-between border-t border-line-2 pt-2.5 font-mono text-[11px] text-[#b0b0b0]">
                  <span className="truncate">{c.callId}</span>
                  {isSample(c) && <span className="shrink-0 pl-2 text-faint">sample</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
