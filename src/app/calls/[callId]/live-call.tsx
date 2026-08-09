"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { StatusPill } from "@/components/pills";
import {
  API_BASE,
  LANGUAGES,
  OBJECTIVES,
  type Call,
  type CallStatus,
  type Notes,
  type TranscriptLine,
} from "@/lib/types";
import NotesCard from "./notes-card";

export default function LiveCall({ callId }: { callId: string }) {
  const [call, setCall] = useState<Call | null>(null);
  const [status, setStatus] = useState<CallStatus>("queued");
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [notes, setNotes] = useState<Notes | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  // Initial state: brief, research, and anything that streamed before we subscribed.
  useEffect(() => {
    fetch(`${API_BASE}/calls/${callId}`)
      .then((r) => r.json())
      .then((data: Call) => {
        setCall(data);
        setStatus(data.status);
        setTranscript(data.transcript ?? []);
        setNotes(data.notes ?? null);
      })
      .catch(() => {});
  }, [callId]);

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/calls/${callId}/stream`);

    es.addEventListener("status", (e) => {
      setStatus(JSON.parse((e as MessageEvent).data).status);
    });

    es.addEventListener("transcript", (e) => {
      setTranscript((t) => [...t, JSON.parse((e as MessageEvent).data) as TranscriptLine]);
    });

    es.addEventListener("notes", (e) => {
      setNotes(JSON.parse((e as MessageEvent).data));
    });

    // ponytail: no reconnect logic on error — the browser retries EventSource itself.
    es.addEventListener("done", () => es.close());

    return () => es.close();
  }, [callId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [transcript.length]);

  const live = status === "in_progress";
  const brief = call?.brief;
  const research = call?.research ?? [];

  return (
    <main className="flex flex-col gap-8 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Link href="/" className="w-fit text-[13px] font-semibold text-accent">
            ‹ Back to calls
          </Link>
          <h1 className="text-[34px] font-semibold leading-[1.15] tracking-[-0.03em]">
            {brief?.hotelName ?? "Call"}
          </h1>
          {brief && (
            <p className="text-[15px] text-muted">
              {OBJECTIVES[brief.objective]} · {brief.guestName} ·{" "}
              <span className="font-mono text-[13px]">{brief.bookingRef}</span> ·{" "}
              <span className="font-mono text-[13px]">{LANGUAGES[brief.language]}</span>
            </p>
          )}
        </div>
        <StatusPill status={status} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <section className="overflow-hidden rounded-[12px] border border-line">
          <div className="flex items-center justify-between border-b border-line bg-surface-2 px-[18px] py-3">
            <div className="flex items-center gap-2.5">
              <span
                className={`size-[7px] rounded-full ${live ? "bg-accent live-dot" : status === "completed" ? "bg-success" : status === "failed" ? "bg-danger" : "bg-warn"}`}
              />
              <span className="text-[13px] font-semibold">
                {live
                  ? "Live · in_progress"
                  : status === "queued"
                    ? "Dialling…"
                    : `Call ${status}`}
              </span>
            </div>
            <span className="font-mono text-[11px] text-faint">{transcript.length} turns</span>
          </div>

          <div className="transcript-surface flex max-h-[560px] flex-col gap-3.5 overflow-y-auto px-5 py-[22px]">
            {transcript.length === 0 && (
              <div className="py-16 text-center font-mono text-xs text-faint">
                waiting for the first turn…
              </div>
            )}
            {transcript.map((line, i) => {
              const isAgent = line.speaker === "agent";
              return (
                <div
                  key={i}
                  className={`flex flex-col gap-1.5 ${isAgent ? "items-end" : "items-start"}`}
                >
                  <div className="px-1.5 font-mono text-[10.5px] tracking-[0.04em] text-faint">
                    {line.speaker}
                  </div>
                  <div
                    className={`max-w-[78%] px-[18px] py-3 text-sm leading-[1.55] ${
                      isAgent ? "bubble-agent" : "bubble-hotel"
                    }`}
                  >
                    {line.text}
                  </div>
                </div>
              );
            })}
            {live && (
              <div className="px-1.5 font-mono text-[11px] text-faint">agent is speaking…</div>
            )}
            <div ref={bottom} />
          </div>
        </section>

        <aside className="flex flex-col gap-3">
          {research.length > 0 && (
            <div className="flex flex-col gap-3 rounded-[12px] border border-line px-[18px] py-4">
              <div className="font-mono text-[11px] tracking-[0.04em] text-faint">
                RESEARCH · briefed to the agent
              </div>
              {research.map((r, i) => (
                <div key={i} className="flex flex-col gap-1 border-t border-line-2 pt-2.5 first:border-0 first:pt-0">
                  <span className="text-[13px] leading-[1.5] text-ink-2">{r.fact}</span>
                  <span className="font-mono text-[11px] text-faint">{r.source}</span>
                </div>
              ))}
            </div>
          )}

          {brief?.context && (
            <div className="flex flex-col gap-2 rounded-[12px] border border-line px-[18px] py-4">
              <div className="font-mono text-[11px] tracking-[0.04em] text-faint">CONTEXT</div>
              <p className="text-[13px] leading-[1.55] text-ink-2">{brief.context}</p>
            </div>
          )}
        </aside>
      </div>

      {notes && (
        <NotesCard notes={notes} hotelName={brief?.hotelName ?? ""} transcript={transcript} />
      )}
    </main>
  );
}
