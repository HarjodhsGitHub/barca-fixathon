"use client";
import { useEffect, useRef, useState } from "react";
import { Pill, cx } from "../ui";
import type { AppInfo } from "./shared";

const DEMO: Record<string, { label: string; tag: string }> = {
  "01-cardboard.jpg": { label: "Cardboard in a roll-off", tag: "Factory packaging" },
  "02-mixed-construction.jpg": { label: "Builders' skip", tag: "Construction site" },
  "03-wood.jpg": { label: "Pallets and wood scrap", tag: "Distribution yard" },
  "04-scrap-metal.jpg": { label: "Mixed scrap metal", tag: "Recycling centre" },
};

const HOW = [
  { n: "01", t: "Photo", d: "Snap the bin, skip or pile on site." },
  { n: "02", t: "AI fills the quote", d: "Material, contamination, volume, EWC code. You confirm." },
  { n: "03", t: "Every route priced", d: "Reuse to landfill, cost and CO₂e side by side." },
];

export function PhotoStep({
  info,
  busy,
  onPick,
}: {
  info: AppInfo;
  busy: boolean;
  onPick: (file: Blob, filename: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  async function pickDemo(name: string) {
    const res = await fetch(`/api/demo-photo/${encodeURIComponent(name)}`);
    onPick(await res.blob(), name);
  }

  const fileInput = (ref: React.RefObject<HTMLInputElement | null>, capture?: boolean) => (
    <input
      ref={ref}
      type="file"
      accept="image/*"
      capture={capture ? "environment" : undefined}
      hidden
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) onPick(f, f.name);
        e.target.value = "";
      }}
    />
  );

  return (
    <div>
      <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="flex flex-col justify-between gap-8 py-2">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">New quote</div>
            <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              What are we
              <br />
              quoting today?
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-2">
              One photo of the customer&apos;s waste. Selinsight works out what it is, opens only the routes the rules allow, and prices
              every one of them, circular first.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => camRef.current?.click()}
                className="wq-press inline-flex items-center gap-2 rounded-xl bg-circular px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(11,113,73,.7)] hover:bg-circular/90 disabled:opacity-40"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M3 7h3l1.5-2.5h5L14 7h3v9H3z" strokeLinejoin="round" />
                  <circle cx="10" cy="11.5" r="3" />
                </svg>
                Take a photo
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
                className="wq-press rounded-xl border border-line-2 bg-surface px-5 py-3 text-sm font-semibold hover:border-ink disabled:opacity-40"
              >
                Upload one
              </button>
              {info.vision.provider === "stub" && <Pill tone="flag">Recorded demo results only</Pill>}
            </div>
          </div>
          <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {HOW.map((h) => (
              <li key={h.n} className="rounded-xl border border-line bg-surface/70 p-3">
                <div className="font-mono text-[11px] text-circular">{h.n}</div>
                <div className="mt-1 text-sm font-semibold">{h.t}</div>
                <div className="mt-0.5 text-xs leading-snug text-ink-2">{h.d}</div>
              </li>
            ))}
          </ol>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) onPick(f, f.name);
          }}
          onClick={() => !busy && fileRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
          }}
          className={cx(
            "group relative flex min-h-[360px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border transition-all duration-300",
            drag ? "scale-[1.01] border-circular bg-circular-soft" : "border-line bg-surface hover:border-line-2",
          )}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,var(--color-circular-soft),transparent_60%)] opacity-70" />
          {(["left-6 top-6 border-l-2 border-t-2 rounded-tl-xl", "right-6 top-6 border-r-2 border-t-2 rounded-tr-xl", "bottom-6 left-6 border-b-2 border-l-2 rounded-bl-xl", "bottom-6 right-6 border-b-2 border-r-2 rounded-br-xl"] as const).map((c) => (
            <span
              key={c}
              className={cx("pointer-events-none absolute h-10 w-10 transition-colors duration-300", c, drag ? "border-circular" : "border-ink/25 group-hover:border-ink/50")}
            />
          ))}
          <div className="relative flex flex-col items-center px-8 text-center">
            <div className={cx("flex h-16 w-16 items-center justify-center rounded-2xl bg-ink text-white shadow-lg transition-transform duration-300", drag ? "scale-110" : "group-hover:-translate-y-1")}>
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <path d="M12 16V5M7.5 9.5 12 5l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="mt-5 text-lg font-semibold">{drag ? "Drop it" : "Drop a photo here"}</p>
            <p className="mt-1 text-sm text-muted">A bin, a skip, a roll-off or a pile. JPEG, PNG or WebP.</p>
          </div>
          {fileInput(fileRef)}
          {fileInput(camRef, true)}
        </div>
      </div>

      {info.demoPhotos.length > 0 && (
        <div className="mt-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Or try a site photo</h2>
            <span className="text-xs text-muted">Wikimedia Commons, CC BY-SA</span>
          </div>
          <div className="wq-stagger grid grid-cols-2 gap-3 md:grid-cols-4">
            {info.demoPhotos.map((name) => {
              const d = DEMO[name] ?? { label: name, tag: "Demo photo" };
              return (
                <div key={name}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => pickDemo(name)}
                    className="wq-lift wq-press group relative block w-full overflow-hidden rounded-2xl border border-line bg-surface text-left disabled:opacity-50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/demo-photo/${encodeURIComponent(name)}`}
                      alt={d.label}
                      className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[4/3] bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/45 px-2 py-0.5 text-[11px] text-white backdrop-blur">
                      {d.tag}
                    </span>
                    <span className="pointer-events-none absolute right-3 top-[calc(75%-2.25rem)] translate-y-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink opacity-0 shadow transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      Use this photo →
                    </span>
                    <div className="px-3.5 py-3">
                      <div className="text-sm font-semibold">{d.label}</div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export type ProgressItem =
  | { kind: "activity"; label: string }
  | { kind: "selection"; module: string; value: string; reason: string | null };

const FIELDS = [
  { key: "Waste stream", hint: "material" },
  { key: "Contamination", hint: "how clean it is" },
  { key: "Volume", hint: "m³ per week" },
  { key: "EWC code", hint: "waste catalogue" },
] as const;

/** The engine's activity labels are written for a shopper; say what is happening here. */
function friendly(label?: string) {
  if (!label) return null;
  if (/preference|saving|updat/i.test(label)) return "Writing it into the configuration";
  if (/inspect|image|photo|look/i.test(label)) return "Inspecting the photo";
  if (/catalog|option|product/i.test(label)) return "Checking the catalogue";
  return label.replace(/\.\.\.$|…$/, "");
}

function Bracket({ className }: { className: string }) {
  return <span className={`wq-bracket pointer-events-none absolute h-8 w-8 border-white/80 ${className}`} />;
}

export function Analysing({
  dataUrl,
  provider,
  label,
  progress,
}: {
  dataUrl: string;
  provider: AppInfo["vision"]["provider"];
  label: string;
  progress: ProgressItem[];
}) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const selections = progress.filter((p): p is Extract<ProgressItem, { kind: "selection" }> => p.kind === "selection");
  const activities = progress.filter((p): p is Extract<ProgressItem, { kind: "activity" }> => p.kind === "activity");
  const status = friendly(activities.at(-1)?.label) ?? "Reading the photo";
  const hit = (key: string) => selections.find((s) => s.module.toLowerCase().startsWith(key.toLowerCase().split(" ")[0]));
  const done = FIELDS.filter((f) => hit(f.key)).length;

  return (
    <div className="wq-fade-in">
      <div className="relative overflow-hidden rounded-3xl bg-[#0c0e0f] shadow-[0_30px_80px_-40px_rgba(0,0,0,.6)]">
        {/* blurred fill behind the sharp photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(12,14,15,.85)_100%)]" />

        <div className="relative grid min-h-[min(72vh,640px)] lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* the photo, in a viewfinder */}
          <div className="relative flex items-center justify-center p-6 sm:p-10">
            <div className="relative overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={dataUrl} alt="The waste being classified" className="wq-kenburns block max-h-[56vh] w-auto max-w-full rounded-xl object-contain" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(127,214,168,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(127,214,168,.08)_1px,transparent_1px)] bg-[size:40px_40px]" />
              <div className="wq-beam pointer-events-none absolute inset-x-0 h-24 -translate-y-1/2">
                <div className="h-full bg-gradient-to-b from-transparent via-[#7fd6a8]/20 to-transparent" />
                <div className="absolute inset-x-0 top-1/2 h-px bg-[#7fd6a8] shadow-[0_0_18px_4px_rgba(127,214,168,.55)]" />
              </div>
            </div>
            <Bracket className="left-4 top-4 rounded-tl-lg border-l-2 border-t-2 sm:left-6 sm:top-6" />
            <Bracket className="right-4 top-4 rounded-tr-lg border-r-2 border-t-2 sm:right-6 sm:top-6" />
            <Bracket className="bottom-4 left-4 rounded-bl-lg border-b-2 border-l-2 sm:bottom-6 sm:left-6" />
            <Bracket className="bottom-4 right-4 rounded-br-lg border-b-2 border-r-2 sm:bottom-6 sm:right-6" />

            <div className="absolute left-6 top-6 hidden font-mono text-[10px] uppercase tracking-[0.2em] text-white/60 sm:left-9 sm:top-9 sm:block">
              {provider === "stub" ? "Recorded result" : label} · reading
            </div>
            <div className="absolute right-6 top-6 font-mono text-[11px] tabular text-white/70 sm:right-9 sm:top-9">
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
            </div>
            <div className="absolute inset-x-0 bottom-7 flex justify-center px-6 sm:bottom-10">
              <div className="flex max-w-full items-center gap-2.5 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-md">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7fd6a8] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7fd6a8]" />
                </span>
                <span key={status} className="wq-text-in truncate">
                  {status}
                </span>
              </div>
            </div>
          </div>

          {/* what the AI has filled in so far */}
          <div className="relative border-t border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl lg:border-l lg:border-t-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">Configuration</div>
            <div className="mt-1 text-lg font-semibold text-white">
              {done === 0 ? "Looking at the photo" : done < FIELDS.length ? "Filling in the quote" : "Ready"}
            </div>
            <div className="mt-3 h-0.5 overflow-hidden rounded-full bg-white/10">
              <div className="wq-indeterminate h-full w-1/4 rounded-full bg-[#7fd6a8]" />
            </div>
            <ul className="mt-5 space-y-2.5">
              {FIELDS.map((f) => {
                const h = hit(f.key);
                return (
                  <li
                    key={f.key}
                    className={cx(
                      "rounded-xl border px-3.5 py-3 transition-colors duration-500",
                      h ? "wq-pop border-[#7fd6a8]/40 bg-[#7fd6a8]/10" : "border-white/10 bg-white/[0.03]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] uppercase tracking-wider text-white/50">{f.key}</span>
                      {h ? (
                        <svg viewBox="0 0 16 16" className="h-4 w-4 text-[#7fd6a8]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <span className="text-[11px] text-white/30">{f.hint}</span>
                      )}
                    </div>
                    {h ? (
                      <>
                        <div className="mt-1 text-sm font-semibold text-white">{h.value}</div>
                        {h.reason && <div className="mt-1 line-clamp-2 text-xs leading-snug text-white/60">{h.reason}</div>}
                      </>
                    ) : (
                      <div className="mt-2 h-3 w-2/3 overflow-hidden rounded bg-white/[0.06]">
                        <div className="wq-shimmer h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-white/45">
              {provider === "stub"
                ? "Recorded demo result. You confirm every field on the next step."
                : "Usually 20-40 seconds. Stream and contamination appear here as the AI sets them; volume and EWC code come with its full answer. You confirm every field next."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
