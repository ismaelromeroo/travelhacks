"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AGENT_LOOKUP,
  OBJECTIVES,
  SPEECH_FALLBACK_CODE,
  SPOKEN_LANGUAGES,
  type Objective,
} from "@/lib/types";
import { guessObjective, type BriefField } from "@/lib/voice-brief";
import VoiceBrief from "@/components/voice-brief";

const inputClass =
  "w-full rounded-[10px] border border-border-input bg-white/70 px-3.5 py-2.5 text-[15px] outline-none transition-shadow focus:border-accent focus:shadow-[0_0_0_3px_rgba(27,110,243,0.14)]";
const labelClass = "text-[13px] font-semibold text-ink-2";
/** What Vapi accepts: country code first, digits only. */
const E164 = /^\+[1-9]\d{7,14}$/;
const sectionClass = "glass flex flex-col gap-[18px] rounded-[14px] p-6";
const stepClass = "font-mono text-[11px] tracking-[0.06em] text-faint";

/** Type it, or hand it to the agent. Auto submits AGENT_LOOKUP text, not a blank. */
function AutoField({
  id,
  label,
  placeholder,
  hint,
  value,
  onChange,
  auto,
  onToggle,
  flash = "",
}: {
  id: string;
  label: string;
  placeholder: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  auto: boolean;
  onToggle: () => void;
  flash?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label className={labelClass} htmlFor={id}>
          {label}
        </label>
        <button
          type="button"
          onClick={onToggle}
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
            auto
              ? "border-accent bg-accent-tint text-accent"
              : "border-border-input bg-white/60 text-muted hover:border-ink"
          }`}
        >
          {auto ? "◉ agent finds it" : "let the agent find it"}
        </button>
      </div>
      {auto ? (
        <div className="rounded-[10px] border border-dashed border-border-input bg-white/40 px-3.5 py-2.5 text-[13px] text-faint">
          {hint}
        </div>
      ) : (
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          className={`${inputClass} font-mono text-sm${flash}`}
        />
      )}
    </div>
  );
}

export default function NewCall() {
  const router = useRouter();
  const [hotelName, setHotelName] = useState("");
  const [guestName, setGuestName] = useState("");
  const [hotelPhone, setHotelPhone] = useState("");
  const [bookingRef, setBookingRef] = useState("");
  const [autoPhone, setAutoPhone] = useState(false);
  const [autoRef, setAutoRef] = useState(false);
  const [objectiveText, setObjectiveText] = useState("");
  const [objective, setObjective] = useState<Objective>("negotiate_rate");
  const [context, setContext] = useState("");
  const [langId, setLangId] = useState("en");
  // Scripted = mock provider (fixture transcript, no phone call). Off = real Vapi call.
  const [scripted, setScripted] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [flash, setFlash] = useState<BriefField | null>(null);

  const lang = SPOKEN_LANGUAGES.find((l) => l.id === langId) ?? SPOKEN_LANGUAGES[0];

  const SETTERS: Record<BriefField, (v: string) => void> = {
    hotelName: setHotelName,
    guestName: setGuestName,
    hotelPhone: setHotelPhone,
    bookingRef: setBookingRef,
    context: setContext,
    objectiveText: (v) => {
      setObjectiveText(v);
      const guessed = guessObjective(v);
      if (guessed) setObjective(guessed);
    },
  };

  function onVoiceFill(field: BriefField, value: string) {
    SETTERS[field](value);
    setFlash(field);
    setTimeout(() => setFlash((f) => (f === field ? null : f)), 1600);
  }

  const flashClass = (field: BriefField) => (flash === field ? " just-filled" : "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // A live call is dialled for real, so it needs a number the carrier accepts.
    if (!scripted) {
      if (autoPhone) {
        setError(
          "A live call needs a real number. Turn off \"let the agent find it\" on the phone field, or switch back to Scripted demo.",
        );
        return;
      }
      if (!E164.test(hotelPhone.replace(/[\s().-]/g, ""))) {
        setError(
          "That number will not dial. Live calls need the international format, country code first, like +33142000000.",
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/calls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelName,
          hotelPhone: autoPhone ? AGENT_LOOKUP.phone : hotelPhone,
          guestName,
          bookingRef: autoRef ? AGENT_LOOKUP.bookingRef : bookingRef,
          // Typed objective is what the advisor means; the chip keeps the enum the backend expects.
          objective,
          context: [objectiveText && `Objective: ${objectiveText}`, context]
            .filter(Boolean)
            .join("\n\n"),
          language: lang.wire,
          mode: scripted ? "mock" : "live",
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        // The route replies { error }. Show that, not just the status code.
        throw new Error(data?.error ?? `The call could not be placed (${res.status}).`);
      }
      router.push(`/calls/${data.callId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place the call");
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="ambient" aria-hidden>
        <span className="blob-sky" />
        <span className="blob-blush" />
        <span className="blob-mist" />
      </div>

      <main className="mx-auto flex w-full max-w-[640px] flex-col gap-6 pt-4 pb-40">
        <div className="flex flex-col gap-2">
          <Link href="/calls" className="w-fit text-[13px] font-semibold text-accent">
            ‹ Back to calls
          </Link>
          <h1 className="text-[34px] font-semibold leading-[1.15] tracking-[-0.03em]">Call brief</h1>
          <p className="text-[15px] leading-[1.55] text-muted">
            Everything here becomes the agent&apos;s objective and opening line.
          </p>
        </div>

        <VoiceBrief
          values={{ hotelName, guestName, hotelPhone, bookingRef, objectiveText, context }}
          langCode={lang.code === "auto" ? SPEECH_FALLBACK_CODE : lang.code}
          onFill={onVoiceFill}
        />

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <section className={sectionClass}>
            <div className={stepClass}>01 · HOTEL</div>
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor="hotelName">
                Hotel name
              </label>
              <input
                id="hotelName"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                placeholder="Hotel Marceau, Paris"
                required
                className={inputClass + flashClass("hotelName")}
              />
            </div>
            <AutoField
              id="hotelPhone"
              label="Phone number"
              placeholder="+33 1 42 00 00 00"
              hint="The agent will look up the number from the hotel name."
              value={hotelPhone}
              onChange={setHotelPhone}
              auto={autoPhone}
              onToggle={() => setAutoPhone((v) => !v)}
              flash={flashClass("hotelPhone")}
            />
          </section>

          <section className={sectionClass}>
            <div className={stepClass}>02 · GUEST</div>
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor="guestName">
                Guest name
              </label>
              <input
                id="guestName"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Elena Ruiz"
                required
                className={inputClass + flashClass("guestName")}
              />
            </div>
            <AutoField
              id="bookingRef"
              label="Booking reference"
              placeholder="BK-4471"
              hint="The agent will ask the hotel to pull it up from the guest name."
              value={bookingRef}
              onChange={setBookingRef}
              auto={autoRef}
              onToggle={() => setAutoRef((v) => !v)}
              flash={flashClass("bookingRef")}
            />
          </section>

          <section className={sectionClass}>
            <div className={stepClass}>03 · OBJECTIVE</div>
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor="objective">
                What should the agent achieve?
              </label>
              <input
                id="objective"
                value={objectiveText}
                onChange={(e) => setObjectiveText(e.target.value)}
                placeholder="Negotiate the nightly rate down to €360"
                className={inputClass + flashClass("objectiveText")}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Object.entries(OBJECTIVES).map(([value, label]) => {
                  const active = objective === value;
                  return (
                    <button
                      type="button"
                      key={value}
                      onClick={() => {
                        setObjective(value as Objective);
                        setObjectiveText(label);
                      }}
                      className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                        active
                          ? "border-accent bg-accent-tint text-accent"
                          : "border-border-input bg-white/60 text-muted hover:border-ink"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor="context">
                Context
              </label>
              <textarea
                id="context"
                rows={4}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Two guests, arriving Sept 12, flexible on room type. Target €360/night."
                className={`${inputClass}${flashClass("context")} resize-y text-sm leading-[1.5]`}
              />
            </div>
          </section>

          <section className={sectionClass}>
            <div className={stepClass}>04 · LANGUAGE</div>
            <div className="flex flex-wrap gap-2">
              {SPOKEN_LANGUAGES.map((l) => {
                const active = langId === l.id;
                return (
                  <button
                    type="button"
                    key={l.id}
                    onClick={() => setLangId(l.id)}
                    style={
                      active
                        ? { borderColor: l.hue, background: l.tint, color: l.hue }
                        : undefined
                    }
                    className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors ${
                      active ? "" : "border-border-input bg-white/60 text-muted hover:border-ink"
                    }`}
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: active ? l.hue : "#dcdcdc" }}
                    />
                    {l.label}
                    {l.id !== "auto" && (
                      <span className="font-mono text-[11px] opacity-60">{l.code}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {error && (
            <div className="flex items-start gap-3 rounded-[12px] border border-danger/30 bg-danger-tint px-4 py-3 text-[13px] leading-[1.5] text-danger">
              <span className="pt-px">!</span>
              <span>{error}</span>
            </div>
          )}

          <div className="fixed inset-x-0 bottom-0 z-10 px-6 pb-6">
            <div className="glass-bar mx-auto flex max-w-[640px] items-center justify-between gap-3 rounded-full py-2.5 pr-2.5 pl-2.5">
              <button
                type="button"
                onClick={() => setScripted((v) => !v)}
                title="Scripted plays a fixture transcript with no phone call. Live dials the hotel for real."
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-semibold transition-colors ${
                  scripted
                    ? "border-warn/40 bg-warn-tint text-warn"
                    : "border-success/40 bg-success-tint text-success-ink"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${scripted ? "bg-warn" : "bg-success live-dot"}`}
                />
                {scripted ? "Scripted demo" : "Live phone call"}
              </button>
              <div className="hidden min-w-0 items-center gap-2 text-[13px] text-muted sm:flex">
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ background: lang.hue }}
                />
                <span className="truncate">
                  {hotelName || "Hotel"} · {lang.label}
                </span>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#262626] disabled:bg-[#f0f0f0] disabled:text-[#b4b4b4]"
              >
                {submitting ? "Dialling…" : "Place call"}
              </button>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}
