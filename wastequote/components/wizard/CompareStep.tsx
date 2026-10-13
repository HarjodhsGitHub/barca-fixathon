"use client";
import { evaluate } from "@/lib/engine";
import { CONTAMINATION_LEVELS, type Contamination, type Evaluation, type RouteId, type RouteResult } from "@/lib/types";
import { eur, eur2, int, signedKg } from "@/lib/format";
import { Markdown } from "../Markdown";
import { AnimatedNumber } from "./AnimatedNumber";
import { Button, Citations, Pill, ROUTE_COLOR, SampleBadge, SectionTitle, cx } from "../ui";
import type { Spec } from "./shared";
import { routeStatus, type Availability } from "./shared";

const TAG_LABEL = { circular_choice: "Circular choice", lowest_cost: "Lowest cost", lowest_co2: "Lowest CO₂e" } as const;

/** The one-line case for the circular route, against the best non-circular alternative. */
/**
 * When no circular route is open, ask the same rules what would open one if
 * the site separated better (one contamination level lower), and price it.
 */
function UnlockStrip({ ev, onWhatIf }: { ev: Evaluation; onWhatIf?: (l: Contamination) => void }) {
  const current = ev.routes.filter((r) => r.eligible && r.price).sort((a, b) => a.price!.totalPerMonth - b.price!.totalPerMonth)[0];
  const order = CONTAMINATION_LEVELS.indexOf(ev.stream.contamination);
  const unlock = CONTAMINATION_LEVELS.slice(0, order)
    .reverse()
    .map((level) => {
      const what = evaluate({ ...ev.stream, contamination: level }, ev.config);
      const circ = what.routes.find((r) => r.route === what.recommendedRoute);
      return circ?.price && circ.co2 ? { level, circ } : null;
    })
    .find((x) => x);
  if (!unlock || !current?.price || !current.co2) {
    return (
      <div className="rounded-2xl border border-line bg-surface px-5 py-4 text-sm text-ink-2">
        No circular route is open for this stream. Separating it at source is the way to open one.
      </div>
    );
  }
  const dEur = unlock.circ.price!.totalPerMonth - current.price.totalPerMonth;
  const dCo2 = ((current.co2.totalKgPerT - unlock.circ.co2!.totalKgPerT) * ev.capacity.tonnesPerMonth * 12) / 1000;
  return (
    <div className="wq-fade-in flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-circular/30 bg-gradient-to-r from-circular-soft to-surface px-5 py-4">
      <div className="max-w-2xl text-sm leading-relaxed">
        <div className="font-semibold text-circular">No circular route is open at {ev.stream.contamination} contamination.</div>
        If the site keeps general waste out of this container ({unlock.level} contamination),{" "}
        <span className="font-semibold">{unlock.circ.routeName.toLowerCase()}</span> opens:{" "}
        <span className="font-semibold">
          {dEur <= 0 ? `${eur(-dEur)} a month cheaper` : `${eur(dEur)} a month more`}
        </span>{" "}
        than {current.routeName.toLowerCase()}, and {dCo2 >= 0 ? "about" : "adds"}{" "}
        <span className="font-semibold">{Math.abs(dCo2) < 10 ? Math.abs(dCo2).toFixed(1) : int(Math.abs(dCo2))} t CO₂e a year</span>{" "}
        {dCo2 >= 0 ? "less" : ""}.
      </div>
      {onWhatIf && (
        <Button variant="circular" className="wq-press shrink-0" onClick={() => onWhatIf(unlock.level)}>
          Quote it at {unlock.level} contamination
        </Button>
      )}
    </div>
  );
}

export function DecisionStrip({
  ev,
  open,
  onWhatIf,
}: {
  ev: Evaluation;
  open: (r: RouteResult) => boolean;
  onWhatIf?: (l: Contamination) => void;
}) {
  const eligible = ev.routes.filter((r) => open(r) && r.price && r.co2);
  const circ = eligible.find((r) => r.route === ev.recommendedRoute);
  const alt = eligible.filter((r) => !r.circular).sort((a, b) => a.price!.totalPerMonth - b.price!.totalPerMonth)[0];
  if (!circ) return <UnlockStrip ev={ev} onWhatIf={onWhatIf} />;
  if (!alt) {
    return (
      <div className="rounded-xl border border-circular/30 bg-circular-soft px-5 py-4 text-sm">
        <span className="font-semibold text-circular">{circ.routeName}</span> is the only kind of route open: non-circular routes are closed for this stream by the rules.
      </div>
    );
  }
  const dEur = circ.price!.totalPerMonth - alt.price!.totalPerMonth;
  const t = ev.capacity.tonnesPerMonth;
  const dCo2TonnesYear = ((alt.co2!.totalKgPerT - circ.co2!.totalKgPerT) * t * 12) / 1000;
  return (
    <div className="wq-fade-in rounded-2xl border border-circular/30 bg-gradient-to-r from-circular-soft to-surface px-5 py-4">
      <div className="text-sm leading-relaxed">
        <span className="font-semibold text-circular">{circ.routeName}</span> instead of {alt.routeName.toLowerCase()}{" "}
        {dEur <= 0 ? (
          <>
            <span className="font-semibold">
              saves <AnimatedNumber value={-dEur} format={eur} /> a month
            </span>
          </>
        ) : (
          <>
            costs{" "}
            <span className="font-semibold">
              <AnimatedNumber value={dEur} format={eur} /> more a month
            </span>
          </>
        )}{" "}
        and {dCo2TonnesYear >= 0 ? "avoids" : "adds"}{" "}
        <span className="font-semibold">
          <AnimatedNumber
            value={Math.abs(dCo2TonnesYear)}
            format={(n) => (n < 10 ? n.toFixed(1) : int(n))}
          />{" "}
          t CO₂e a year
        </span>
        {dEur > 0 && dCo2TonnesYear > 0 && (
          <span className="text-ink-2"> ({eur2((dEur * 12) / dCo2TonnesYear)} per tonne CO₂e avoided)</span>
        )}
        .
      </div>
    </div>
  );
}

function RouteCard({
  r,
  spec,
  open,
  sailsrepReason,
  mismatch,
  selected,
  onSelect,
  tonnesPerMonth,
}: {
  r: RouteResult;
  spec?: Spec;
  open: boolean;
  sailsrepReason: string | null;
  mismatch: boolean;
  selected: boolean;
  onSelect: () => void;
  tonnesPerMonth: number;
}) {
  const recommended = r.tags.includes("circular_choice");
  const deny = r.rules.filter((h) => h.effect === "deny");
  const notes = r.rules.filter((h) => h.effect === "surcharge" || h.effect === "warn");
  return (
    <div
      className={cx(
        "relative flex w-full flex-col overflow-hidden rounded-xl border bg-surface",
        open && "wq-lift",
        !open && "bg-sunken/50",
        selected ? "border-ink shadow-[0_0_0_2px_var(--color-ink)]" : recommended && open ? "border-circular/60" : "border-line",
      )}
    >
      <div className="h-1.5" style={{ background: open ? ROUTE_COLOR[r.route] : "var(--color-line-2)" }} />
      {recommended && open && (
        <div className="bg-circular px-4 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">Recommended · circular</div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              {r.hierarchyRank}. {r.circular ? "circular" : "linear"}
            </div>
            <h3 className={cx("text-lg font-semibold tracking-tight", !open && "text-muted")}>{r.routeName}</h3>
          </div>
          <span className={cx("rounded border px-1.5 py-0.5 font-mono text-[11px]", open ? "border-line-2 text-ink-2" : "border-line text-muted")}>
            {r.rdCode}
          </span>
        </div>
        <div className={cx("mt-1 text-sm", open ? "text-ink-2" : "text-muted")}>{r.treatmentName}</div>
        {open && <div className="text-xs text-muted">{r.facilityName}</div>}

        {open && r.price && r.co2 ? (
          <>
            <div className="mt-4 flex items-baseline gap-1.5">
              <AnimatedNumber value={r.price.totalPerMonth} format={eur} className="text-3xl font-semibold tracking-tight" />
              <span className="text-sm text-muted">/month</span>
            </div>
            <div className="font-mono text-xs tabular text-ink-2">
              {eur2(r.price.perTonne)}/t · {tonnesPerMonth.toFixed(1)} t/month
            </div>

            <div className="mt-3 rounded-lg bg-sunken/70 px-3 py-2.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-ink-2">CO₂e per tonne</span>
                <span className={cx("font-mono text-base font-semibold tabular", r.co2.totalKgPerT < 0 ? "text-circular" : "text-ink")}>
                  {signedKg(r.co2.totalKgPerT)} kg
                </span>
              </div>
              <div className="mt-0.5 flex items-baseline justify-between text-[11px] text-muted">
                <span>per month</span>
                <span className="font-mono tabular">{signedKg(r.co2.totalKgPerMonth)} kg</span>
              </div>
              <details className="mt-1.5 text-[11px]">
                <summary className="text-muted hover:text-ink">How this is calculated</summary>
                <p className="mt-1 leading-snug text-ink-2">
                  Net lifecycle factor {signedKg(r.co2.netKgPerT)} kg/t (negative means avoided virgin material or energy) + transport{" "}
                  {signedKg(r.co2.transportKgPerT)} kg/t. Reporting basis without credits: {signedKg(r.co2.directKgPerT)} kg/t.
                </p>
                <Citations items={r.co2.citations} />
              </details>
            </div>

            <ul className="mt-3 space-y-1">
              {r.price.lines.map((l) => (
                <li key={l.key + l.label}>
                  <details className="group">
                    <summary className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="text-ink-2 underline decoration-line-2 decoration-dotted underline-offset-4 group-open:text-ink">{l.label}</span>
                      <span className={cx("font-mono tabular", l.amount < 0 && "text-circular")}>{eur(l.amount)}</span>
                    </summary>
                    <div className="mb-2 mt-1 rounded-md border border-line bg-paper px-2.5 py-2">
                      <div className="font-mono text-[11px] text-ink">{l.formula}</div>
                      <Citations items={l.citations} />
                    </div>
                  </details>
                </li>
              ))}
            </ul>

            {spec?.longDescription && (
              <details className="mt-3 text-[11px]">
                <summary className="text-muted hover:text-ink">Specs</summary>
                <Markdown text={spec.longDescription} dropHeading={r.routeName} className="mt-1 space-y-1 leading-snug text-ink-2" />
              </details>
            )}

            {notes.length > 0 && (
              <ul className="mt-3 space-y-1">
                {notes.map((n) => (
                  <li key={n.ruleId} className="text-[11px] leading-snug text-flag">
                    <span className="font-mono">{n.ruleId}</span> {n.text}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-auto flex items-center justify-between gap-2 pt-4">
              <div className="flex flex-wrap gap-1">
                {r.tags.map((t) => (
                  <Pill key={t} tone={t === "circular_choice" ? "good" : "neutral"}>
                    {TAG_LABEL[t]}
                  </Pill>
                ))}
                {r.usesSampleData && <SampleBadge />}
              </div>
            </div>
            <Button variant={selected ? "primary" : recommended ? "circular" : "secondary"} onClick={onSelect} className="wq-press mt-3 w-full">
              {selected ? "Selected" : `Choose ${r.routeName.toLowerCase()}`}
            </Button>
          </>
        ) : (
          <div className="mt-4 space-y-2">
            <Pill tone="neutral">Not allowed</Pill>
            {deny.map((d) => (
              <div key={d.ruleId} className="text-sm leading-snug text-ink-2">
                <span className="font-mono text-xs text-muted">{d.ruleId}</span> {d.text}
                <div className="mt-0.5 text-[11px] text-muted">
                  {d.source_url ? (
                    <a href={d.source_url} target="_blank" rel="noreferrer" className="underline decoration-line-2 underline-offset-2">
                      {d.source}
                    </a>
                  ) : (
                    d.source
                  )}
                  {!d.is_sample && <span className="ml-1 font-medium text-circular">· law / fact</span>}
                </div>
              </div>
            ))}
            {sailsrepReason && <div className="text-[11px] text-muted">Rules engine: {sailsrepReason}</div>}
          </div>
        )}
        {mismatch && (
          <div className="mt-3 rounded bg-danger-soft px-2 py-1.5 text-[11px] text-danger">
            The CPQ engine and the local rules disagree on this route. Re-export and re-upload the model.
          </div>
        )}
      </div>
    </div>
  );
}

export function CompareStep({
  ev,
  availability,
  chosen,
  setChosen,
  onBack,
  onAccept,
  accepting,
  error,
  onWhatIf,
}: {
  onWhatIf?: (l: Contamination) => void;
  ev: Evaluation;
  availability: Availability | null;
  chosen: RouteId | null;
  setChosen: (r: RouteId) => void;
  onBack: () => void;
  onAccept: () => void;
  accepting: boolean;
  error: string | null;
}) {
  const st = (r: RouteResult) => routeStatus(availability, ev.stream.material, ev.stream.contamination, r.route);
  const isOpen = (r: RouteResult) => st(r).open && r.eligible;
  const chosenRoute = ev.routes.find((r) => r.route === chosen && isOpen(r));
  return (
    <div>
      <SectionTitle
        step="Step 4"
        title="Every route, side by side"
        hint={
          <span>
            Routes ordered by the EU waste hierarchy · prices per month excl. VAT
            {availability?.source === "sailsrep" && <span className="block">Eligibility from the live CPQ rules engine</span>}
          </span>
        }
      />
      <DecisionStrip ev={ev} open={isOpen} onWhatIf={onWhatIf} />
      <div className="wq-stagger mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {ev.routes.map((r, i) => {
          const s = st(r);
          return (
            <div key={r.route} style={{ "--i": i } as React.CSSProperties} className="flex">
            <RouteCard
              r={r}
              spec={availability?.source === "sailsrep" ? availability.specs.routes[r.route] : undefined}
              open={isOpen(r)}
              sailsrepReason={s.sailsrep?.status === "blocked" ? s.sailsrep.reason : null}
              mismatch={s.mismatch}
              selected={chosen === r.route}
              onSelect={() => setChosen(r.route)}
              tonnesPerMonth={ev.capacity.tonnesPerMonth}
            />
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-line bg-paper/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={onBack}>
            ← Back to configuration
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            {error && <span className="max-w-md text-xs text-danger">{error}</span>}
            {chosenRoute?.price && (
              <span className="text-sm text-ink-2">
                {chosenRoute.routeName}: <span className="font-semibold text-ink">{eur(chosenRoute.price.totalPerMonth)}/month</span>
              </span>
            )}
            <Button variant="circular" onClick={onAccept} disabled={!chosenRoute || accepting} className="wq-press">
              {accepting ? "Generating quote…" : "Accept route & generate quote"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
