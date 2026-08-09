/** CallDesk brand mark: circled dash + wordmark, shared by every header. */
export default function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-[22px] items-center justify-center rounded-full border-2 border-ink">
        <span className="h-0.5 w-3 -rotate-45 bg-ink" />
      </span>
      <span className="text-[17px] font-semibold tracking-[-0.02em]">CallDesk</span>
    </span>
  );
}
