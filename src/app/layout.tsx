import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "CallDesk",
  description: "An AI voice agent that calls hotels on your behalf.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <div className="mx-auto w-full max-w-[1240px] px-6 md:px-12 pb-24">
          <header className="flex items-center justify-between py-6">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex size-[22px] items-center justify-center rounded-full border-2 border-ink">
                <span className="h-0.5 w-3 -rotate-45 bg-ink" />
              </span>
              <span className="text-[17px] font-semibold tracking-[-0.02em]">CallDesk</span>
              <span className="pl-2 font-mono text-[13px] text-faint">voice desk for advisors</span>
            </Link>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
