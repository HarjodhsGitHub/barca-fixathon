"use client";
// Header navigation with an active state. Lives here because the layout is a server component.
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Quotes", match: (p: string) => p === "/" || p.startsWith("/quotes/") },
  { href: "/pricebook", label: "Price book", match: (p: string) => p.startsWith("/pricebook") },
];

export function SiteNav() {
  const path = usePathname() ?? "/";
  return (
    <nav aria-label="Main" className="flex items-center gap-0.5 text-[14px] sm:gap-1">
      {LINKS.map((l) => {
        const active = l.match(path);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={
              "group relative whitespace-nowrap rounded-md px-2.5 py-2 transition-colors duration-200 sm:px-3 " +
              (active ? "font-medium text-ink" : "text-ink-2 hover:text-ink")
            }
          >
            {l.label}
            <span
              aria-hidden
              className={
                "absolute inset-x-2.5 -bottom-[13px] h-[2px] origin-left rounded-full bg-circular transition-transform duration-500 ease-out-expo sm:inset-x-3 " +
                (active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100 group-hover:bg-line-2")
              }
            />
          </Link>
        );
      })}
    </nav>
  );
}

export function NewQuoteButton() {
  const path = usePathname() ?? "/";
  const active = path.startsWith("/quote/new");
  return (
    <Link
      href="/quote/new"
      aria-current={active ? "page" : undefined}
      className={
        "press inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-[14px] font-medium text-white shadow-card sm:px-4 " +
        (active ? "bg-circular-ink" : "bg-circular hover:bg-circular-ink")
      }
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 3v10M3 8h10" strokeLinecap="round" />
      </svg>
      New quote
    </Link>
  );
}
