"use client";
import { useState, type ReactNode } from "react";
import { ewcCatalogue, materialById, materials } from "@/lib/data";
import { CONTAMINATION_LEVELS, type Contamination, type MaterialId } from "@/lib/types";
import { CONFIDENCE_THRESHOLD, type VisionResponse } from "@/lib/vision/schema";
import { Button, Card, ConfidenceMeter, Pill, SectionTitle, Segmented, cx } from "../ui";
import type { FieldKey, PhotoState, StreamState } from "./shared";

const STREAM_COLOR: Record<string, string> = {
  cardboard_paper: "#b98b4e",
  clean_wood: "#8a6b3f",
  mixed_cd: "#6b7078",
  scrap_metal: "#3f4650",
  plastic_film: "#7aa7d9",
  organic_food: "#6f9a2c",
  other: "#cdc8ba",
};

function Field({
  pulse,
  label,
  confidence,
  aiValue,
  edited,
  confirmed,
  onConfirm,
  children,
  hint,
  why,
}: {
  label: FieldKey;
  confidence: number;
  aiValue: string;
  edited: boolean;
  confirmed: boolean;
  onConfirm: (v: boolean) => void;
  children: ReactNode;
  /** One line that stays visible under the control. */
  hint?: ReactNode;
  /** The AI's reasoning, folded away until asked for. */
  why?: ReactNode;
  pulse?: boolean;
}) {
  const flagged = confidence < CONFIDENCE_THRESHOLD;
  const needs = flagged && !edited && !confirmed;
  return (
    <div
      id={`field-${label}`}
      className={cx(
        "scroll-mt-28 rounded-xl border bg-surface p-4 transition-[border-color,box-shadow] duration-300 ease-out-quart",
        pulse && "wq-ring-flag",
        needs ? "border-flag/50 shadow-[inset_3px_0_0_var(--color-flag)]" : "border-line",
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{label}</span>
          {edited ? (
            <Pill tone="ink">Edited · AI said {aiValue}</Pill>
          ) : needs ? (
            <Pill tone="flag">Check this</Pill>
          ) : flagged && confirmed ? (
            <Pill tone="good">Confirmed</Pill>
          ) : null}
        </div>
        <ConfidenceMeter value={confidence} threshold={CONFIDENCE_THRESHOLD} />
      </div>
      {children}
      {hint && <div className="mt-2 text-xs leading-relaxed text-ink-2">{hint}</div>}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        {why ? (
          <details className="group min-w-0 flex-1 text-xs text-muted">
            <summary className="flex items-center gap-1.5 hover:text-ink">
              <svg viewBox="0 0 12 12" className="h-3 w-3 transition-transform group-open:rotate-90" aria-hidden>
                <path d="M4 2.5L7.5 6 4 9.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Why the AI said this
            </summary>
            <div className="wq-fade-in mt-1.5 leading-relaxed text-ink-2">{why}</div>
          </details>
        ) : (
          <span />
        )}
        {flagged && !edited && (
          <button
            type="button"
            onClick={() => onConfirm(!confirmed)}
            className={cx(
              "wq-press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              confirmed ? "bg-circular text-white" : "border border-flag/50 bg-flag-soft text-flag hover:border-flag",
            )}
          >
            {confirmed ? (
              <>
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                  <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Confirmed
              </>
            ) : (
              "Confirm"
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function ReviewStep({
  photo,
  vision,
  stream,
  setStream,
  confirmed,
  setConfirmed,
  onBack,
  onNext,
}: {
  photo: PhotoState;
  vision: VisionResponse;
  stream: StreamState;
  setStream: (s: StreamState) => void;
  confirmed: Set<FieldKey>;
  setConfirmed: (k: FieldKey, v: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const r = vision.result;
  const material = materialById(stream.material)!;
  const aiMaterial = materialById(r.primary_stream.value)!;
  const codes = ewcCatalogue.filter((e) => e.material === stream.material);

  const fields: Array<{ key: FieldKey; conf: number; edited: boolean }> = [
    { key: "Material stream", conf: r.primary_stream.confidence, edited: stream.material !== r.primary_stream.value },
    { key: "Contamination", conf: r.contamination.confidence, edited: stream.contamination !== r.contamination.value },
    { key: "Volume (m³ per week)", conf: r.volume_m3.confidence, edited: stream.volumePerWeekM3 !== Math.max(0.1, Math.round(r.volume_m3.value * 10) / 10) },
    { key: "EWC code", conf: r.ewc_code.confidence, edited: stream.ewc !== r.ewc_code.value },
  ];
  const [pulse, setPulse] = useState<{ key: FieldKey; n: number } | null>(null);
  function next() {
    if (!pending.length) return onNext();
    const key = pending[0].key;
    document.getElementById(`field-${key}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    setPulse((p) => ({ key, n: (p?.n ?? 0) + 1 }));
  }
  const pending = fields.filter((f) => f.conf < CONFIDENCE_THRESHOLD && !f.edited && !confirmed.has(f.key));
  const f = (k: FieldKey) => fields.find((x) => x.key === k)!;

  function setMaterial(m: MaterialId) {
    const def = materialById(m)!;
    const ewcOk = ewcCatalogue.some((e) => e.code === stream.ewc && e.material === m);
    setStream({ ...stream, material: m, ewc: ewcOk ? stream.ewc : def.ewc_codes[0] });
  }

  return (
    <div>
      <SectionTitle
        step="Step 2"
        title="Check what the AI saw"
        hint={
          vision.mode === "claude" || vision.mode === "sailsrep" ? (
            <Pill tone="good">
              {vision.mode === "sailsrep" ? "Selinsight AI" : `Claude vision · ${vision.model}`} · {(vision.ms / 1000).toFixed(1)} s
            </Pill>
          ) : (
            <span title={vision.note ?? undefined}>
              <Pill tone="flag">{vision.mode === "stub" ? "Vision stub · recorded result, not live" : "Live vision failed · stub result"}</Pill>
            </span>
          )
        }
      />
      {vision.note && vision.mode !== "claude" && vision.mode !== "sailsrep" && (
        <div className="mb-4 rounded-lg border border-flag/30 bg-flag-soft px-4 py-2.5 text-xs text-flag">{vision.note}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="space-y-4">
          <Card className="overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.dataUrl} alt="Waste stream" className="max-h-[420px] w-full bg-ink object-contain" />
            <div className="space-y-4 p-5">
              <p className="text-[15px] leading-relaxed text-ink">{r.summary}</p>
              {r.materials_seen.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[12px] text-muted">Materials seen</div>
                  <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
                    {r.materials_seen.map((m, i) => (
                      <div
                        key={i}
                        title={`${materialById(m.stream)?.name ?? "Other"}: ${m.share_pct}%`}
                        style={{ width: `${m.share_pct}%`, background: STREAM_COLOR[m.stream] ?? STREAM_COLOR.other }}
                        className="h-full first:rounded-l-full last:rounded-r-full"
                      />
                    ))}
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {r.materials_seen.map((m, i) => (
                      <li key={i} className="flex gap-2.5 text-xs text-ink-2">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: STREAM_COLOR[m.stream] ?? STREAM_COLOR.other }} />
                        <span className="w-8 shrink-0 font-mono tabular text-ink">{m.share_pct}%</span>
                        <span>
                          <span className="font-medium text-ink">{materialById(m.stream)?.name ?? "Other"}</span> · {m.evidence}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
          {r.hazard_flags.length > 0 && (
            <div className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3">
              <div className="mb-1 text-sm font-semibold text-danger">Check before collection</div>
              <ul className="list-disc space-y-1 pl-4 text-sm text-ink">
                {r.hazard_flags.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}
          {r.segregation_tip && (
            <div className="rounded-xl border border-circular/25 bg-circular-soft px-4 py-3">
              <div className="mb-1 text-sm font-semibold text-circular">Circular opportunity</div>
              <p className="text-sm text-ink">{r.segregation_tip}</p>
            </div>
          )}
        </div>

        <div className="wq-stagger space-y-3">
          <Field
            key={pulse?.key === "Material stream" ? `p${pulse.n}` : "Material stream"}
            pulse={pulse?.key === "Material stream"}
            label="Material stream"
            confidence={f("Material stream").conf}
            aiValue={aiMaterial.name}
            edited={f("Material stream").edited}
            confirmed={confirmed.has("Material stream")}
            onConfirm={(v) => setConfirmed("Material stream", v)}
            why={r.primary_stream.rationale}
          >
            <select
              value={stream.material}
              onChange={(e) => setMaterial(e.target.value as MaterialId)}
              className="w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-sm"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.examples})
                </option>
              ))}
            </select>
          </Field>

          <Field
            key={pulse?.key === "Contamination" ? `p${pulse.n}` : "Contamination"}
            pulse={pulse?.key === "Contamination"}
            label="Contamination"
            confidence={f("Contamination").conf}
            aiValue={r.contamination.value}
            edited={f("Contamination").edited}
            confirmed={confirmed.has("Contamination")}
            onConfirm={(v) => setConfirmed("Contamination", v)}
            hint={
              <span key={stream.contamination} className="wq-text-in block">
                <span className="font-medium text-ink">{stream.contamination[0].toUpperCase() + stream.contamination.slice(1)}:</span>{" "}
                {material.contamination[stream.contamination]}
              </span>
            }
            why={
              <>
                {r.contamination.contaminants.length > 0 && <span className="block">AI saw: {r.contamination.contaminants.join(", ")}.</span>}
                {r.contamination.rationale}
              </>
            }
          >
            <Segmented<Contamination>
              value={stream.contamination}
              onChange={(v) => setStream({ ...stream, contamination: v })}
              options={CONTAMINATION_LEVELS.map((l) => ({ value: l, label: l[0].toUpperCase() + l.slice(1) }))}
            />
          </Field>

          <Field
            key={pulse?.key === "Volume (m³ per week)" ? `p${pulse.n}` : "Volume (m³ per week)"}
            pulse={pulse?.key === "Volume (m³ per week)"}
            label="Volume (m³ per week)"
            confidence={f("Volume (m³ per week)").conf}
            aiValue={`${r.volume_m3.value} m³`}
            edited={f("Volume (m³ per week)").edited}
            confirmed={confirmed.has("Volume (m³ per week)")}
            onConfirm={(v) => setConfirmed("Volume (m³ per week)", v)}
            hint={<>The AI estimated {r.volume_m3.value} m³ in the photo. Adjust to what the site produces per week.</>}
            why={r.volume_m3.basis}
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0.1}
                step={0.5}
                value={stream.volumePerWeekM3}
                onChange={(e) => setStream({ ...stream, volumePerWeekM3: Math.max(0.1, Number(e.target.value) || 0.1) })}
                className="w-28 rounded-md border border-line-2 bg-surface px-3 py-2 font-mono text-sm tabular"
              />
              <span className="text-sm text-ink-2">m³ of loose waste per week</span>
            </div>
          </Field>

          <Field
            key={pulse?.key === "EWC code" ? `p${pulse.n}` : "EWC code"}
            pulse={pulse?.key === "EWC code"}
            label="EWC code"
            confidence={f("EWC code").conf}
            aiValue={r.ewc_code.value}
            edited={f("EWC code").edited}
            confirmed={confirmed.has("EWC code")}
            onConfirm={(v) => setConfirmed("EWC code", v)}
            hint={ewcCatalogue.find((e) => e.code === stream.ewc)?.chapter}
            why={r.ewc_code.rationale}
          >
            <select
              value={stream.ewc}
              onChange={(e) => setStream({ ...stream, ewc: e.target.value })}
              className="w-full rounded-md border border-line-2 bg-surface px-3 py-2 font-mono text-sm"
            >
              {codes.map((e) => (
                <option key={e.code} value={e.code}>
                  {e.code} · {e.description}
                </option>
              ))}
            </select>
          </Field>

          <div className="sticky bottom-3 z-10 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface/90 px-3 py-2.5 shadow-[0_12px_32px_-18px_rgba(0,0,0,.35)] backdrop-blur">
            <Button variant="ghost" onClick={onBack}>
              ← New photo
            </Button>
            <div className="flex items-center gap-3">
              <span
                className={cx(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  pending.length ? "bg-flag-soft text-flag" : "bg-circular-soft text-circular",
                )}
              >
                {pending.length ? (
                  <>
                    <span className="font-mono">{pending.length}</span> field{pending.length > 1 ? "s" : ""} to check
                  </>
                ) : (
                  "All checked"
                )}
              </span>
              <Button onClick={next} className="wq-press">
                Configure service →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
