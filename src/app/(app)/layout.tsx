import Link from "next/link";
import Logo from "@/components/logo";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 md:px-12 pb-24">
      <header className="flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="pl-2 font-mono text-[13px] text-faint">voice desk for advisors</span>
        </Link>
      </header>
      {children}
    </div>
  );
}
