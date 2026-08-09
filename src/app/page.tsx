import Link from "next/link";
import LandingCallStage from "@/components/landing-call-stage";

const steps = [
  { n: "01", title: "Brief once", body: "Hotel, guest, objective, language. Thirty seconds of typing." },
  { n: "02", title: "Watch it negotiate", body: "The agent dials out and the transcript streams in live." },
  { n: "03", title: "Get notes back", body: "Outcome, negotiated terms, and key quotes for the client file." },
];

export default function Landing() {
  return (
    <main className="flex flex-col">
      <section className="sky relative flex min-h-[92vh] flex-col items-center overflow-hidden px-6 pt-8 pb-24">
        <div className="flex w-full max-w-[1240px] items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-[22px] items-center justify-center rounded-full border-2 border-ink">
              <span className="h-0.5 w-3 -rotate-45 bg-ink" />
            </span>
            <span className="text-[17px] font-semibold tracking-[-0.02em]">CallDesk</span>
          </div>
          <Link
            href="/calls"
            className="rounded-full border border-white/70 bg-white/60 px-4 py-2 text-[13px] font-semibold backdrop-blur-md transition-colors hover:border-ink"
          >
            Open desk
          </Link>
        </div>

        <div className="flex w-full max-w-[760px] flex-col items-center gap-6 pt-16 text-center sm:pt-24">
          <span className="text-[13px] font-semibold tracking-[-0.01em] text-accent">
            Introducing CallDesk ›
          </span>
          <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[56px]">
            Your agent calls the hotel, negotiates, and files the notes.
          </h1>
          <p className="max-w-[46ch] text-[17px] leading-[1.55] text-ink-2">
            Travel advisors spend their afternoons on hold. CallDesk places the call, holds the
            conversation, and hands back a structured summary.
          </p>
          <Link
            href="/calls/new"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#262626]"
          >
            Start a new call
          </Link>
        </div>

        <div className="mt-14 w-full max-w-[720px]">
          <LandingCallStage />
        </div>
      </section>

      <section className="flex flex-col items-center gap-12 px-6 py-24">
        <div className="grid w-full max-w-[1000px] gap-10 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="flex flex-col gap-2">
              <span className="font-mono text-[11px] tracking-[0.06em] text-faint">{s.n}</span>
              <span className="text-[17px] font-semibold tracking-[-0.02em]">{s.title}</span>
              <p className="text-[14px] leading-[1.55] text-muted">{s.body}</p>
            </div>
          ))}
        </div>
        <Link
          href="/calls/new"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#262626]"
        >
          Start a new call
        </Link>
      </section>
    </main>
  );
}
