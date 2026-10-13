"use client";
// Price book contents: a sticky list on wide screens, a sticky scrolling bar on phones.
// Highlights the section in view so a long page never loses its place.
import { useEffect, useRef, useState } from "react";

export type TocItem = { id: string; label: string; total: number; sample: number };
export type TocGroup = { label: string; items: TocItem[] };

function ShareBar({ total, sample }: { total: number; sample: number }) {
  if (total === 0) return null;
  const sourced = total - sample;
  return (
    <span
      className="flex h-1.5 w-10 shrink-0 overflow-hidden rounded-full bg-sunken"
      title={`${sourced} sourced, ${sample} sample`}
      aria-label={`${sourced} sourced, ${sample} sample`}
    >
      <span className="bg-circular" style={{ width: `${(sourced / total) * 100}%` }} />
      <span className="sample-stripe" style={{ width: `${(sample / total) * 100}%` }} />
    </span>
  );
}

export function Toc({ groups }: { groups: TocGroup[] }) {
  const ids = groups.flatMap((g) => g.items.map((i) => i.id));
  const [active, setActive] = useState(ids[0]);
  const barRef = useRef<HTMLDivElement>(null);
  const key = ids.join("|");

  useEffect(() => {
    const list = key.split("|");
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        const first = list.find((id) => visible.has(id));
        if (first) setActive(first);
      },
      { rootMargin: "-120px 0px -55% 0px" },
    );
    for (const id of list) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [key]);

  // Keep the active chip in view in the phone bar.
  useEffect(() => {
    const bar = barRef.current;
    const chip = bar?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!bar || !chip || bar.scrollWidth <= bar.clientWidth) return;
    bar.scrollTo({ left: chip.offsetLeft - 16, behavior: "smooth" });
  }, [active]);

  return (
    <>
      {/* Phones and tablets */}
      <div className="sticky top-14 z-20 -mx-4 border-b border-line bg-paper/95 backdrop-blur-md sm:-mx-6 lg:hidden">
        <div ref={barRef} className="no-scrollbar flex gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {groups.flatMap((g) => g.items).map((i) => (
            <a
              key={i.id}
              data-id={i.id}
              href={`#${i.id}`}
              className={
                "whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] transition-colors " +
                (active === i.id ? "bg-ink text-white" : "text-ink-2 hover:bg-sunken")
              }
            >
              {i.label}
            </a>
          ))}
        </div>
      </div>

      {/* Wide screens */}
      <nav aria-label="Price book contents" className="sticky top-20 hidden max-h-[calc(100vh-6rem)] overflow-y-auto pb-6 lg:block">
        {groups.map((g) => (
          <div key={g.label} className="mb-5">
            <div className="mb-1 px-2 text-[12px] font-semibold text-ink">{g.label}</div>
            <ul>
              {g.items.map((i) => (
                <li key={i.id}>
                  <a
                    href={`#${i.id}`}
                    aria-current={active === i.id ? "location" : undefined}
                    className={
                      "flex items-center justify-between gap-3 rounded-md border-l-2 px-2 py-1.5 text-[13px] transition-colors " +
                      (active === i.id ? "border-ink bg-surface font-medium text-ink" : "border-transparent text-ink-2 hover:bg-sunken hover:text-ink")
                    }
                  >
                    <span className="truncate">{i.label}</span>
                    <ShareBar total={i.total} sample={i.sample} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-2 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1">
            <span className="block h-1.5 w-3 rounded-full bg-circular" /> sourced
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="sample-stripe block h-1.5 w-3 rounded-full" /> sample
          </span>
        </div>
      </nav>
    </>
  );
}
