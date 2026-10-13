// Small server-safe marks shared by the price book, the quote list and the quote page.
// (components/ui.tsx is a client module, so its constants can't be read on the server.)
import type { ReactNode } from "react";
import type { RouteId } from "@/lib/types";
import { SampleBadge } from "@/components/ui";

export const routeColor = (r: RouteId) => `var(--color-${r})`;

export function cn(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

/** A code on a plate: EWC codes, R/D codes, rule ids, quote numbers. */
export function Plate({ children, className, title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-[3px] border border-line-2 bg-surface px-1.5 font-mono text-[12px] leading-[20px] text-ink tabular",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function RouteSwatch({ route, className }: { route: RouteId; className?: string }) {
  return <span aria-hidden className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]", className)} style={{ background: routeColor(route) }} />;
}

export function RouteName({ route, name, className }: { route: RouteId; name: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", className)}>
      <RouteSwatch route={route} />
      {name}
    </span>
  );
}

export type StripCell = { route: RouteId; name: string; state: "chosen" | "open" | "closed" };

/**
 * The four routes of one quote, in hierarchy order: solid = chosen,
 * tint = allowed and priced, hatched = closed by the rules.
 */
export function RouteStrip({ cells, className }: { cells: StripCell[]; className?: string }) {
  const label = cells.map((c) => `${c.name}: ${c.state === "chosen" ? "accepted" : c.state === "open" ? "allowed" : "not allowed"}`).join("; ");
  return (
    <span role="img" aria-label={label} title={label} className={cn("inline-flex items-center gap-[3px]", className)}>
      {cells.map((c) => (
        <span
          key={c.route}
          className={cn(
            "block h-4 w-4 rounded-[2px]",
            c.state === "closed" && "hatch border border-line-2",
            c.state === "chosen" && "ring-2 ring-ink ring-offset-1 ring-offset-surface",
          )}
          style={
            c.state === "closed"
              ? undefined
              : { background: c.state === "chosen" ? routeColor(c.route) : `color-mix(in srgb, ${routeColor(c.route)} 28%, white)` }
          }
        />
      ))}
    </span>
  );
}

/** The quiet counterpart of SampleBadge: this value comes from a named public source. */
export function SourcedMark({ title = "From the cited public source" }: { title?: string }) {
  return (
    <span title={title} className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-circular">
      <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
        <path d="M2.5 6.3l2.2 2.2 4.8-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Sourced
    </span>
  );
}

export function StatusMark({ isSample, title }: { isSample: boolean; title?: string }) {
  return isSample ? <SampleBadge title={title ?? "Sample value: replace with your own before quoting for real"} /> : <SourcedMark />;
}

export function ExtLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn("underline decoration-line-2 underline-offset-[3px] transition-colors hover:text-ink hover:decoration-ink", className)}
    >
      {children}
    </a>
  );
}

/** Source text, linked when there is a URL, with the notes that explain proxies and conversions. */
export function SourceText({
  source,
  url,
  notes,
  className,
}: {
  source: string;
  url?: string | null;
  notes?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("text-[12px] leading-snug text-ink-2", className)}>
      {url ? <ExtLink href={url}>{source}</ExtLink> : source}
      {notes && <p className="mt-1 text-muted">{notes}</p>}
    </div>
  );
}

export function IconDoc({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("h-4 w-4", className)} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 1.75h5.25L12.5 5v9.25h-8.5z" strokeLinejoin="round" />
      <path d="M9 1.75V5.25h3.5M6 8.5h4.5M6 11h4.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconCamera({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("h-5 w-5", className)} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2.5 6.5h3l1.5-2.25h6l1.5 2.25h3v9.25h-15z" strokeLinejoin="round" />
      <circle cx="10" cy="10.75" r="3" />
    </svg>
  );
}
