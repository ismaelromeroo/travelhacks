"use client";

import { useState } from "react";
import { OutcomePill } from "@/components/pills";
import type { CallNotes, TranscriptTurn } from "@/lib/types";

export default function NotesCard({
  notes,
  hotelName,
  transcript,
}: {
  notes: CallNotes;
  hotelName: string;
  transcript: TranscriptTurn[];
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = [
      `${hotelName} — ${notes.outcome}`,
      notes.summary,
      `Negotiated terms: ${notes.negotiatedTerms}`,
      ...notes.keyQuotes.map((q) => `“${q}”`),
    ].join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="overflow-hidden rounded-[14px] border border-line">
      <div className="notes-header flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold tracking-[-0.01em]">{hotelName}</span>
          <OutcomePill outcome={notes.outcome} />
        </div>
        <button
          onClick={copy}
          className="rounded-full border border-border-input bg-white px-4 py-1.5 text-[13px] font-semibold transition-colors hover:border-ink"
        >
          {copied ? "Copied" : "Copy to client file"}
        </button>
      </div>

      <div className="grid gap-7 p-6 md:grid-cols-2">
        <div className="flex flex-col gap-[22px]">
          <div className="flex flex-col gap-2">
            <div className="font-mono text-[11px] tracking-[0.04em] text-faint">SUMMARY</div>
            <p className="text-sm leading-[1.6] text-[#2a2a2a]">{notes.summary}</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="font-mono text-[11px] tracking-[0.04em] text-faint">
              NEGOTIATED TERMS
            </div>
            <p className="text-sm leading-[1.6] text-[#2a2a2a]">{notes.negotiatedTerms}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="font-mono text-[11px] tracking-[0.04em] text-faint">KEY QUOTES</div>
          {notes.keyQuotes.map((q, i) => (
            <blockquote
              key={i}
              className="rounded-r-[8px] border-l-2 border-accent bg-[#fafafa] px-3.5 py-3 text-sm leading-[1.55] text-[#2a2a2a]"
            >
              “{q}”
            </blockquote>
          ))}
        </div>

        {notes.discrepancies.length > 0 && (
          <div className="flex flex-col gap-2.5 md:col-span-2">
            <div className="font-mono text-[11px] tracking-[0.04em] text-faint">
              DISCREPANCIES · claimed vs. confirmed
            </div>
            <div className="overflow-hidden rounded-[10px] border border-line">
              <div className="grid grid-cols-[160px_1fr_1fr] gap-4 bg-surface-2 px-4 py-2.5 font-mono text-[11px] tracking-[0.04em] text-faint">
                <div>TOPIC</div>
                <div>CLAIMED ON CALL</div>
                <div>CONFIRMED</div>
              </div>
              {notes.discrepancies.map((d, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[160px_1fr_1fr] gap-4 border-t border-line-2 px-4 py-3 text-sm"
                >
                  <div className="text-muted">{d.topic}</div>
                  <div className="text-danger">{d.claimed}</div>
                  <div className="font-medium">{d.confirmed}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <details className="md:col-span-2">
          <summary className="cursor-pointer font-mono text-[11px] tracking-[0.04em] text-faint">
            FULL TRANSCRIPT · {transcript.length} turns
          </summary>
          <div className="mt-3 flex flex-col gap-2.5 border-t border-line-2 pt-3">
            {transcript.map((line, i) => (
              <div key={i} className="grid grid-cols-[70px_1fr] gap-3 text-sm leading-[1.55]">
                <span className="font-mono text-[11px] text-faint">{line.speaker}</span>
                <span className="text-[#2a2a2a]">{line.text}</span>
              </div>
            ))}
          </div>
        </details>
      </div>
    </section>
  );
}
