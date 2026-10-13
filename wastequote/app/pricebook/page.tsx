import type { Metadata } from "next";
import {
  company,
  containers,
  emissionFactors,
  ewcCatalogue,
  materialById,
  materials,
  pricing,
  routeById,
  routes,
  rules,
  service,
  tableMeta,
  taxes,
  transportIncludedKm,
  treatments,
  vehicles,
} from "@/lib/data";
import type { MaterialId, RouteId } from "@/lib/types";
import { SampleBadge } from "@/components/ui";
import { EligibilityMatrix, RuleList } from "@/components/pricebook/Eligibility";
import { ExtLink, Plate, RouteName, SourceText, SourcedMark, cn } from "@/components/pricebook/marks";
import { GroupRow, NUM, ProvCell, Section, TD, TH, TableShell, dittos, n, type Meta } from "@/components/pricebook/table";
import { Toc, type TocGroup } from "@/components/pricebook/Toc";

export const metadata: Metadata = {
  title: "Price book | Selinsight",
  description: "Every price, factor and rule behind a quote, with its source.",
};

// ------------------------------------------------------------------ helpers

type Prov = { is_sample: boolean };
const tally = (rows: Prov[], per = 1) => ({ total: rows.length * per, sample: rows.filter((r) => r.is_sample).length * per });

const mName = (id: MaterialId) => materialById(id)?.name ?? id;
const rName = (id: RouteId) => routeById(id)?.name ?? id;

function byMaterial<T extends { material: MaterialId }>(rows: T[]) {
  return materials.map((m) => ({ id: m.id, name: m.name, rows: rows.filter((r) => r.material === m.id) })).filter((g) => g.rows.length > 0);
}

const routeOrder = (a: { route: RouteId }, b: { route: RouteId }) =>
  (routeById(a.route)?.hierarchy_rank ?? 9) - (routeById(b.route)?.hierarchy_rank ?? 9);

/** Rows in hierarchy order, each with whether its source repeats the row above. */
function inRouteOrder<T extends { route: RouteId; source: string; source_url?: string | null; notes?: string | null; is_sample: boolean }>(rows: T[]) {
  const sorted = [...rows].sort(routeOrder);
  const d = dittos(sorted);
  return sorted.map((row, i) => ({ row, ditto: d[i] }));
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

function Definition({ children }: { children: React.ReactNode }) {
  return <span className="whitespace-nowrap text-[11px] font-medium text-ink-2">{children}</span>;
}

function ShareBar({ sourced, sample, labels, delay = 0 }: { sourced: number; sample: number; labels: [string, string]; delay?: number }) {
  const total = sourced + sample;
  return (
    <div>
      <div className="h-3 overflow-hidden rounded-full bg-sunken" aria-hidden>
        <div className="animate-grow-x flex h-full origin-left" style={{ animationDelay: `${delay}ms` }}>
          <div className="bg-circular" style={{ width: `${(sourced / total) * 100}%` }} />
          <div className="sample-stripe" style={{ width: `${(sample / total) * 100}%` }} />
        </div>
      </div>
      <div className="mt-2 flex justify-between gap-3 text-[13px]">
        <span className="text-circular">
          <span className="font-mono font-semibold tabular">{sourced}</span> {labels[0]}
        </span>
        <span className="text-right text-flag">
          <span className="font-mono font-semibold tabular">{sample}</span> {labels[1]}
        </span>
      </div>
    </div>
  );
}

function Point({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3.5">
      <span className="mt-[11px] block h-px w-3 shrink-0 bg-ink" aria-hidden />
      <span>{children}</span>
    </li>
  );
}

// ------------------------------------------------------------------ page

export default function PriceBookPage() {
  const meta = (k: keyof typeof tableMeta) => tableMeta[k] as Meta;
  const taxMeta = tableMeta.taxes as Meta & { reference_rates?: Record<string, unknown> };
  const treatMeta = tableMeta.treatments as Meta & { rd_code_source?: string; rd_code_source_url?: string };
  const emMeta = tableMeta.emission_factors as Meta & { methodology_url?: string };

  const contamination = [
    { key: "surcharge", label: "Gate fee surcharge", hint: "Share added to the gate fee", row: pricing.contamination_gate_fee_surcharge, fmt: (v: number) => `+${pct(v)}` },
    { key: "rebate", label: "Rebate paid", hint: "Share of the clean-grade rebate paid", row: pricing.contamination_rebate_factor, fmt: pct },
  ];

  const counts = {
    routes: tally(routes),
    eligibility: tally(rules),
    materials: tally(materials),
    ewc: tally(ewcCatalogue),
    treatments: tally(treatments),
    gateFees: tally(pricing.gate_fees),
    rebates: tally(pricing.rebates),
    contamination: tally(contamination.map((c) => c.row), 3),
    taxes: tally(taxes),
    containers: tally(containers, 5),
    transport: { total: vehicles.length * 3 + 1, sample: tally(vehicles, 3).sample + (transportIncludedKm.is_sample ? 1 : 0) },
    emissions: tally(emissionFactors, 2),
    service: tally([service.fill_factor]),
    company: { total: 3, sample: (company.seller.is_sample ? 1 : 0) + (company.demo_customer.is_sample ? 2 : 0) },
  };

  // Every number that feeds a price, a tonnage or a CO2e figure.
  const numeric = [
    counts.routes, counts.materials, counts.treatments, counts.gateFees, counts.rebates, counts.contamination,
    counts.taxes, counts.containers, counts.transport, counts.emissions, counts.service,
  ].reduce((a, c) => ({ total: a.total + c.total, sample: a.sample + c.sample }), { total: 0, sample: 0 });
  const lawRules = rules.filter((r) => !r.is_sample).length;

  const groups: TocGroup[] = [
    {
      label: "Rules",
      items: [
        { id: "routes", label: "Routes", ...counts.routes },
        { id: "eligibility", label: "Eligibility rules", ...counts.eligibility },
      ],
    },
    {
      label: "Streams",
      items: [
        { id: "materials", label: "Materials", ...counts.materials },
        { id: "ewc", label: "EWC codes", ...counts.ewc },
        { id: "treatments", label: "Treatments", ...counts.treatments },
      ],
    },
    {
      label: "Prices",
      items: [
        { id: "gate-fees", label: "Gate fees", ...counts.gateFees },
        { id: "rebates", label: "Rebates", ...counts.rebates },
        { id: "contamination", label: "Contamination", ...counts.contamination },
        { id: "taxes", label: "Taxes", ...counts.taxes },
        { id: "containers", label: "Containers", ...counts.containers },
        { id: "transport", label: "Transport", ...counts.transport },
      ],
    },
    { label: "Carbon", items: [{ id: "emissions", label: "Emission factors", ...counts.emissions }] },
    {
      label: "Service and company",
      items: [
        { id: "service", label: "Service", ...counts.service },
        { id: "company", label: "Company", ...counts.company },
      ],
    },
  ];

  const refRates = Object.entries(taxMeta.reference_rates ?? {});
  const dEwc = dittos(ewcCatalogue);
  const dContainers = dittos(containers);
  const dVehicles = dittos(vehicles);

  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-24 sm:px-6">
      {/* Intro */}
      <header className="grid gap-10 border-b border-line py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center lg:gap-16 lg:py-16">
        <div className="stagger [--stagger-step:80ms]">
          <h1 className="text-[40px] font-semibold leading-[1] tracking-[-0.035em] sm:text-[56px] lg:text-[64px]">Price book</h1>
          <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-ink-2 sm:text-[18px]">
            Every price, factor and rule behind a quote, and where each one comes from.
          </p>
          <ul className="mt-7 max-w-[70ch] space-y-3 text-[14px] leading-relaxed text-ink">
            <Point>
              Prices and factors are plain JSON files in <Plate>/data</Plate>, so the waste company can edit them without touching code.
            </Point>
            <Point>
              Sample values carry the <SampleBadge title="Sample value" /> stripe. Values marked <SourcedMark /> come from the public source
              named next to them.
            </Point>
            <Point>The eligibility rules are compiled into the CPQ engine, so the configurator and this page always open the same routes.</Point>
            <Point>
              Research notes for every sourced value are in <Plate>data/SOURCES.md</Plate> in the repository.
            </Point>
          </ul>
        </div>
        <div className="animate-rise anim-delay-200 overflow-hidden rounded-xl border border-line bg-surface shadow-card">
          <div className="p-6">
            <div className="flex items-baseline gap-3">
              <span className="animate-num-in anim-delay-350 font-mono text-[44px] font-medium leading-none tracking-[-0.03em] tabular">
                {numeric.total}
              </span>
              <span className="text-[15px] font-semibold leading-tight">numbers feed a quote</span>
            </div>
            <p className="mb-4 mt-2 text-[13px] text-muted">Prices, densities, distances, taxes and CO₂e factors.</p>
            <ShareBar sourced={numeric.total - numeric.sample} sample={numeric.sample} labels={["sourced", "sample"]} delay={450} />
          </div>
          <div className="border-t border-line bg-tablehead/60 p-6">
            <div className="flex items-baseline gap-3">
              <span className="animate-num-in anim-delay-500 font-mono text-[44px] font-medium leading-none tracking-[-0.03em] tabular">
                {rules.length}
              </span>
              <span className="text-[15px] font-semibold leading-tight">eligibility rules</span>
            </div>
            <p className="mb-4 mt-2 text-[13px] text-muted">Law and physical fact, then the company&apos;s own acceptance rules.</p>
            <ShareBar sourced={lawRules} sample={rules.length - lawRules} labels={["law or fact", "company rules (sample)"]} delay={600} />
          </div>
        </div>
      </header>

      <div className="relative pt-8 lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12 lg:pt-12">
        <aside className="contents lg:block">
          <Toc groups={groups} />
        </aside>

        <div className="animate-rise anim-delay-300 mt-6 min-w-0 space-y-20 lg:mt-0">
          {/* ---------------------------------------------------------- Routes */}
          <Section id="routes" title="Routes" file="data/routes.json" meta={meta("routes")}>
            <TableShell minWidth={900} caption="Treatment routes">
              <thead>
                <tr>
                  <th className={cn(TH, "w-[1%]")}>Rank</th>
                  <th className={TH}>Route</th>
                  <th className={TH}>Hierarchy level</th>
                  <th className={TH}>What it means</th>
                  <th className={TH}>Source</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r.id}>
                    <td className={cn(TD, NUM, "text-center")}>{r.hierarchy_rank}</td>
                    <td className={TD}>
                      <RouteName route={r.id} name={r.name} className="font-semibold" />
                      <div className={cn("mt-1 text-[12px]", r.circular ? "font-medium text-circular" : "text-muted")}>
                        {r.circular ? "Circular" : "Linear"}
                      </div>
                    </td>
                    <td className={cn(TD, "text-ink-2")}>{r.hierarchy_level}</td>
                    <td className={cn(TD, "max-w-[40ch] text-ink-2")}>{r.description}</td>
                    <ProvCell source={r.source} url={r.source_url} notes={r.notes} isSample={r.is_sample} />
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </Section>

          {/* ---------------------------------------------------------- Eligibility */}
          <Section id="eligibility" title="Eligibility rules" file="data/eligibility.json" meta={meta("eligibility")}>
            <EligibilityMatrix />
            <RuleList />
          </Section>

          {/* ---------------------------------------------------------- Materials */}
          <Section id="materials" title="Materials" file="data/materials.json" meta={meta("materials")}>
            <TableShell minWidth={960} caption="Materials">
              <thead>
                <tr>
                  <th className={TH}>Material</th>
                  <th className={TH}>EWC codes</th>
                  <th className={cn(TH, "text-right")}>t/m³</th>
                  <th className={TH}>How contamination is graded</th>
                  <th className={TH}>Source</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => (
                  <tr key={m.id}>
                    <td className={cn(TD, "min-w-[170px]")}>
                      <div className="font-semibold">{m.name}</div>
                      <div className="mt-0.5 text-[12px] text-muted">{m.examples}</div>
                    </td>
                    <td className={TD}>
                      <div className="flex flex-col items-start gap-1">
                        {m.ewc_codes.map((c) => (
                          <Plate key={c}>{c}</Plate>
                        ))}
                      </div>
                    </td>
                    <td className={cn(TD, NUM, "text-[14px] font-medium")}>{n(m.bulk_density_t_per_m3)}</td>
                    <td className={cn(TD, "min-w-[260px]")}>
                      <dl className="space-y-1 text-[12px] leading-snug">
                        {(["low", "medium", "high"] as const).map((l) => (
                          <div key={l} className="grid grid-cols-[52px_minmax(0,1fr)] gap-2">
                            <dt className="font-medium capitalize text-ink">{l}</dt>
                            <dd className="text-ink-2">{m.contamination[l]}</dd>
                          </div>
                        ))}
                      </dl>
                    </td>
                    <ProvCell source={m.source} url={m.source_url} notes={m.notes} isSample={m.is_sample} />
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </Section>

          {/* ---------------------------------------------------------- EWC */}
          <Section id="ewc" title="EWC codes" file="data/ewc.json" meta={meta("ewc")}>
            <TableShell minWidth={980} caption="European Waste Catalogue entries">
              <thead>
                <tr>
                  <th className={TH}>Code</th>
                  <th className={TH}>Description</th>
                  <th className={TH}>Stream</th>
                  <th className={TH}>Chapter</th>
                  <th className={TH}>Hazardous</th>
                  <th className={TH}>Source</th>
                </tr>
              </thead>
              <tbody>
                {ewcCatalogue.map((e, i) => (
                  <tr key={e.code}>
                    <td className={TD}>
                      <Plate>{e.code}</Plate>
                    </td>
                    <td className={cn(TD, "min-w-[180px]")}>{e.description}</td>
                    <td className={cn(TD, "whitespace-nowrap text-ink-2")}>{mName(e.material)}</td>
                    <td className={cn(TD, "min-w-[220px] text-[12px] text-muted")}>{e.chapter}</td>
                    <td className={cn(TD, "text-ink-2")}>{e.hazardous ? "Yes" : "No"}</td>
                    <ProvCell source={e.source} url={e.source_url} notes={e.notes} isSample={e.is_sample} ditto={dEwc[i]} />
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </Section>

          {/* ---------------------------------------------------------- Treatments */}
          <Section id="treatments" title="Treatments" file="data/treatments.json" meta={meta("treatments")}>
            {treatMeta.rd_code_source && (
              <div className="flex flex-wrap items-baseline gap-x-2 text-[12px]">
                <span className="text-muted">R/D codes</span>
                <SourceText source={treatMeta.rd_code_source} url={treatMeta.rd_code_source_url} />
              </div>
            )}
            <TableShell minWidth={980} caption="Treatments by material and route">
              <thead>
                <tr>
                  <th className={TH}>Route</th>
                  <th className={TH}>Treatment</th>
                  <th className={TH}>Facility</th>
                  <th className={cn(TH, "text-right")}>km one way</th>
                  <th className={TH}>R/D</th>
                  <th className={TH}>Source</th>
                </tr>
              </thead>
              {byMaterial(treatments).map((g) => (
                <tbody key={g.id}>
                  <GroupRow colSpan={7}>{g.name}</GroupRow>
                  {inRouteOrder(g.rows).map(({ row: t, ditto }) => (
                    <tr key={t.route}>
                      <td className={TD}>
                        <RouteName route={t.route} name={rName(t.route)} />
                      </td>
                      <td className={TD}>{t.treatment}</td>
                      <td className={cn(TD, "text-ink-2")}>{t.facility}</td>
                      <td className={cn(TD, NUM)}>{n(t.default_distance_km)}</td>
                      <td className={TD}>{t.rd_code === "-" ? <span className="text-muted">–</span> : <Plate>{t.rd_code}</Plate>}</td>
                      <ProvCell source={t.source} url={t.source_url} notes={t.notes} isSample={t.is_sample} ditto={ditto} />
                    </tr>
                  ))}
                </tbody>
              ))}
            </TableShell>
          </Section>

          {/* ---------------------------------------------------------- Gate fees */}
          <Section id="gate-fees" title="Gate fees" file="data/pricing.json" meta={meta("pricing")}>
            <TableShell minWidth={760} caption="Gate fees by material and route">
              <thead>
                <tr>
                  <th className={TH}>Route</th>
                  <th className={cn(TH, "text-right")}>€/t</th>
                  <th className={TH}>Source</th>
                </tr>
              </thead>
              {byMaterial(pricing.gate_fees).map((g) => (
                <tbody key={g.id}>
                  <GroupRow colSpan={4}>{g.name}</GroupRow>
                  {inRouteOrder(g.rows).map(({ row: p, ditto }) => (
                    <tr key={p.route}>
                      <td className={cn(TD, "w-[160px]")}>
                        <RouteName route={p.route} name={rName(p.route)} />
                      </td>
                      <td className={cn(TD, NUM, "w-[110px] text-[15px] font-medium")}>{n(p.eur_per_t)}</td>
                      <ProvCell source={p.source} url={p.source_url} notes={p.notes} isSample={p.is_sample} ditto={ditto} />
                    </tr>
                  ))}
                </tbody>
              ))}
            </TableShell>
          </Section>

          {/* ---------------------------------------------------------- Rebates */}
          <Section
            id="rebates"
            title="Rebates"
            file="data/pricing.json"
            meta={{ description: "What a clean recyclate is worth per tonne, paid back to the customer as a negative line on the quote." }}
          >
            <TableShell minWidth={760} caption="Rebates by material and route">
              <thead>
                <tr>
                  <th className={TH}>Material</th>
                  <th className={TH}>Route</th>
                  <th className={cn(TH, "text-right")}>€/t</th>
                  <th className={TH}>Source</th>
                </tr>
              </thead>
              <tbody>
                {pricing.rebates.map((p) => (
                  <tr key={p.material + p.route}>
                    <td className={cn(TD, "font-medium")}>{mName(p.material)}</td>
                    <td className={TD}>
                      <RouteName route={p.route} name={rName(p.route)} />
                    </td>
                    <td className={cn(TD, NUM, "text-[14px] font-medium")}>{n(p.eur_per_t)}</td>
                    <ProvCell source={p.source} url={p.source_url} notes={p.notes} isSample={p.is_sample} />
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </Section>

          {/* ---------------------------------------------------------- Contamination */}
          <Section
            id="contamination"
            title="Contamination factors"
            file="data/pricing.json"
            meta={{ description: "Contamination raises the gate fee and lowers the rebate. Stored as shares; shown here as percentages." }}
          >
            <TableShell minWidth={820} caption="Contamination factors">
              <thead>
                <tr>
                  <th className={TH}>Factor</th>
                  <th className={cn(TH, "text-right")}>Low</th>
                  <th className={cn(TH, "text-right")}>Medium</th>
                  <th className={cn(TH, "text-right")}>High</th>
                  <th className={TH}>Source</th>
                </tr>
              </thead>
              <tbody>
                {contamination.map((c) => (
                  <tr key={c.key}>
                    <td className={TD}>
                      <div className="font-medium">{c.label}</div>
                      <div className="text-[12px] text-muted">{c.hint}</div>
                    </td>
                    {(["low", "medium", "high"] as const).map((l) => (
                      <td key={l} className={cn(TD, NUM, "text-[14px] font-medium")} title={`Stored as ${c.row[l]}`}>
                        {c.fmt(c.row[l])}
                      </td>
                    ))}
                    <ProvCell source={c.row.source} url={c.row.source_url} notes={c.row.notes} isSample={c.row.is_sample} />
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </Section>

          {/* ---------------------------------------------------------- Taxes */}
          <Section id="taxes" title="Taxes" file="data/taxes.json" meta={meta("taxes")}>
            <TableShell minWidth={900} caption="Taxes applied">
              <thead>
                <tr>
                  <th className={TH}>Tax</th>
                  <th className={TH}>Route</th>
                  <th className={TH}>Applies to</th>
                  <th className={cn(TH, "text-right")}>€/t</th>
                  <th className={TH}>Source</th>
                </tr>
              </thead>
              <tbody>
                {taxes.map((t) => (
                  <tr key={t.id}>
                    <td className={cn(TD, "min-w-[180px] font-medium")}>{t.name}</td>
                    <td className={TD}>
                      <RouteName route={t.route} name={rName(t.route)} />
                    </td>
                    <td className={cn(TD, "min-w-[160px] text-ink-2")}>{t.materials ? t.materials.map(mName).join(", ") : "Every material"}</td>
                    <td className={cn(TD, NUM, "text-[14px] font-medium")}>{n(t.eur_per_t)}</td>
                    <ProvCell source={t.source} url={t.source_url} notes={t.notes} isSample={t.is_sample} />
                  </tr>
                ))}
              </tbody>
            </TableShell>
            {refRates.length > 0 && (
              <div className="rounded-lg border border-dashed border-line-2 px-4 py-3">
                <div className="text-[13px] font-semibold">Reference only, not applied to quotes</div>
                <ul className="mt-2 space-y-2">
                  {refRates.map(([k, v]) => {
                    const label = k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()).replace(/\bR01\b/i, "R01");
                    if (typeof v === "string") {
                      return (
                        <li key={k} className="text-[12px] text-ink-2">
                          <span className="font-medium text-ink">{label}:</span> {v}
                        </li>
                      );
                    }
                    const r = v as { eur_per_t?: number; source?: string; source_url?: string };
                    return (
                      <li key={k} className="grid gap-x-4 gap-y-0.5 text-[12px] sm:grid-cols-[minmax(0,1fr)_80px_minmax(0,1.2fr)_auto] sm:items-baseline">
                        <span className="font-medium text-ink">{label}</span>
                        <span className="font-mono text-[13px] tabular sm:text-right">{r.eur_per_t !== undefined ? `${n(r.eur_per_t)} €/t` : ""}</span>
                        {r.source ? <SourceText source={r.source} url={r.source_url} /> : <span />}
                        <SourcedMark />
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </Section>

          {/* ---------------------------------------------------------- Containers */}
          <Section id="containers" title="Containers" file="data/containers.json" meta={meta("containers")}>
            <TableShell minWidth={940} caption="Containers">
              <thead>
                <tr>
                  <th className={TH}>Container</th>
                  <th className={cn(TH, "text-right")}>m³</th>
                  <th className={cn(TH, "text-right")}>Rent €/month</th>
                  <th className={cn(TH, "text-right")}>Lift €</th>
                  <th className={cn(TH, "text-right")}>Payload t</th>
                  <th className={cn(TH, "text-right")}>Compaction</th>
                  <th className={TH}>Source</th>
                </tr>
              </thead>
              <tbody>
                {containers.map((c, i) => (
                  <tr key={c.id}>
                    <td className={cn(TD, "min-w-[230px]")}>
                      <div className="font-semibold">{c.name}</div>
                      <div className="mt-0.5 text-[12px] text-ink-2">{vehicles.find((v) => v.id === c.vehicle)?.name ?? c.vehicle}</div>
                      <div className="mt-1 text-[12px] leading-snug text-muted">Takes {c.materials.map(mName).join(", ").toLowerCase()}</div>
                    </td>
                    <td className={cn(TD, NUM)}>{n(c.size_m3)}</td>
                    <td className={cn(TD, NUM)}>{n(c.rent_eur_per_month)}</td>
                    <td className={cn(TD, NUM)}>{n(c.lift_fee_eur)}</td>
                    <td className={cn(TD, NUM)}>{n(c.max_payload_t)}</td>
                    <td className={cn(TD, NUM)}>{n(c.compaction_ratio)}×</td>
                    <ProvCell source={c.source} url={c.source_url} notes={c.notes} isSample={c.is_sample} ditto={dContainers[i]} className="min-w-[150px]" />
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </Section>

          {/* ---------------------------------------------------------- Transport */}
          <Section id="transport" title="Transport" file="data/transport.json" meta={meta("transport")}>
            <TableShell minWidth={900} caption="Vehicles">
              <thead>
                <tr>
                  <th className={TH}>Vehicle</th>
                  <th className={cn(TH, "text-right")}>€/km</th>
                  <th className={cn(TH, "text-right")}>Share of trip</th>
                  <th className={cn(TH, "text-right")}>kg CO₂e/km</th>
                  <th className={TH}>Source</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v, i) => (
                  <tr key={v.id}>
                    <td className={cn(TD, "min-w-[170px] font-medium")}>{v.name}</td>
                    <td className={cn(TD, NUM)}>{n(v.eur_per_km)}</td>
                    <td className={cn(TD, NUM)}>{n(v.distance_share)}</td>
                    <td className={cn(TD, NUM)}>{n(v.kg_co2e_per_km)}</td>
                    <ProvCell source={v.source} url={v.source_url} notes={v.notes} isSample={v.is_sample} ditto={dVehicles[i]} />
                  </tr>
                ))}
                <tr>
                  <td className={TD}>
                    <div className="font-medium">Collection leg in the CO₂e factors</div>
                    <div className="text-[12px] text-muted">Only distance beyond this, one way, adds transport CO₂e</div>
                  </td>
                  <td className={cn(TD, NUM, "text-[14px] font-medium")} colSpan={3}>
                    {n(transportIncludedKm.value)} km
                  </td>
                  <ProvCell
                    source={transportIncludedKm.source}
                    url={transportIncludedKm.source_url}
                    notes={transportIncludedKm.notes}
                    isSample={transportIncludedKm.is_sample}
                  />
                </tr>
              </tbody>
            </TableShell>
          </Section>

          {/* ---------------------------------------------------------- Emission factors */}
          <Section id="emissions" title="Emission factors" file="data/emission-factors.json" meta={meta("emission_factors")}>
            {emMeta.methodology_url && (
              <div className="text-[12px] text-ink-2">
                <ExtLink href={emMeta.methodology_url}>DESNZ 2026 methodology report</ExtLink>
              </div>
            )}
            <TableShell minWidth={820} caption="Emission factors by material and route">
              <thead>
                <tr>
                  <th className={TH}>Route</th>
                  <th className={cn(TH, "text-right")}>
                    Direct kg/t
                    <div className="font-normal">reporting</div>
                  </th>
                  <th className={cn(TH, "text-right")}>
                    Net kg/t
                    <div className="font-normal">comparison</div>
                  </th>
                  <th className={TH}>Sources</th>
                </tr>
              </thead>
              {byMaterial(emissionFactors).map((g) => (
                <tbody key={g.id}>
                  <GroupRow colSpan={4}>{g.name}</GroupRow>
                  {[...g.rows].sort(routeOrder).map((e) => (
                    <tr key={e.route}>
                      <td className={cn(TD, "w-[150px]")}>
                        <RouteName route={e.route} name={rName(e.route)} />
                      </td>
                      <td className={cn(TD, NUM, "w-[120px] text-ink-2")}>{n(e.direct_kg_co2e_per_t)}</td>
                      <td className={cn(TD, NUM, "w-[120px] text-[15px] font-medium", e.net_kg_co2e_per_t < 0 && "text-circular")}>
                        {n(e.net_kg_co2e_per_t)}
                      </td>
                      <td className={cn(TD, "min-w-[320px]")}>
                        <div className="mb-1.5">
                          {e.is_sample ? <SampleBadge title="Sample or proxy factor: see the notes" /> : <SourcedMark />}
                        </div>
                        <div className="space-y-1.5 text-[12px] leading-snug">
                          <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-2">
                            <span className="text-muted">Direct</span>
                            <SourceText source={e.direct_source ?? e.source} url={e.direct_source_url ?? e.source_url} />
                          </div>
                          <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-2">
                            <span className="text-muted">Net</span>
                            <SourceText source={e.net_source ?? e.source} url={e.net_source_url ?? e.source_url} />
                          </div>
                          {e.notes && <p className="text-muted">{e.notes}</p>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </TableShell>
          </Section>

          {/* ---------------------------------------------------------- Service */}
          <Section id="service" title="Service" file="data/service.json" meta={meta("service")}>
            <TableShell minWidth={760} caption="Service definitions">
              <thead>
                <tr>
                  <th className={TH}>Setting</th>
                  <th className={cn(TH, "text-right")}>Value</th>
                  <th className={TH}>Source</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={cn(TD, "font-medium")}>Fill at pickup</td>
                  <td className={cn(TD, NUM, "text-[14px] font-medium")}>{n(service.fill_factor.value)}</td>
                  <ProvCell
                    source={service.fill_factor.source}
                    url={service.fill_factor.source_url}
                    notes={service.fill_factor.notes}
                    isSample={service.fill_factor.is_sample}
                  />
                </tr>
                <tr>
                  <td className={cn(TD, "font-medium")}>Weeks per month</td>
                  <td className={cn(TD, NUM, "text-[14px] font-medium")}>{n(service.weeks_per_month)}</td>
                  <td className={cn(TD, "text-[12px] text-ink-2")}>Calendar convention: 52 weeks over 12 months.</td>
                  <td className={TD}>
                    <Definition>Definition</Definition>
                  </td>
                </tr>
              </tbody>
              <tbody>
                <GroupRow colSpan={4}>Pickup frequencies (lifts per week)</GroupRow>
                {service.frequencies.map((f) => (
                  <tr key={f.id}>
                    <td className={TD}>{f.name}</td>
                    <td className={cn(TD, NUM)}>{n(f.lifts_per_week)}</td>
                    <td className={cn(TD, "text-[12px] text-ink-2")}>Service definition</td>
                    <td className={TD}>
                      <Definition>Definition</Definition>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </Section>

          {/* ---------------------------------------------------------- Company */}
          <Section id="company" title="Company" file="data/company.json" meta={{ description: "The seller on every quote, the demo customer and the quote terms. Both companies are fictional." }}>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[14px] font-semibold">Seller</h3>
                  {company.seller.is_sample ? <SampleBadge title="Fictional sample company" /> : <SourcedMark />}
                </div>
                <dl className="mt-3 space-y-2 text-[13px]">
                  {(
                    [
                      ["Name", company.seller.name],
                      ["Address", company.seller.address],
                      ["Phone", company.seller.phone],
                      ["Email", company.seller.email],
                      ["Carrier registration", company.seller.carrier_registration],
                      ["Waste manager registration", company.seller.waste_manager_registration],
                    ] as const
                  ).map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[12px] text-muted">{k}</dt>
                      <dd className={k.includes("registration") ? "font-mono text-[12px]" : undefined}>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="rounded-lg border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[14px] font-semibold">Demo customer</h3>
                  {company.demo_customer.is_sample ? <SampleBadge title="Fictional sample customer" /> : <SourcedMark />}
                </div>
                <dl className="mt-3 space-y-2 text-[13px]">
                  {(
                    [
                      ["Company", company.demo_customer.company],
                      ["Site", company.demo_customer.site],
                      ["Contact", company.demo_customer.contact],
                      ["NACE", company.demo_customer.sic_or_nace],
                    ] as const
                  ).map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[12px] text-muted">{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="rounded-lg border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[14px] font-semibold">Quote terms</h3>
                  <SampleBadge title="Terms of the fictional sample company" />
                </div>
                <dl className="mt-3 space-y-2 text-[13px]">
                  <div>
                    <dt className="text-[12px] text-muted">Valid for</dt>
                    <dd>
                      <span className="font-mono tabular">{n(company.quote_terms.valid_days)}</span> days
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[12px] text-muted">Currency</dt>
                    <dd className="font-mono">{company.quote_terms.currency}</dd>
                  </div>
                  <div>
                    <dt className="text-[12px] text-muted">VAT</dt>
                    <dd>{company.quote_terms.vat_note}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
