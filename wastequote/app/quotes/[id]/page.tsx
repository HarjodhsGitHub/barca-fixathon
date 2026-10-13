import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { company, containerById, ewcByCode, frequencyById, materialById } from "@/lib/data";
import { date, eur, eur2, signedKg, tonnes } from "@/lib/format";
import { getQuote } from "@/lib/store";
import type { QuoteRecord } from "@/lib/quote";
import { CONFIDENCE_THRESHOLD } from "@/lib/vision/schema";
import { ConfidenceMeter, SampleBadge } from "@/components/ui";
import { IconDoc, Plate, RouteSwatch, SourcedMark, cn, routeColor } from "@/components/pricebook/marks";

export const dynamic = "force-dynamic";

const signedEur = (n: number) => (Math.round(n) === 0 ? "±€0" : `${n > 0 ? "+" : "−"}${eur(Math.abs(n))}`);

/** The UI is white-label: the CPQ engine is never named. */
const whiteLabel = (t: string | null) => (t ?? "").replace(/Sailsrep(\s+CPQ)?(\s+Configurator)?(\s+API)?/gi, "the CPQ engine");

/** Neutral ramp for the price composition bar, so it never reads as a route colour. */
const LINE_TONES = ["#15181b", "#5d646b", "#a0a6ab", "#c9ccce", "#e1e3e4"];

function visionLine(v: QuoteRecord["vision"]) {
  const secs = `${(v.ms / 1000).toFixed(1)} s`;
  switch (v.mode) {
    case "sailsrep":
      return `Classified by Selinsight AI in ${secs}.`;
    case "claude":
      return `Classified by AI vision${v.model ? ` (${v.model})` : ""} in ${secs}.`;
    case "stub":
      return "Vision stub: a recorded demo classification, not live inference.";
    default:
      return "Live vision failed, so a recorded demo classification was used.";
  }
}

function Fact({ k, children, className }: { k: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[12px] text-muted">{k}</dt>
      <dd className="mt-1 text-[14px] leading-snug">{children}</dd>
    </div>
  );
}

function SectionHead({ id, title, children }: { id: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 id={id} className="text-[21px] font-semibold tracking-[-0.02em]">
        {title}
      </h2>
      {children}
    </div>
  );
}

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = await getQuote(id);
  if (!q) notFound();
  const ev = q.evaluation;
  const chosen = ev.routes.find((r) => r.route === q.chosenRoute)!;
  const material = materialById(ev.stream.material)!;
  const container = containerById(ev.config.containerId)!;
  const freq = frequencyById(ev.config.frequencyId)!;
  const ewc = ewcByCode(ev.stream.ewc);
  const price = chosen.price!;
  const co2 = chosen.co2!;

  const positive = price.lines.filter((l) => l.amount > 0);
  const gross = positive.reduce((s, l) => s + l.amount, 0) || 1;
  const tone = (key: string) => LINE_TONES[positive.findIndex((l) => l.key + l.label === key) % LINE_TONES.length];
  const maxRoutePrice = Math.max(...ev.routes.map((r) => r.price?.totalPerMonth ?? 0), 1);

  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-24 pt-6 sm:px-6">
      <Link href="/" className="press group inline-flex items-center gap-1 rounded-md py-1 pr-2 text-[14px] text-ink-2 hover:text-ink">
        <svg
          viewBox="0 0 16 16"
          className="h-4 w-4 transition-transform duration-300 ease-out-quart group-hover:-translate-x-0.5"
          aria-hidden
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M10 3.5L5.5 8l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All quotes
      </Link>

      {/* Header: what, for whom, and the documents. */}
      <header className="mt-5 flex flex-wrap items-end justify-between gap-x-10 gap-y-7 border-b border-line pb-9">
        <div className="stagger min-w-0 [--stagger-step:70ms]">
          <p className="inline-flex items-center gap-2 rounded-full bg-circular-soft py-1 pl-1.5 pr-3 text-[12px] font-semibold text-circular">
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
              <circle cx="8" cy="8" r="7" fill="currentColor" />
              <path d="M4.9 8.2l2 2 4.2-4.4" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Accepted quote
          </p>
          <h1 className="mt-3 font-mono text-[34px] font-medium leading-none tracking-[-0.04em] sm:text-[52px]">{q.number}</h1>
          <p className="mt-4 text-[18px] font-semibold tracking-[-0.01em]">{q.customer.company}</p>
          <p className="mt-0.5 text-[14px] text-ink-2">
            {q.customer.site}
            {q.customer.contact ? `, ${q.customer.contact.toLowerCase()}` : ""}
          </p>
        </div>
        <div className="animate-rise anim-delay-200 flex flex-col gap-5 sm:items-end">
          <div className="grid gap-2.5 sm:flex sm:flex-wrap">
            <a
              href={`/api/quotes/${q.id}/quote.pdf`}
              target="_blank"
              className="press lift inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-[14px] font-semibold text-white shadow-card hover:bg-ink/90"
            >
              <IconDoc />
              Quote PDF
            </a>
            <a
              href={`/api/quotes/${q.id}/wtn.pdf`}
              target="_blank"
              className="press lift inline-flex items-center justify-center gap-2 rounded-lg border border-line-2 bg-surface px-5 py-3 text-[14px] font-semibold shadow-card hover:border-ink"
            >
              <IconDoc />
              Waste transfer note (draft)
            </a>
          </div>
          <dl className="flex gap-8 text-[13px] sm:text-right">
            <div>
              <dt className="text-[12px] text-muted">Issued</dt>
              <dd className="mt-0.5 font-mono tabular">{date(q.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-muted">Valid until</dt>
              <dd className="mt-0.5 font-mono tabular">{date(q.validUntil)}</dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-12">
          {/* The accepted route, with how its price is built. */}
          <section
            aria-labelledby="accepted"
            className="animate-rise anim-delay-150 overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
          >
            <div className="animate-grow-x anim-delay-400 h-2 origin-left" style={{ background: routeColor(chosen.route) }} />
            <div className="grid gap-7 p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-10 sm:p-8">
              <div className="min-w-0 sm:col-start-1 sm:row-start-1">
                <p
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full py-1 pl-2 pr-3 text-[12px] font-semibold",
                    chosen.circular ? "bg-circular-soft text-circular" : "bg-sunken text-ink-2",
                  )}
                >
                  <RouteSwatch route={chosen.route} />
                  {chosen.circular ? "Circular route accepted" : "Route accepted"}
                </p>
                <h2 id="accepted" className="mt-4 text-[26px] font-semibold leading-[1.12] tracking-[-0.025em] sm:text-[30px]">
                  {chosen.routeName}: {chosen.treatmentName}
                </h2>
              </div>
              <div className="flex flex-col border-y border-line py-5 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:items-end sm:border-0 sm:py-0 sm:text-right">
                <div className="text-[13px] text-muted">Per month, excl. VAT</div>
                <div className="animate-num-in anim-delay-450 mt-2 text-[52px] font-semibold leading-none tracking-[-0.035em] tabular sm:text-[60px]">
                  {eur(price.totalPerMonth)}
                </div>
                <div className="mt-3 text-[14px] text-ink-2">
                  <span className="font-mono tabular">{eur2(price.perTonne)}</span> per tonne
                </div>
                <div
                  className={cn(
                    "animate-pop anim-delay-700 mt-4 inline-flex items-center gap-1.5 self-start rounded-md px-2.5 py-1.5 text-[13px] sm:self-end",
                    co2.totalKgPerT < 0 ? "bg-circular-soft text-circular" : "bg-sunken text-ink-2",
                  )}
                >
                  <span className="font-mono font-semibold tabular">{signedKg(co2.totalKgPerT)}</span> kg CO₂e per tonne
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-5 sm:col-start-1 sm:row-start-2 sm:grid-cols-3">
                <Fact k="Facility">{chosen.facilityName}</Fact>
                <Fact k="Operation">
                  <Plate>{chosen.rdCode}</Plate>
                </Fact>
                <Fact k="Containers">
                  {ev.config.containerCount} × {container.name}
                </Fact>
                <Fact k="Pickups">{freq.name}</Fact>
                <Fact k="Quantity">
                  <span className="font-mono tabular">≈ {tonnes(ev.capacity.tonnesPerMonth)}</span> t/month
                </Fact>
              </dl>
            </div>

            <div className="border-t border-line bg-tablehead/50 px-6 py-6 sm:px-8">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-[15px] font-semibold">How the price is built</h3>
                <span className="text-[12px] text-muted">Each line cites the price book</span>
              </div>
              <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-sunken" aria-hidden>
                <div className="animate-grow-x anim-delay-600 flex h-full w-full origin-left">
                  {positive.map((l) => (
                    <div
                      key={l.key + l.label}
                      className="h-full border-r border-surface last:border-r-0"
                      style={{ width: `${(l.amount / gross) * 100}%`, background: tone(l.key + l.label) }}
                      title={`${l.label}: ${eur(l.amount)}`}
                    />
                  ))}
                </div>
              </div>
              <ul className="mt-4 divide-y divide-line">
                {price.lines.map((l) => {
                  const sample = l.citations.some((c) => c.is_sample);
                  return (
                    <li key={l.key + l.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 py-3">
                      <div className="min-w-0">
                        <div className="flex items-start gap-2 text-[14px] font-medium">
                          <span
                            aria-hidden
                            className="mt-[5px] block h-2.5 w-2.5 shrink-0 rounded-[2px]"
                            style={{ background: l.amount > 0 ? tone(l.key + l.label) : "var(--color-circular)" }}
                          />
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            {l.label}
                            {sample ? <SampleBadge /> : <SourcedMark />}
                          </span>
                        </div>
                        <div className="mt-1 break-words pl-[18px] font-mono text-[12px] text-muted">{l.formula}</div>
                      </div>
                      <div className={cn("font-mono text-[15px] font-medium tabular", l.amount < 0 && "text-circular")}>{eur(l.amount)}</div>
                    </li>
                  );
                })}
                <li className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 pt-4">
                  <span className="text-[15px] font-semibold">Total per month</span>
                  <span className="font-mono text-[18px] font-semibold tabular">{eur(price.totalPerMonth)}</span>
                </li>
              </ul>
            </div>

            {q.usesSampleData && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[#ecd2a6] bg-flag-soft px-6 py-3.5 text-[13px] text-flag sm:px-8">
                <SampleBadge />
                <span>
                  Built partly on sample prices or factors, so this quote is indicative.{" "}
                  <Link href="/pricebook" className="font-semibold underline underline-offset-2">
                    See the price book
                  </Link>
                </span>
              </div>
            )}
          </section>

          {/* Every route, as the customer could have had it. */}
          <section aria-labelledby="routes" className="animate-rise anim-delay-300">
            <SectionHead id="routes" title="All four routes">
              <p className="text-[13px] text-muted">EU waste hierarchy order. Prices per month, excl. VAT.</p>
            </SectionHead>
            {/* Phones: one row per route. */}
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface shadow-card sm:hidden">
              {ev.routes.map((r, i) => {
                const isChosen = r.route === chosen.route;
                const deny = r.rules.find((h) => h.effect === "deny");
                return (
                  <li key={r.route} className={cn("px-4 py-4", isChosen && "bg-circular-soft/50")}>
                    <div className="flex items-center justify-between gap-3">
                      <span className={cn("flex items-center gap-2 font-semibold", !r.eligible && "font-medium text-muted")}>
                        <span className="font-mono text-[12px] font-normal text-muted">{r.hierarchyRank}</span>
                        <RouteSwatch route={r.route} className={!r.eligible ? "opacity-40" : undefined} />
                        {r.routeName}
                        {r.eligible && <Plate className="text-[11px] leading-[18px]">{r.rdCode}</Plate>}
                      </span>
                      <span className={cn("text-[13px]", isChosen ? "font-semibold text-circular" : r.eligible ? "text-ink-2" : "text-muted")}>
                        {isChosen ? "Accepted" : r.eligible ? "Allowed" : "Not allowed"}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] leading-snug text-muted">
                      {r.eligible ? r.treatmentName : deny ? `${deny.ruleId} ${deny.text}` : null}
                    </p>
                    {r.price && (
                      <div className="mt-3 flex items-center gap-3">
                        <span className="block h-2 flex-1 overflow-hidden rounded-full bg-sunken" aria-hidden>
                          <span
                            className="animate-grow-x block h-full origin-left rounded-full"
                            style={{
                              width: `${(r.price.totalPerMonth / maxRoutePrice) * 100}%`,
                              background: routeColor(r.route),
                              opacity: isChosen ? 1 : 0.55,
                              animationDelay: `${500 + i * 90}ms`,
                            }}
                          />
                        </span>
                        <span className={cn("font-mono text-[15px] tabular", isChosen && "font-semibold")}>{eur(r.price.totalPerMonth)}</span>
                      </div>
                    )}
                    {r.price && r.co2 && (
                      <div className="mt-1.5 flex justify-between text-[12px] text-ink-2">
                        <span className="font-mono tabular">{isChosen ? "Accepted price" : `${signedEur(r.price.totalPerMonth - price.totalPerMonth)} vs accepted`}</span>
                        <span className={cn("font-mono tabular", r.co2.totalKgPerT < 0 && "text-circular")}>{signedKg(r.co2.totalKgPerT)} kg CO₂e/t</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="hidden overflow-x-auto rounded-xl border border-line bg-surface shadow-card sm:block">
              <table className="w-full min-w-[680px] text-[14px]">
                <thead className="border-b border-line bg-tablehead text-left text-[12px] text-muted">
                  <tr>
                    <th className="w-10 py-3 pl-5 font-medium">#</th>
                    <th className="px-3 py-3 font-medium">Route</th>
                    <th className="whitespace-nowrap px-3 py-3 font-medium">Status</th>
                    <th className="whitespace-nowrap px-3 py-3 font-medium">Per month</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right font-medium">vs accepted</th>
                    <th className="whitespace-nowrap py-3 pl-3 pr-5 text-right font-medium">CO₂e kg/t</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {ev.routes.map((r, i) => {
                    const isChosen = r.route === chosen.route;
                    const deny = r.rules.find((h) => h.effect === "deny");
                    return (
                      <tr key={r.route} className={cn("align-top transition-colors duration-300", isChosen ? "bg-circular-soft/50" : "hover:bg-paper/50")}>
                        <td className="py-4 pl-5 font-mono text-[13px] text-muted tabular">{r.hierarchyRank}</td>
                        <td className="px-3 py-4">
                          <div className={cn("flex items-center gap-2 font-semibold", !r.eligible && "font-medium text-muted")}>
                            <RouteSwatch route={r.route} className={!r.eligible ? "opacity-40" : undefined} />
                            {r.routeName}
                            {r.eligible && <Plate className="text-[11px] leading-[18px]">{r.rdCode}</Plate>}
                          </div>
                          <div className="mt-1 max-w-[46ch] pl-[18px] text-[12px] leading-snug text-muted">
                            {r.eligible ? (
                              r.treatmentName
                            ) : deny ? (
                              <>
                                <span className="font-mono">{deny.ruleId}</span> {deny.text}
                              </>
                            ) : null}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          {isChosen ? (
                            <span className="font-semibold text-circular">Accepted</span>
                          ) : r.eligible ? (
                            <span className="text-ink-2">Allowed</span>
                          ) : (
                            <span className="text-muted">Not allowed</span>
                          )}
                        </td>
                        <td className="px-3 py-4">
                          {r.price ? (
                            <div className="flex items-center gap-3">
                              <span className="block h-2 w-24 overflow-hidden rounded-full bg-sunken" aria-hidden>
                                <span
                                  className="animate-grow-x block h-full origin-left rounded-full"
                                  style={{
                                    width: `${(r.price.totalPerMonth / maxRoutePrice) * 100}%`,
                                    background: routeColor(r.route),
                                    opacity: isChosen ? 1 : 0.55,
                                    animationDelay: `${500 + i * 90}ms`,
                                  }}
                                />
                              </span>
                              <span className={cn("font-mono tabular", isChosen && "font-semibold")}>{eur(r.price.totalPerMonth)}</span>
                            </div>
                          ) : (
                            <span className="text-muted">–</span>
                          )}
                        </td>
                        <td className="px-3 py-4 text-right font-mono tabular text-ink-2">
                          {r.price && !isChosen ? signedEur(r.price.totalPerMonth - price.totalPerMonth) : "–"}
                        </td>
                        <td
                          className={cn(
                            "py-4 pl-3 pr-5 text-right font-mono tabular",
                            r.co2 && r.co2.totalKgPerT < 0 ? "text-circular" : "text-ink-2",
                            isChosen && "font-semibold",
                          )}
                        >
                          {r.co2 ? signedKg(r.co2.totalKgPerT) : "–"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* What the AI suggested, and what the salesperson signed off. */}
          <section aria-labelledby="audit" className="animate-rise anim-delay-400">
            <SectionHead id="audit" title="AI classification vs final quote" />
            <p className="-mt-2 mb-4 max-w-[75ch] text-[14px] text-ink-2">
              {visionLine(q.vision)} Fields under {Math.round(CONFIDENCE_THRESHOLD * 100)}% confidence had to be confirmed by the salesperson.
            </p>
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface shadow-card sm:hidden">
              {q.audit.map((a) => (
                <li key={a.field} className="px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] text-ink-2">{a.field}</span>
                    <ConfidenceMeter value={a.aiConfidence} threshold={CONFIDENCE_THRESHOLD} />
                  </div>
                  <div className="mt-1 text-[14px]">
                    <span className="font-semibold">{a.final}</span>
                    {a.changed ? (
                      <span className="ml-2 rounded-[3px] bg-ink px-1.5 py-0.5 text-[11px] font-medium text-white">Changed from {a.ai}</span>
                    ) : a.confirmed ? (
                      <span className="ml-2 text-[12px] text-ink-2">Confirmed</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto rounded-xl border border-line bg-surface shadow-card sm:block">
              <table className="w-full min-w-[580px] text-[14px]">
                <thead className="border-b border-line bg-tablehead text-left text-[12px] text-muted">
                  <tr>
                    <th className="py-3 pl-5 pr-3 font-medium">Field</th>
                    <th className="px-3 py-3 font-medium">AI suggested</th>
                    <th className="px-3 py-3 font-medium">Confidence</th>
                    <th className="py-3 pl-3 pr-5 font-medium">On the quote</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {q.audit.map((a) => (
                    <tr key={a.field}>
                      <td className="py-3.5 pl-5 pr-3 text-ink-2">{a.field}</td>
                      <td className="px-3 py-3.5">{a.ai}</td>
                      <td className="px-3 py-3.5">
                        <ConfidenceMeter value={a.aiConfidence} threshold={CONFIDENCE_THRESHOLD} />
                      </td>
                      <td className="py-3.5 pl-3 pr-5">
                        <span className="font-semibold">{a.final}</span>
                        {a.changed ? (
                          <span className="ml-2 rounded-[3px] bg-ink px-1.5 py-0.5 text-[11px] font-medium text-white">Changed</span>
                        ) : a.confirmed ? (
                          <span className="ml-2 text-[12px] text-ink-2">Confirmed</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="stagger space-y-4 [--stagger-start:250ms] [--stagger-step:90ms] lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-xl border border-line bg-ink shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/quotes/${q.id}/photo`}
              alt={`Photo of the waste stream: ${material.name.toLowerCase()}`}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <dl className="space-y-4 rounded-xl border border-line bg-surface p-5 shadow-card">
            <Fact k="Stream">
              <span className="font-semibold">{material.name}</span>
            </Fact>
            <Fact k="EWC code">
              <Plate>{ev.stream.ewc}</Plate>
              {ewc && <span className="mt-1.5 block text-[12px] leading-snug text-ink-2">{ewc.description}</span>}
            </Fact>
            <div className="grid grid-cols-2 gap-4">
              <Fact k="Contamination">
                <span className="capitalize">{ev.stream.contamination}</span>
              </Fact>
              <Fact k="Volume">
                <span className="font-mono tabular">{ev.stream.volumePerWeekM3}</span> m³/week
              </Fact>
            </div>
          </dl>

          <div
            className={cn(
              "rounded-xl border p-5 shadow-card",
              q.sailsrep.validated ? "border-circular/30 bg-surface" : "border-flag/40 bg-flag-soft",
            )}
          >
            <p className={cn("flex items-center gap-2 text-[14px] font-semibold", q.sailsrep.validated ? "text-circular" : "text-flag")}>
              {q.sailsrep.validated ? (
                <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
                  <circle cx="8" cy="8" r="7.25" fill="currentColor" />
                  <path d="M4.75 8.25l2.1 2.1 4.4-4.6" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
                  <path d="M8 1.5l7 12.5H1z" fill="currentColor" />
                  <path d="M8 6v3.5M8 11.6v.1" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              )}
              {q.sailsrep.validated ? "Validated by the CPQ engine" : "Not validated by the CPQ engine"}
            </p>
            {q.sailsrep.validated ? (
              <dl className="mt-4 space-y-3">
                <Fact k="Configuration">
                  <span className="break-all font-mono text-[12px]">{q.sailsrep.configurationId}</span>
                </Fact>
                <Fact k="Tenant">
                  <span className="break-all font-mono text-[12px]">{q.sailsrep.tenant}</span>
                </Fact>
                {q.sailsrep.catalogVersion && (
                  <Fact k="Catalog version">
                    <span className="font-mono text-[12px]">{q.sailsrep.catalogVersion}</span>
                  </Fact>
                )}
              </dl>
            ) : (
              <p className="mt-2 text-[13px] leading-snug text-ink-2">{whiteLabel(q.sailsrep.note)}</p>
            )}
          </div>

          <p className="px-1 text-[12px] leading-snug text-muted">
            Seller: {company.seller.name}. {company.quote_terms.vat_note}
          </p>
        </aside>
      </div>
    </div>
  );
}
