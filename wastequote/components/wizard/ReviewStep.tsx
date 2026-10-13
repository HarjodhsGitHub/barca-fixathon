"use client";
import type { ReactNode } from "react";
import { ewcCatalogue, materialById, materials } from "@/lib/data";
import { CONTAMINATION_LEVELS, type Contamination, type MaterialId } from "@/lib/types";
import { CONFIDENCE_THRESHOLD, type VisionResponse } from "@/lib/vision/schema";
import { Button, Card, ConfidenceMeter, Pill, SectionTitle, Segmented, cx } from "../ui";
import type { FieldKey, PhotoState, StreamState } from "./shared";

function Field({
  label,
  confidence,
  aiValue,
  edited,
  confirmed,
  onConfirm,
  children,
  note,
}: {
  label: FieldKey;
  confidence: number;
  aiValue: string;
  edited: boolean;
  confirmed: boolean;
  onConfirm: (v: boolean) => void;
  children: ReactNode;
  note?: ReactNode;
}) {
  const flagged = confidence < CONFIDENCE_THRESHOLD;
  const needs = flagged && !edited && !confirmed;
  return (
    <div
      className={cx(
        "rounded-lg border bg-surface p-4 transition-colors",
        needs ? "border-flag/60 shadow-[inset_3px_0_0_var(--color-flag)]" : "border-line",
      )}
    >
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {edited ? (
            <Pill tone="ink">Edited · AI said {aiValue}</Pill>
          ) : flagged ? (
            <Pill tone="flag">Low confidence: check this</Pill>
          ) : null}
        </div>
        <ConfidenceMeter value={confidence} threshold={CONFIDENCE_THRESHOLD} />
      </div>
      {children}
      {note && <div className="mt-2 text-xs leading-relaxed text-muted">{note}</div>}
      {flagged && !edited && (
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs font-medium text-ink-2">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => onConfirm(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-circular)]"
          />
          I checked this against the photo or the site
        </label>
      )}
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
              {vision.mode === "sailsrep" ? "Sailsrep assistant" : `Claude vision · ${vision.model}`} · {(vision.ms / 1000).toFixed(1)} s
            </Pill>
          ) : (
            <span title={vision.note ?? undefined}>
              <Pill tone="flag">{vision.mode === "stub" ? "Vision stub · recorded result, not live" : "Live vision failed · stub result"}</Pill>
            </span>
          )
        }
      />
      {vision.mode === "sailsrep" && vision.agentNotes && vision.agentNotes.length > 0 && (
        <div className="mb-4 rounded-lg border border-line bg-surface px-4 py-2.5 text-xs text-ink-2">
          <span className="font-semibold text-ink">Set in the Sailsrep configuration by the assistant:</span>{" "}
          {vision.agentNotes.join(" ")}
        </div>
      )}
      {vision.note && vision.mode !== "claude" && vision.mode !== "sailsrep" && (
        <div className="mb-4 rounded-lg border border-flag/30 bg-flag-soft px-4 py-2.5 text-xs text-flag">{vision.note}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.dataUrl} alt="Waste stream" className="max-h-[420px] w-full bg-ink object-contain" />
            <div className="space-y-3 p-4">
              <p className="text-sm leading-relaxed">{r.summary}</p>
              {r.materials_seen.length > 0 && (
                <div>
                  <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">Materials seen</div>
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-sunken">
                    {r.materials_seen.map((m, i) => (
                      <div
                        key={i}
                        title={`${m.stream}: ${m.share_pct}%`}
                        style={{ width: `${m.share_pct}%`, opacity: 1 - i * 0.2 }}
                        className={cx(i === 0 ? "bg-ink" : "bg-ink-2", "border-r border-surface last:border-r-0")}
                      />
                    ))}
                  </div>
                  <ul className="mt-2 space-y-1">
                    {r.materials_seen.map((m, i) => (
                      <li key={i} className="flex gap-2 text-xs text-ink-2">
                        <span className="w-9 shrink-0 text-right font-mono tabular text-ink">{m.share_pct}%</span>
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
            <div className="rounded-lg border border-danger/25 bg-danger-soft px-4 py-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-danger">Check before collection</div>
              <ul className="list-disc space-y-1 pl-4 text-sm text-ink">
                {r.hazard_flags.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}
          {r.segregation_tip && (
            <div className="rounded-lg border border-circular/25 bg-circular-soft px-4 py-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-circular">Circular opportunity</div>
              <p className="text-sm text-ink">{r.segregation_tip}</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Field
            label="Material stream"
            confidence={f("Material stream").conf}
            aiValue={aiMaterial.name}
            edited={f("Material stream").edited}
            confirmed={confirmed.has("Material stream")}
            onConfirm={(v) => setConfirmed("Material stream", v)}
            note={r.primary_stream.rationale}
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
            label="Contamination"
            confidence={f("Contamination").conf}
            aiValue={r.contamination.value}
            edited={f("Contamination").edited}
            confirmed={confirmed.has("Contamination")}
            onConfirm={(v) => setConfirmed("Contamination", v)}
            note={
              <>
                <span className="font-medium text-ink-2">{material.name}, {stream.contamination}:</span>{" "}
                {material.contamination[stream.contamination]}
                {r.contamination.contaminants.length > 0 && (
                  <span className="mt-1 block">AI saw: {r.contamination.contaminants.join(", ")}. {r.contamination.rationale}</span>
                )}
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
            label="Volume (m³ per week)"
            confidence={f("Volume (m³ per week)").conf}
            aiValue={`${r.volume_m3.value} m³`}
            edited={f("Volume (m³ per week)").edited}
            confirmed={confirmed.has("Volume (m³ per week)")}
            onConfirm={(v) => setConfirmed("Volume (m³ per week)", v)}
            note={
              <>
                AI: {r.volume_m3.value} m³ in the photo. {r.volume_m3.basis} Adjust to what the site produces per week.
              </>
            }
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
            label="EWC code"
            confidence={f("EWC code").conf}
            aiValue={r.ewc_code.value}
            edited={f("EWC code").edited}
            confirmed={confirmed.has("EWC code")}
            onConfirm={(v) => setConfirmed("EWC code", v)}
            note={r.ewc_code.rationale}
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

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button variant="ghost" onClick={onBack}>
              ← New photo
            </Button>
            <div className="flex items-center gap-3">
              {pending.length > 0 && (
                <span className="text-xs text-flag">
                  {pending.length} field{pending.length > 1 ? "s" : ""} below {Math.round(CONFIDENCE_THRESHOLD * 100)}% confidence to confirm
                </span>
              )}
              <Button onClick={onNext} disabled={pending.length > 0}>
                Configure service →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
