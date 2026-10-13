// Layout pieces for the price book: a section per data file and one table style.
import type { ReactNode } from "react";
import { Plate, SourceText, StatusMark, cn } from "./marks";

export type Meta = {
  description?: string;
  units?: Record<string, string>;
  source?: string;
  source_url?: string;
};

const numFmt = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 5 });
/** A number exactly as stored in /data, with a true minus sign. */
export const n = (v: number) => (v < 0 ? `−${numFmt.format(-v)}` : numFmt.format(v));

export function Section({
  id,
  title,
  file,
  meta,
  children,
}: {
  id: string;
  title: string;
  file: string;
  meta?: Meta;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="anchor">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 id={`${id}-h`} className="text-[24px] font-semibold tracking-[-0.015em]">
          {title}
        </h2>
        <Plate className="text-muted">{file}</Plate>
      </div>
      {meta?.description && <p className="mt-2 max-w-[78ch] text-[14px] leading-relaxed text-ink-2">{meta.description}</p>}
      {meta?.units && (
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[12px]">
          {Object.entries(meta.units).map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <dt className="font-mono text-ink">{k}</dt>
              <dd className="text-muted">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {meta?.source && (
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 text-[12px]">
          <span className="text-muted">Table source</span>
          <SourceText source={meta.source} url={meta.source_url} />
        </div>
      )}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export function TableShell({ children, minWidth = 760, caption }: { children: ReactNode; minWidth?: number; caption?: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full border-collapse text-[13px]" style={{ minWidth }}>
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

export const TH = "whitespace-nowrap border-b border-line bg-tablehead px-3 py-2.5 text-left text-[12px] font-medium text-muted";
export const TD = "border-t border-line px-3 py-3 align-top";
export const NUM = "text-right font-mono tabular whitespace-nowrap";

export function GroupRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <th colSpan={colSpan} scope="colgroup" className="border-t border-line bg-paper/70 px-3 py-2 text-left text-[12px] font-semibold text-ink">
        {children}
      </th>
    </tr>
  );
}

/** A key for "same source as the row above", so long runs of one citation collapse to a ditto. */
export function provKey(p: { source: string; source_url?: string | null; notes?: string | null; is_sample: boolean }) {
  return [p.source, p.source_url ?? "", p.notes ?? "", p.is_sample].join("|");
}

/** For each row, whether its provenance repeats the previous row's. */
export function dittos<T extends { source: string; source_url?: string | null; notes?: string | null; is_sample: boolean }>(rows: T[]) {
  return rows.map((r, i) => i > 0 && provKey(r) === provKey(rows[i - 1]));
}

/**
 * The provenance cell every numeric row ends with: whether the value is real
 * (sourced) or sample, then where it comes from. A repeat of the row above
 * shows as a ditto, the way a printed price book does it.
 */
export function ProvCell({
  source,
  url,
  notes,
  isSample,
  ditto = false,
  className,
}: {
  source: string;
  url?: string | null;
  notes?: string | null;
  isSample: boolean;
  ditto?: boolean;
  className?: string;
}) {
  return (
    <td className={cn(TD, "min-w-[240px] max-w-[420px]", className)}>
      <div className="mb-1">
        <StatusMark isSample={isSample} />
      </div>
      {ditto ? (
        <span className="text-[12px] text-muted" title={source}>
          Same source as above
        </span>
      ) : (
        <SourceText source={source} url={url} notes={notes} />
      )}
    </td>
  );
}
