"use client";
import { containers, routes, service, treatments } from "@/lib/data";
import { computeCapacity, suggestContainer } from "@/lib/engine";
import { num, pct, tonnes } from "@/lib/format";
import type { RouteId, ServiceConfig } from "@/lib/types";
import { Markdown } from "../Markdown";
import { Button, Card, Pill, SampleBadge, SectionTitle, Segmented, cx } from "../ui";
import { containerStatus, routeStatus, type Availability, type Customer, type StreamState } from "./shared";

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">{children}</div>;
}

export function ConfigureStep({
  stream,
  config,
  setConfig,
  customer,
  setCustomer,
  availability,
  onBack,
  onNext,
}: {
  stream: StreamState;
  config: ServiceConfig;
  setConfig: (c: ServiceConfig) => void;
  customer: Customer;
  setCustomer: (c: Customer) => void;
  availability: Availability | null;
  onBack: () => void;
  onNext: () => void;
}) {
  const cap = computeCapacity(stream, config);
  const best = suggestContainer(stream, config.frequencyId);
  const utilPct = Math.min(cap.utilisation, 1.5);
  const containerOk = containerStatus(availability, stream.material, config.containerId).status !== "blocked";
  const openRoutes = routes.filter((r) => routeStatus(availability, stream.material, stream.contamination, r.id).open);

  return (
    <div>
      <SectionTitle
        step="Step 3"
        title="Configure the service"
        hint={
          availability?.source === "sailsrep" ? (
            <span title={`Configuration ${availability.configurationId}`}>
              <Pill tone="good">Live CPQ rules · {availability.ms} ms</Pill>
            </span>
          ) : availability ? (
            <span title={availability.reason}>
              <Pill tone="flag">Local rules (CPQ engine offline)</Pill>
            </span>
          ) : (
            <Pill>Checking rules…</Pill>
          )
        }
      />

      <div className="space-y-6">
        <Card className="p-5">
          <Label>Customer</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["company", "Company"],
                ["site", "Site address"],
                ["contact", "Contact"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="block text-xs text-ink-2">
                {label}
                <input
                  value={customer[k]}
                  onChange={(e) => setCustomer({ ...customer, [k]: e.target.value })}
                  className="mt-1 w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-sm text-ink"
                />
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <Label>Container</Label>
            {best && (best.containerId !== config.containerId || best.count !== config.containerCount) && (
              <button
                type="button"
                onClick={() => setConfig({ ...config, containerId: best.containerId, containerCount: best.count })}
                className="rounded-md border border-circular/40 bg-circular-soft px-2.5 py-1 text-xs font-medium text-circular hover:border-circular"
              >
                Use best fit: {best.count} × {containers.find((c) => c.id === best.containerId)?.name}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {containers.map((c) => {
              const st = containerStatus(availability, stream.material, c.id);
              const blocked = st.status === "blocked";
              const selected = c.id === config.containerId;
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={blocked}
                  onClick={() => setConfig({ ...config, containerId: c.id })}
                  title={blocked ? (st.reason ?? "Not available") : undefined}
                  className={cx(
                    "wq-press relative rounded-lg border p-3 text-left",
                    !blocked && "wq-lift",
                    selected
                      ? "border-ink bg-surface shadow-[inset_0_0_0_1px_var(--color-ink)]"
                      : blocked
                        ? "cursor-not-allowed border-line bg-sunken/60"
                        : "border-line bg-surface hover:border-ink-2",
                  )}
                >
                  <div className={cx("text-sm font-medium", blocked && "text-muted")}>{c.name}</div>
                  <div className={cx("mt-0.5 font-mono text-[11px] tabular", blocked ? "text-muted/70" : "text-ink-2")}>
                    €{c.rent_eur_per_month}/mo · €{c.lift_fee_eur}/lift · {c.max_payload_t} t
                  </div>
                  {blocked && (
                    <div className="mt-1.5 text-[11px] leading-snug text-muted">
                      Not offered for this stream
                      {availability?.source === "sailsrep" && st.reason ? <span className="block text-muted/80">Rule: {st.reason}</span> : null}
                    </div>
                  )}
                  {!blocked && availability?.source === "sailsrep" && availability.specs.containers[c.id]?.longDescription && (
                    <details className="mt-1.5 text-[11px] text-ink-2" onClick={(e) => e.stopPropagation()}>
                      <summary className="text-muted hover:text-ink">Specs</summary>
                      <Markdown
                        text={availability.specs.containers[c.id].longDescription!}
                        dropHeading={c.name}
                        className="mt-1 space-y-1 leading-snug"
                      />
                    </details>
                  )}
                  {best?.containerId === c.id && !blocked && (
                    <span className="absolute right-2 top-2 rounded bg-circular-soft px-1.5 py-0.5 text-[10px] font-medium text-circular">best fit</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-6">
            <div>
              <Label>How many</Label>
              <div className="inline-flex items-center rounded-lg border border-line-2 bg-surface">
                <button
                  type="button"
                  className="px-3 py-1.5 text-lg text-ink-2 hover:text-ink disabled:opacity-30"
                  disabled={config.containerCount <= 1}
                  onClick={() => setConfig({ ...config, containerCount: config.containerCount - 1 })}
                >
                  −
                </button>
                <span className="w-8 text-center font-mono tabular">{config.containerCount}</span>
                <button
                  type="button"
                  className="px-3 py-1.5 text-lg text-ink-2 hover:text-ink"
                  onClick={() => setConfig({ ...config, containerCount: Math.min(20, config.containerCount + 1) })}
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <Label>Pickup frequency</Label>
              <Segmented
                value={config.frequencyId}
                onChange={(v) => setConfig({ ...config, frequencyId: v })}
                options={service.frequencies.map((f) => ({ value: f.id, label: f.name }))}
              />
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-sunken/70 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span>
                <span className="font-mono tabular">{num(cap.volumePerMonthM3)}</span> m³/month generated ·{" "}
                <span className="font-mono tabular">{num(cap.capacityPerMonthM3)}</span> m³/month collected
              </span>
              <span className="text-ink-2">
                ≈ <span className="font-mono tabular text-ink">{tonnes(cap.tonnesPerMonth)}</span> t/month ·{" "}
                <span className="font-mono tabular">{num(cap.liftsPerMonth * config.containerCount)}</span> lifts/month
              </span>
            </div>
            <div className="relative mt-2.5 h-2.5 overflow-hidden rounded-full bg-surface">
              <div
                className={cx("absolute inset-y-0 left-0 rounded-full transition-[width,background-color] duration-500 ease-out", cap.utilisation > 1 ? "bg-danger" : cap.utilisation < 0.35 ? "bg-flag" : "bg-circular")}
                style={{ width: `${(utilPct / 1.5) * 100}%` }}
              />
              <div className="absolute inset-y-0 w-px bg-ink" style={{ left: `${(1 / 1.5) * 100}%` }} title="100% of usable capacity" />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-muted">
              <span>Fill at pickup {pct(cap.utilisation)} of usable capacity ({pct(service.fill_factor.value)} fill)</span>
              {cap.citations.some((c) => c.is_sample) && <SampleBadge />}
            </div>
            {cap.warnings.length > 0 && (
              <ul className="mt-2.5 space-y-1">
                {cap.warnings.map((w, i) => (
                  <li key={i} className="text-xs text-danger">
                    {w}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <Label>Transport distance to each facility (one way)</Label>
          <div className="divide-y divide-line">
            {openRoutes.map((r) => {
              const t = treatments.find((x) => x.material === stream.material && x.route === r.id)!;
              return (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                  <div className="text-sm">
                    <span className="font-medium">{r.name}</span> <span className="text-ink-2">· {t.treatment}</span>
                    <div className="text-xs text-muted">{t.facility}</div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={config.distanceKm[r.id as RouteId] ?? t.default_distance_km}
                      onChange={(e) =>
                        setConfig({ ...config, distanceKm: { ...config.distanceKm, [r.id]: Math.max(0, Number(e.target.value) || 0) } })
                      }
                      className="w-20 rounded-md border border-line-2 bg-surface px-2 py-1.5 text-right font-mono tabular"
                    />
                    km
                  </label>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            ← Back to classification
          </Button>
          <div className="flex items-center gap-3">
            {!containerOk && <span className="text-xs text-danger">Pick a container offered for this stream.</span>}
            <Button onClick={onNext} disabled={!containerOk || !customer.company || !customer.site}>
              Compare routes →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
