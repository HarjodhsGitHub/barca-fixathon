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
const tonnesFmt = (n: number) => (n < 10 ? n.toFixed(1) : int(n));

function BigNumber({ label, children, note, tone }: { label: string; children: React.ReactNode; note: string; tone: "good" | "ink" }) {
  return (
    <div>
      <div className="text-[12px] text-muted">{label}</div>
      <div className={cx("mt-1 text-[32px] font-semibold leading-none tracking-[-0.03em]", tone === "good" ? "text-circular" : "text-ink")}>
        {children}
      </div>
      <div className="mt-1 text-[13px] text-ink-2">{note}</div>
    </div>
  );
}

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
      <div className="rounded-2xl border border-line bg-surface px-5 py-4 text-sm text-ink-2 shadow-card">
        No circular route is open for this stream. Separating it at source is the way to open one.
      </div>
    );
  }
  const dEur = unlock.circ.price!.totalPerMonth - current.price.totalPerMonth;
  const dCo2 = ((current.co2.totalKgPerT - unlock.circ.co2!.totalKgPerT) * ev.capacity.tonnesPerMonth * 12) / 1000;
  return (
    <div className="wq-fade-in grid gap-5 rounded-2xl border border-circular/25 bg-surface p-5 shadow-card sm:p-6 lg:grid-cols-[minmax(0,1.4fr)_auto_auto_auto] lg:items-center lg:gap-10">
      <div className="text-sm leading-relaxed text-ink-2">
        <div className="text-[15px] font-semibold text-ink">No circular route is open at {ev.stream.contamination} contamination.</div>
        If the site keeps general waste out of this container ({unlock.level} contamination),{" "}
        <span className="font-semibold text-circular">{unlock.circ.routeName.toLowerCase()}</span> opens. Compared with{" "}
        {current.routeName.toLowerCase()} today:
      </div>
      <BigNumber label="Per month" note={dEur <= 0 ? "cheaper" : "more"} tone={dEur <= 0 ? "good" : "ink"}>
        <AnimatedNumber value={Math.abs(dEur)} format={eur} />
      </BigNumber>
      <BigNumber label="CO₂e a year" note={dCo2 >= 0 ? "avoided" : "added"} tone={dCo2 >= 0 ? "good" : "ink"}>
        <AnimatedNumber value={Math.abs(dCo2)} format={tonnesFmt} /> t
      </BigNumber>
      {onWhatIf && (
        <Button variant="circular" className="wq-press px-5 py-3 text-[15px] lg:justify-self-end" onClick={() => onWhatIf(unlock.level)}>
          Quote it at {unlock.level}
        </Button>
      )}
    </div>
  );
}

/** The verdict: what the circular route saves against the cheapest linear one, with the shortest path to yes. */
export function DecisionStrip({
  ev,
  open,
  onWhatIf,
  onAcceptRoute,
  accepting,
}: {
  ev: Evaluation;
  open: (r: RouteResult) => boolean;
  onWhatIf?: (l: Contamination) => void;
  onAcceptRoute: (r: RouteId) => void;
  accepting: boolean;
}) {
  const eligible = ev.routes.filter((r) => open(r) && r.price && r.co2);
  const circ = eligible.find((r) => r.route === ev.recommendedRoute);
  const alt = eligible.filter((r) => !r.circular).sort((a, b) => a.price!.totalPerMonth - b.price!.totalPerMonth)[0];
  if (!circ) return <UnlockStrip ev={ev} onWhatIf={onWhatIf} />;
  const accept = (
    <Button
      variant="circular"
      className="wq-press px-5 py-3 text-[15px] lg:justify-self-end"
      disabled={accepting}
      onClick={() => onAcceptRoute(circ.route)}
    >
      Accept {circ.routeName.toLowerCase()}
    </Button>
  );
  if (!alt) {
    return (
      <div className="wq-fade-in flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-circular/25 bg-surface p-5 shadow-card sm:p-6">
        <div className="max-w-2xl text-sm leading-relaxed text-ink-2">
          <div className="text-[15px] font-semibold text-ink">{circ.routeName} is the only kind of route open.</div>
          The rules close every non-circular route for this stream, so there is nothing linear to compare against.
        </div>
        {accept}
      </div>
    );
  }
  const dEur = circ.price!.totalPerMonth - alt.price!.totalPerMonth;
  const dCo2 = ((alt.co2!.totalKgPerT - circ.co2!.totalKgPerT) * ev.capacity.tonnesPerMonth * 12) / 1000;
  return (
    <div className="wq-fade-in grid gap-5 rounded-2xl border border-circular/25 bg-surface p-5 shadow-card sm:p-6 lg:grid-cols-[minmax(0,1.4fr)_auto_auto_auto] lg:items-center lg:gap-10">
      <div className="text-sm leading-relaxed text-ink-2">
        <div className="text-[15px] font-semibold text-ink">
          <span className="text-circular">{circ.routeName}</span> instead of {alt.routeName.toLowerCase()}
        </div>
        {dEur > 0 && dCo2 > 0
          ? `Costs more, and buys CO₂e cuts at ${eur2((dEur * 12) / dCo2)} per tonne.`
          : "Every number below opens to its formula and source."}
      </div>
      <BigNumber label="Per month" note={dEur <= 0 ? "saved" : "more"} tone={dEur <= 0 ? "good" : "ink"}>
        <AnimatedNumber value={Math.abs(dEur)} format={eur} from={0} delay={450} />
      </BigNumber>
      <BigNumber label="CO₂e a year" note={dCo2 >= 0 ? "avoided" : "added"} tone={dCo2 >= 0 ? "good" : "ink"}>
        <AnimatedNumber value={Math.abs(dCo2)} format={tonnesFmt} from={0} delay={450} /> t
      </BigNumber>
      {accept}
    </div>
  );
}

function RouteCard({
  r,
  spec,
  open,
  engineReason,
  mismatch,
  selected,
  onSelect,
  tonnesPerMonth,
  countFrom,
}: {
  r: RouteResult;
  spec?: Spec;
  open: boolean;
  engineReason: string | null;
  mismatch: boolean;
  selected: boolean;
  onSelect: () => void;
  tonnesPerMonth: number;
  /** Count the price up from here on mount (the recommended card only). */
  countFrom?: number;
}) {
  const recommended = r.tags.includes("circular_choice") && open;
  const deny = r.rules.filter((h) => h.effect === "deny").slice(0, 1);
  const notes = r.rules.filter((h) => h.effect === "surcharge" || h.effect === "warn");
  const surchargePct = r.price?.lines.find((l) => l.key === "gate_fee")?.label.match(/\+(\d+)%/)?.[1];

  if (!open) {
    return (
      <div className="relative flex w-full flex-col self-start overflow-hidden rounded-xl border border-line bg-sunken/40">
        <div className="hatch h-1.5" />
        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-muted">{r.routeName}</h3>
            <span className="text-[12px] text-muted">{r.circular ? "Circular" : "Linear"}</span>
          </div>
          <Pill tone="neutral">Not allowed</Pill>
          {deny.map((d) => (
            <div key={d.ruleId} className="mt-2 text-[13px] leading-snug text-ink-2">
              {d.text}
              <div className="mt-1 text-[11px] text-muted">
                <span className="font-mono">{d.ruleId}</span> ·{" "}
                {d.source_url ? (
                  <a href={d.source_url} target="_blank" rel="noreferrer" className="underline decoration-line-2 underline-offset-2">
                    {d.source}
                  </a>
                ) : (
                  d.source
                )}
                {!d.is_sample && <span className="ml-1 font-medium text-circular">Law or fact</span>}
              </div>
            </div>
          ))}
          {engineReason && <div className="mt-1.5 text-[11px] text-muted">Rules engine: {engineReason}</div>}
          {mismatch && (
            <div className="mt-3 rounded bg-danger-soft px-2 py-1.5 text-[11px] text-danger">
              The CPQ engine and the local rules disagree on this route. Re-export and re-upload the model.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cx(
        "wq-lift relative flex w-full flex-col overflow-hidden rounded-xl border bg-surface",
        recommended && "shadow-pop ring-1 ring-circular/35 xl:-translate-y-1.5",
        selected ? "border-transparent shadow-[0_0_0_2px_var(--color-circular)]" : recommended ? "border-circular/40" : "border-line",
      )}
    >
      <div className="h-1.5" style={{ background: ROUTE_COLOR[r.route] }} />
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: ROUTE_COLOR[r.route] }} />
              <h3 className="text-lg font-semibold tracking-tight">{r.routeName}</h3>
              <span className="text-[12px] text-muted">{r.circular ? "Circular" : "Linear"}</span>
            </div>
            <div className="mt-0.5 text-sm text-ink-2">{r.treatmentName}</div>
            <div className="text-xs text-muted">{r.facilityName}</div>
          </div>
          <span className="shrink-0 rounded border border-line-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-2">{r.rdCode}</span>
        </div>
        {recommended && (
          <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-circular px-2.5 py-1 text-[12px] font-semibold text-white">
            Recommended, circular
          </span>
        )}

        {r.price && r.co2 && (
          <>
            <div className="mt-4 flex items-baseline gap-1.5">
              <AnimatedNumber
                value={r.price.totalPerMonth}
                format={eur}
                from={countFrom}
                delay={450}
                className={cx("font-semibold tracking-[-0.03em]", recommended ? "text-[40px] leading-none" : "text-[28px] leading-none text-ink-2")}
              />
              <span className="text-sm text-muted">/month</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-mono text-xs tabular text-ink-2">
                {eur2(r.price.perTonne)}/t · {tonnesPerMonth.toFixed(1)} t/month
              </span>
              {surchargePct && (
                <span
                  title="Contamination surcharge on the treatment gate fee"
                  className="rounded bg-flag-soft px-1.5 py-0.5 text-[11px] font-medium text-flag"
                >
                  +{surchargePct}% contamination
                </span>
              )}
            </div>

            <div className="mt-3 animate-fade-in anim-delay-120 rounded-lg bg-sunken/70 px-3 py-2.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-ink-2">CO₂e per tonne</span>
                <span className={cx("font-mono text-base font-semibold tabular", r.co2.totalKgPerT < 0 ? "text-circular" : "text-ink")}>
                  <AnimatedNumber value={r.co2.totalKgPerT} format={(n) => signedKg(Math.round(n))} duration={380} /> kg
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

            <ul className="mt-4 animate-fade-in anim-delay-120 divide-y divide-line border-y border-line">
              {r.price.lines.map((l) => (
                <li key={l.key + l.label}>
                  <details className="group">
                    <summary className="grid grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-2 py-2 text-[13px]">
                      <svg viewBox="0 0 12 12" className="h-3 w-3 text-muted transition-transform duration-200 group-open:rotate-90" aria-hidden>
                        <path d="M4 2.5L7.5 6 4 9.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <span className="truncate text-ink-2 group-open:text-ink">{l.label.replace(/\s*\(.*\)$/, "")}</span>
                      <span className={cx("font-mono tabular", l.amount < 0 && "text-circular")}>{eur(l.amount)}</span>
                    </summary>
                    <div className="wq-fade-in mb-2 ml-5 rounded-md bg-paper px-2.5 py-2">
                      <div className="font-mono text-[11px] text-ink">{l.formula}</div>
                      <Citations items={l.citations} />
                    </div>
                  </details>
                </li>
              ))}
              <li className="grid grid-cols-[12px_minmax(0,1fr)_auto] gap-2 py-2 text-[13px] font-semibold">
                <span />
                <span>Total</span>
                <span className="font-mono tabular">{eur(r.price.totalPerMonth)}</span>
              </li>
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

            <div className="mt-auto flex flex-wrap gap-1 pt-4">
              {r.tags.map((t) => (
                <Pill key={t} tone={t === "circular_choice" ? "good" : "neutral"}>
                  {TAG_LABEL[t]}
                </Pill>
              ))}
              {r.usesSampleData && <SampleBadge />}
            </div>
            <Button
              variant={selected || recommended ? "circular" : "secondary"}
              onClick={onSelect}
              className={cx("wq-press mt-3 w-full", selected && !recommended && "bg-circular text-white")}
            >
              {selected ? (
                <>
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                    <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Selected
                </>
              ) : (
                `Choose ${r.routeName.toLowerCase()}`
              )}
            </Button>
          </>
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
  ev: Evaluation;
  availability: Availability | null;
  chosen: RouteId | null;
  setChosen: (r: RouteId) => void;
  onBack: () => void;
  /** Accept the chosen route, or the one given. */
  onAccept: (route?: RouteId) => void;
  accepting: boolean;
  error: string | null;
  onWhatIf?: (l: Contamination) => void;
}) {
  const st = (r: RouteResult) => routeStatus(availability, ev.stream.material, ev.stream.contamination, r.route);
  const isOpen = (r: RouteResult) => st(r).open && r.eligible;
  const chosenRoute = ev.routes.find((r) => r.route === chosen && isOpen(r));
  // The recommended price counts up from the cheapest linear alternative.
  const cheapestLinear = ev.routes
    .filter((r) => isOpen(r) && !r.circular && r.price)
    .sort((a, b) => a.price!.totalPerMonth - b.price!.totalPerMonth)[0]?.price?.totalPerMonth;
  const cols = ev.routes
    .map((r) => (!isOpen(r) ? "minmax(0,0.62fr)" : r.tags.includes("circular_choice") ? "minmax(0,1.3fr)" : "minmax(0,1fr)"))
    .join(" ");

  return (
    <div>
      <SectionTitle
        title="Every route, side by side"
        hint={
          <span>
            Ordered by the EU waste hierarchy · per month excl. VAT
            {availability?.source === "sailsrep" && <span className="block">Eligibility from the live CPQ rules engine</span>}
          </span>
        }
      />
      <DecisionStrip ev={ev} open={isOpen} onWhatIf={onWhatIf} onAcceptRoute={(r) => onAccept(r)} accepting={accepting} />
      <div className="wq-stagger mt-6 grid items-start gap-4 md:grid-cols-2 xl:[grid-template-columns:var(--cols)]" style={{ "--cols": cols } as React.CSSProperties}>
        {ev.routes.map((r, i) => {
          const s = st(r);
          const open = isOpen(r);
          const recommended = r.tags.includes("circular_choice") && open;
          return (
            <div
              key={r.route}
              style={{ "--i": i } as React.CSSProperties}
              className={cx("flex", !open && "order-last xl:order-none", recommended && "order-first xl:order-none")}
            >
              <RouteCard
                r={r}
                spec={availability?.source === "sailsrep" ? availability.specs.routes[r.route] : undefined}
                open={open}
                engineReason={s.sailsrep?.status === "blocked" ? s.sailsrep.reason : null}
                mismatch={s.mismatch}
                selected={chosen === r.route}
                onSelect={() => setChosen(r.route)}
                tonnesPerMonth={ev.capacity.tonnesPerMonth}
                countFrom={recommended && cheapestLinear !== undefined ? cheapestLinear : undefined}
              />
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-line bg-paper/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur sm:-mx-6 sm:px-6">
        {accepting && (
          <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
            <div className="wq-indeterminate h-full w-1/4 bg-circular" />
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="hidden sm:block">
            <Button variant="ghost" onClick={onBack}>
              ← Back to configuration
            </Button>
          </div>
          <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
            {error && <span className="max-w-md text-xs text-danger">{error}</span>}
            {chosenRoute?.price && (
              <span className="text-sm leading-tight text-ink-2">
                <span className="block text-[12px] text-muted sm:inline sm:text-sm sm:text-ink-2">{chosenRoute.routeName}</span>
                <span className="hidden sm:inline">: </span>
                <span className="font-semibold text-ink">
                  <AnimatedNumber value={chosenRoute.price.totalPerMonth} format={eur} />
                  /mo
                </span>
              </span>
            )}
            <Button variant="circular" onClick={() => onAccept()} disabled={!chosenRoute || accepting} className="wq-press">
              <span className="sm:hidden">Accept &amp; quote</span>
              <span className="hidden sm:inline">Accept route &amp; generate quote</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
