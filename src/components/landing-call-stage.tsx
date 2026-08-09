"use client";

import { useEffect, useRef, useState } from "react";

const SCRIPT = [
  { speaker: "agent", text: "Hi, I'm calling on behalf of a travel advisor about an upcoming stay. Is there any flexibility on the nightly price?" },
  { speaker: "hotel", text: "For those dates the junior suite is listed at 420 euro a night." },
  { speaker: "agent", text: "The advisor is working to 360. Anything you can do for a three night stay?" },
  { speaker: "hotel", text: "I can do 375 including breakfast, and hold it until Friday." },
  { speaker: "agent", text: "That works. Could you note the hold under the guest name?" },
] as const;

const SECONDS_PER_TURN = 7;
const TICK_MS = 2100;
const HOLD_TICKS = 3; // beats to sit on the outcome before looping

const clock = (turns: number) => {
  const s = turns * SECONDS_PER_TURN;
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

/** Looping visual twin of the live call page. No API, no SSE. */
export default function LandingCallStage() {
  const [step, setStep] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = setInterval(
      () => setStep((s) => (s > SCRIPT.length + HOLD_TICKS ? 0 : s + 1)),
      TICK_MS,
    );
    return () => clearInterval(tick);
  }, []);

  // Follow the newest bubble. Scrolls the panel only, never the page.
  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" });
  }, [step]);

  const turns = Math.min(step, SCRIPT.length);
  const done = step > SCRIPT.length;
  const status = step === 0 ? "queued" : done ? "completed" : "in_progress";
  const visible = SCRIPT.slice(0, turns);

  return (
    <div className="glass-bar w-full overflow-hidden rounded-[18px] text-left">
      <div className="flex items-center justify-between border-b border-white/60 bg-white/40 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`size-[7px] rounded-full ${
              status === "in_progress" ? "bg-accent live-dot" : done ? "bg-success" : "bg-warn"
            }`}
          />
          <span className="text-[13px] font-semibold">Hotel Marceau, Paris</span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              status === "in_progress"
                ? "bg-accent-tint text-accent"
                : done
                  ? "bg-success-tint text-success-ink"
                  : "bg-[#f3f3f3] text-muted"
            }`}
          >
            {status}
          </span>
        </div>
        <span className="font-mono text-[11px] text-faint">{clock(turns)}</span>
      </div>

      <div
        ref={box}
        className="transcript-surface no-scrollbar flex h-[340px] flex-col gap-3 overflow-y-auto px-5 py-5 sm:h-[360px]"
      >
        {visible.map((line, i) => {
          const isAgent = line.speaker === "agent";
          const speaking = !done && i === visible.length - 1;
          return (
            <div
              key={i}
              className={`bubble-in flex shrink-0 flex-col gap-1.5 ${isAgent ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-2 px-1.5">
                <span className="font-mono text-[10.5px] tracking-[0.04em] text-faint">
                  {line.speaker}
                </span>
                {speaking && (
                  <span className="flex items-end gap-[2px]">
                    {[0, 1, 2, 3].map((b) => (
                      <span
                        key={b}
                        className="wave-bar w-[2px] rounded-full bg-accent/70"
                        style={{ animationDelay: `${b * 0.12}s` }}
                      />
                    ))}
                  </span>
                )}
              </div>
              <div
                className={`max-w-[82%] px-4 py-2.5 text-[13px] leading-[1.5] ${
                  isAgent ? "bubble-agent" : "bubble-hotel"
                }`}
              >
                {line.text}
              </div>
            </div>
          );
        })}

        {done && (
          <div className="bubble-in flex shrink-0 items-center gap-3 rounded-[12px] border border-white/70 bg-white/80 px-4 py-3">
            <span className="rounded-full bg-success-tint px-2.5 py-1 text-[11px] font-semibold text-success-ink">
              success
            </span>
            <span className="text-[13px] text-ink-2">
              375 a night with breakfast, held until Friday
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
