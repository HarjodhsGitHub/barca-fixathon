import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "WasteQuote",
  description:
    "CPQ for waste: a photo of a waste stream becomes a configured, priced quote with every treatment route side by side, circular first.",
};

function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
      <rect width="32" height="32" rx="7" className="fill-ink" />
      <path
        d="M9 18.5a7 7 0 0 0 12.6 3.4M23 13.5a7 7 0 0 0-12.6-3.4"
        fill="none"
        stroke="#7fd6a8"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M21.2 25.4l.6-3.6-3.6-.4M10.8 6.6l-.6 3.6 3.6.4" fill="none" stroke="#7fd6a8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-line bg-paper/90 backdrop-blur sticky top-0 z-30">
          <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-6 px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <Mark />
              <span className="text-[15px] font-semibold tracking-tight">WasteQuote</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm text-ink-2">
              <Link href="/quote/new" className="rounded-md px-3 py-1.5 hover:bg-sunken hover:text-ink">
                New quote
              </Link>
              <Link href="/" className="rounded-md px-3 py-1.5 hover:bg-sunken hover:text-ink">
                Quotes
              </Link>
              <Link href="/pricebook" className="rounded-md px-3 py-1.5 hover:bg-sunken hover:text-ink">
                Price book
              </Link>
            </nav>
            <span className="ml-auto hidden text-xs text-muted sm:block">Northwind Recycling · sales</span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
