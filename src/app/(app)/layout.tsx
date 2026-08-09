import Link from "next/link";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 md:px-12 pb-24">
      <header className="flex items-center justify-between py-6">
        <Link href="/calls" className="flex items-center gap-2.5">
          <span className="flex size-[22px] items-center justify-center rounded-full border-2 border-ink">
            <span className="h-0.5 w-3 -rotate-45 bg-ink" />
          </span>
          <span className="text-[17px] font-semibold tracking-[-0.02em]">CallDesk</span>
          <span className="pl-2 font-mono text-[13px] text-faint">voice desk for advisors</span>
        </Link>
      </header>
      {children}
    </div>
  );
}
