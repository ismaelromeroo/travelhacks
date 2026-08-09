import type { CallStatus, Outcome } from "@/lib/types";

const pill = "rounded-full px-[11px] py-[5px] text-xs font-semibold";

const STATUS: Record<CallStatus, string> = {
  queued: "bg-[#f3f3f3] text-muted",
  in_progress: "bg-accent-tint text-accent",
  completed: "bg-success-tint text-success-ink",
  failed: "bg-danger-tint text-danger",
};

const OUTCOME: Record<Outcome, string> = {
  success: "bg-success-tint text-success-ink",
  partial: "bg-warn-tint text-warn",
  declined: "bg-danger-tint text-danger",
};

export function StatusPill({ status }: { status: CallStatus }) {
  return <span className={`${pill} ${STATUS[status]}`}>{status}</span>;
}

export function OutcomePill({ outcome }: { outcome: Outcome }) {
  return <span className={`${pill} ${OUTCOME[outcome]}`}>{outcome}</span>;
}
