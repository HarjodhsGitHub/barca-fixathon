import type { Metadata } from "next";
import Link from "next/link";
import { NewQuoteButton, SiteNav } from "@/components/pricebook/SiteNav";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";

// The Selinsight mark is the EU waste hierarchy drawn as an inverted pyramid:
// reuse, recycling, recovery, landfill, best (widest) first.
const BARS = [
  { y: 5, x: 3, w: 26, fill: "#0f766e" },
  { y: 11.5, x: 6, w: 20, fill: "#2c8a3b" },
  { y: 18, x: 9, w: 14, fill: "#b26e12" },
  { y: 24.5, x: 12, w: 8, fill: "#8f4a3a" },
];

const FAVICON = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#f0eee7"/>${BARS.map(
    (b) => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="4.5" rx="1" fill="${b.fill}"/>`,
  ).join("")}</svg>`,
)}`;

export const metadata: Metadata = {
  title: "Selinsight",
  description:
    "CPQ for waste: a photo of a waste stream becomes a configured, priced quote with every treatment route side by side, circular first.",
  icons: { icon: FAVICON },
};

function Mark() {
  // On a full page load the four bars draw in from the centre, best route first.
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
      {BARS.map((b, i) => (
        <rect
          key={b.y}
          x={b.x}
          y={b.y}
          width={b.w}
          height={4.5}
          rx={1}
          fill={b.fill}
          className="animate-grow-x"
          style={{ transformBox: "fill-box", transformOrigin: "center", animationDelay: `${120 + i * 90}ms` }}
        />
      ))}
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-xl backdrop-saturate-150">
          <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-2 px-4 sm:gap-6 sm:px-6">
            <Link href="/" className="press flex items-center gap-2.5 rounded-md pr-1" aria-label="Selinsight, all quotes">
              <Mark />
              <span className="hidden text-[17px] font-semibold tracking-[-0.02em] sm:inline">Selinsight</span>
            </Link>
            <span aria-hidden className="hidden h-5 w-px bg-line-2 sm:block" />
            <SiteNav />
            <div className="ml-auto flex items-center gap-5">
              <div className="hidden text-right leading-tight lg:block">
                <div className="text-[13px] font-medium text-ink">Northwind Recycling</div>
                <div className="text-[11px] text-muted">Sample company, sales desk</div>
              </div>
              <NewQuoteButton />
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
