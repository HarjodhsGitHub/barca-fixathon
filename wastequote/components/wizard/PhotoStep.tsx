"use client";
import { useEffect, useRef, useState } from "react";
import { Card, Pill, SectionTitle, cx } from "../ui";
import type { AppInfo } from "./shared";

const DEMO_LABELS: Record<string, string> = {
  "01-cardboard.jpg": "Cardboard in a roll-off",
  "02-mixed-construction.jpg": "Builders' skip, mixed site waste",
  "03-wood.jpg": "Pallets and wood scrap",
  "04-scrap-metal.jpg": "Mixed scrap metal",
};

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

  return (
    <div>
      <SectionTitle
        step="Step 1"
        title="Photograph the waste stream"
        hint={
          info.vision.provider === "stub" ? (
            <Pill tone="flag">Vision stub · recorded demo results only</Pill>
          ) : (
            <Pill tone="good">Vision: {info.vision.label}</Pill>
          )
        }
      />
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
        className={cx(
          "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors",
          drag ? "border-circular bg-circular-soft" : "border-line-2 bg-surface",
        )}
      >
        <svg viewBox="0 0 48 48" className="h-12 w-12 text-muted" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M6 16h8l3-5h14l3 5h8v22H6z" strokeLinejoin="round" />
          <circle cx="24" cy="26" r="7" />
        </svg>
        <div>
          <p className="text-base font-medium">Drop a photo of a bin, skip or pile</p>
          <p className="mt-1 text-sm text-muted">
            AI vision suggests the material, contamination, volume and EWC code. You confirm every field.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-ink/85 disabled:opacity-40"
          >
            Upload photo
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => camRef.current?.click()}
            className="rounded-lg border border-line-2 bg-surface px-4 py-2.5 text-sm font-medium hover:border-ink disabled:opacity-40"
          >
            Take photo
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f, f.name);
            e.target.value = "";
          }}
        />
        <input
          ref={camRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f, f.name);
            e.target.value = "";
          }}
        />
      </div>

      {info.demoPhotos.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-sm font-medium">Or try a demo photo</h3>
            <span className="text-xs text-muted">Wikimedia Commons, CC BY-SA (demo/CREDITS.md)</span>
          </div>
          <div className="wq-stagger grid grid-cols-2 gap-3 md:grid-cols-4">
            {info.demoPhotos.map((name, i) => (
              <div key={name} style={{ "--i": i } as React.CSSProperties}>
              <Card className="wq-lift overflow-hidden">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => pickDemo(name)}
                  className="group block w-full text-left disabled:opacity-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/demo-photo/${encodeURIComponent(name)}`}
                    alt={DEMO_LABELS[name] ?? name}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="px-3 py-2.5">
                    <div className="text-sm font-medium">{DEMO_LABELS[name] ?? name}</div>
                    <div className="font-mono text-[11px] text-muted">{name}</div>
                  </div>
                </button>
              </Card>
              </div>
            ))}
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
