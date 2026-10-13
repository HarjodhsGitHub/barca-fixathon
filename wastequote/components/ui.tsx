"use client";
// Small UI primitives shared by the wizard and the quote pages.
import type { ReactNode } from "react";
import type { Citation, RouteId } from "@/lib/types";

export const ROUTE_COLOR: Record<RouteId, string> = {
  reuse: "var(--color-reuse)",
  recycling: "var(--color-recycling)",
  recovery: "var(--color-recovery)",
  landfill: "var(--color-landfill)",
};

export function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

export function SampleBadge({ title = "Built on sample data: see the price book for sources" }: { title?: string }) {
  return (
    <span
      title={title}
      className="sample-stripe inline-flex items-center gap-1 rounded border border-[#e7c48f] px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-flag"
    >
      Sample data
    </span>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "flag" | "danger" | "ink" }) {
  const tones = {
    neutral: "bg-sunken text-ink-2",
    good: "bg-circular-soft text-circular",
    flag: "bg-flag-soft text-flag",
    danger: "bg-danger-soft text-danger",
    ink: "bg-ink text-white",
  } as const;
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", tones[tone])}>{children}</span>;
}

export function ConfidenceMeter({ value, threshold }: { value: number; threshold: number }) {
  const low = value < threshold;
  return (
    <span className="inline-flex items-center gap-1.5" title={`Model confidence ${Math.round(value * 100)}%`}>
      <span className="relative h-1.5 w-14 overflow-hidden rounded-full bg-sunken">
        <span
          className={cx("absolute inset-y-0 left-0 rounded-full", low ? "bg-flag" : "bg-circular")}
          style={{ width: `${Math.max(4, value * 100)}%` }}
        />
        <span className="absolute inset-y-0 w-px bg-ink/40" style={{ left: `${threshold * 100}%` }} />
      </span>
      <span className={cx("font-mono text-[11px] tabular", low ? "text-flag" : "text-ink-2")}>{Math.round(value * 100)}%</span>
    </span>
  );
}

export function Citations({ items }: { items: Citation[] }) {
  return (
    <ul className="mt-1.5 space-y-1">
      {items.map((c, i) => (
        <li key={i} className="flex flex-wrap items-baseline gap-x-2 text-[11px] leading-snug text-ink-2">
          <span className="font-mono text-ink">
            {c.label}: {typeof c.value === "number" ? c.value : c.value}
            {c.unit ? ` ${c.unit}` : ""}
          </span>
          <span className="font-mono text-muted">
            data/{c.table.split(".")[0]}.json · {c.row}
          </span>
          {c.is_sample ? (
            <span className="font-medium text-flag">sample</span>
          ) : (
            <span className="font-medium text-circular">sourced</span>
          )}
          <span className="basis-full text-muted">
            {c.source_url ? (
              <a href={c.source_url} target="_blank" rel="noreferrer" className="underline decoration-line-2 underline-offset-2 hover:text-ink">
                {c.source}
              </a>
            ) : (
              c.source
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function SectionTitle({ step, title, hint }: { step?: string; title: string; hint?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {step && <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{step}</div>}
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      {hint && <div className="text-right text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-xl border border-line bg-surface", className)}>{children}</div>;
}

export function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  type = "button",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "circular" | "ghost";
  type?: "button" | "submit";
  className?: string;
}) {
  const v = {
    primary: "bg-ink text-white hover:bg-ink/85",
    circular: "bg-circular text-white hover:bg-circular/90",
    secondary: "border border-line-2 bg-surface text-ink hover:border-ink",
    ghost: "text-ink-2 hover:bg-sunken hover:text-ink",
  } as const;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        v[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  disabledReason,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
  disabledReason?: (v: T) => string | null;
}) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-sunken p-0.5">
      {options.map((o) => {
        const reason = disabledReason?.(o.value) ?? null;
        return (
          <button
            key={o.value}
            type="button"
            title={reason ?? undefined}
            disabled={!!reason}
            onClick={() => onChange(o.value)}
            className={cx(
              "rounded-md px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:text-muted/60 disabled:line-through",
              value === o.value ? "bg-surface font-medium text-ink shadow-sm" : "text-ink-2 hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
