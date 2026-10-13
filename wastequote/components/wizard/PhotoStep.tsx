"use client";
import { useRef, useState } from "react";
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
          info.vision.live ? (
            <Pill tone="good">Claude vision live · {info.vision.model}</Pill>
          ) : (
            <Pill tone="flag">Vision stub · no API key</Pill>
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
            Claude suggests the material, contamination, volume and EWC code. You confirm every field.
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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {info.demoPhotos.map((name) => (
              <Card key={name} className="overflow-hidden">
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Analysing({ dataUrl, live }: { dataUrl: string; live: boolean }) {
  return (
    <div>
      <SectionTitle step="Step 1" title={live ? "Claude is reading the photo…" : "Loading the recorded classification…"} />
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-xl border border-line bg-ink">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt="Uploaded waste" className="max-h-[60vh] w-full object-contain opacity-80" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="scanline h-1/3 w-full bg-gradient-to-b from-transparent via-[#7fd6a8]/25 to-transparent" />
        </div>
        <div className="absolute bottom-3 left-3 rounded-md bg-ink/80 px-3 py-1.5 font-mono text-xs text-white">
          material · contamination · volume · EWC code
        </div>
      </div>
    </div>
  );
}
