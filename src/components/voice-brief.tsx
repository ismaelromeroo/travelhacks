"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  FIELD_ORDER,
  QUESTIONS,
  isSkip,
  parseAnswer,
  type BriefField,
} from "@/lib/voice-brief";

// The speech APIs are not in lib.dom's types yet.
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

const getRecognitionCtor = (): RecognitionCtor | null => {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

type Turn = { who: "agent" | "you"; text: string };

export default function VoiceBrief({
  values,
  langCode,
  onFill,
}: {
  values: Record<BriefField, string>;
  langCode: string;
  onFill: (field: BriefField, value: string) => void;
}) {
  const [active, setActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [heard, setHeard] = useState("");

  const recRef = useRef<Recognition | null>(null);
  const stoppedRef = useRef(false);
  // Latest field values, so the queue can skip anything filled mid-conversation.
  const valuesRef = useRef(values);
  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  // Assume supported while server rendering; the client corrects on hydration.
  const supported = useSyncExternalStore(
    () => () => {},
    () => getRecognitionCtor() !== null,
    () => true,
  );

  const stop = useCallback(() => {
    stoppedRef.current = true;
    recRef.current?.abort();
    recRef.current = null;
    window.speechSynthesis?.cancel();
    setActive(false);
    setListening(false);
    setHeard("");
  }, []);

  useEffect(() => stop, [stop]);

  const say = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        setTurns((t) => [...t, { who: "agent", text }]);
        const u = new SpeechSynthesisUtterance(text);
        u.lang = langCode;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
      }),
    [langCode],
  );

  const listen = useCallback(
    () =>
      new Promise<string>((resolve) => {
        const Ctor = getRecognitionCtor();
        if (!Ctor) return resolve("");
        const rec = new Ctor();
        recRef.current = rec;
        rec.lang = langCode;
        rec.interimResults = true;
        rec.continuous = false;
        let final = "";

        rec.onresult = (e) => {
          let interim = "";
          for (let i = 0; i < e.results.length; i++) {
            const r = e.results[i];
            const text = r[0].transcript;
            if (r.isFinal) final += text;
            else interim += text;
          }
          setHeard(final || interim);
        };
        rec.onerror = () => rec.stop();
        rec.onend = () => {
          setListening(false);
          setHeard("");
          recRef.current = null;
          resolve(final.trim());
        };

        setListening(true);
        rec.start();
      }),
    [langCode],
  );

  async function start() {
    stoppedRef.current = false;
    setTurns([]);
    setActive(true);

    await say("Sure. I'll ask a few quick questions.");

    for (const field of FIELD_ORDER) {
      if (stoppedRef.current) return;
      if (valuesRef.current[field]?.trim()) continue;

      await say(QUESTIONS[field]);
      if (stoppedRef.current) return;

      const spoken = await listen();
      if (stoppedRef.current) return;
      if (!spoken) continue;

      setTurns((t) => [...t, { who: "you", text: spoken }]);
      if (isSkip(spoken)) continue;

      const value = parseAnswer(field, spoken);
      if (value) onFill(field, value);
    }

    if (stoppedRef.current) return;
    await say("Got it. The brief is filled in, take a look before you place the call.");
    setActive(false);
  }

  if (!supported) {
    return (
      <div className="glass flex items-center gap-3 rounded-[14px] px-5 py-4 text-[13px] text-muted">
        <span className="text-accent">◉</span>
        Voice briefing needs Chrome. Fill the form below instead.
      </div>
    );
  }

  return (
    <div className="glass flex flex-col gap-4 rounded-[14px] p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] font-semibold tracking-[-0.01em]">Brief by voice</span>
          <span className="text-[13px] text-muted">
            Talk it through and the agent fills in what is missing.
          </span>
        </div>
        <button
          type="button"
          onClick={active ? stop : start}
          className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-colors ${
            active
              ? "border border-accent bg-accent-tint text-accent"
              : "bg-ink text-white hover:bg-[#262626]"
          }`}
        >
          <span>◉</span>
          {active ? "Stop" : "Talk to the agent"}
        </button>
      </div>

      {active && (
        <div className="flex flex-col gap-2.5 border-t border-white/70 pt-4">
          {turns.slice(-4).map((t, i) => (
            <div
              key={`${i}-${t.text}`}
              className={`bubble-in flex flex-col gap-1 ${t.who === "you" ? "items-end" : "items-start"}`}
            >
              <span className="px-1.5 font-mono text-[10.5px] tracking-[0.04em] text-faint">
                {t.who}
              </span>
              <span
                className={`max-w-[85%] px-4 py-2.5 text-[13px] leading-[1.5] ${
                  t.who === "you" ? "bubble-agent" : "bubble-hotel"
                }`}
              >
                {t.text}
              </span>
            </div>
          ))}

          {listening && (
            <div className="flex items-center gap-2.5 px-1.5">
              <span className="flex items-end gap-[2px]">
                {[0, 1, 2, 3, 4].map((b) => (
                  <span
                    key={b}
                    className="wave-bar w-[2px] rounded-full bg-accent/70"
                    style={{ animationDelay: `${b * 0.1}s` }}
                  />
                ))}
              </span>
              <span className="font-mono text-[11px] text-faint">
                {heard || "listening…"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
