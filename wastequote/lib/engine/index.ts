// The deterministic quote engine. No LLM in here: route eligibility comes
// from data/eligibility.json and every price and CO2e number is arithmetic
// on the /data tables, with a citation back to the row it used.
import {
  company,
  containerById,
  containers,
  emissionFactors,
  frequencyById,
  materialById,
  pricing,
  routes,
  rules,
  service,
  taxes,
  treatments,
  vehicles,
  type Rule,
} from "../data";
import type {
  Capacity,
  Citation,
  Co2Breakdown,
  Contamination,
  Evaluation,
  MaterialId,
  PriceBreakdown,
  PriceLine,
  RouteId,
  RouteResult,
  RuleHit,
  ServiceConfig,
  StreamInput,
} from "../types";

export const CURRENCY = company.quote_terms.currency;

const round2 = (n: number) => Math.round(n * 100) / 100;

function cite(
  table: string,
  row: string,
  label: string,
  value: number | string,
  unit: string | undefined,
  p: { source: string; source_url?: string | null; is_sample: boolean; notes?: string | null },
): Citation {
  return { table, row, label, value, unit, source: p.source, source_url: p.source_url, is_sample: p.is_sample, notes: p.notes };
}

// ---------------------------------------------------------------- eligibility

function ruleMatches(rule: Rule, material: MaterialId, route: RouteId, level: Contamination) {
  const materialOk =
    rule.material === "*" ||
    (Array.isArray(rule.material) ? rule.material.includes(material) : rule.material === material);
  const routeOk = rule.route === "*" || rule.route === route;
  return materialOk && routeOk && rule.contamination.includes(level);
}

export function checkEligibility(material: MaterialId, route: RouteId, level: Contamination) {
  const hits: RuleHit[] = rules
    .filter((r) => ruleMatches(r, material, route, level))
    .map((r) => ({
      ruleId: r.id,
      effect: r.effect,
      text: r.text,
      source: r.source,
      source_url: r.source_url,
      is_sample: r.is_sample,
    }));
  const denied = hits.some((h) => h.effect === "deny");
  const allowed = hits.some((h) => h.effect === "allow");
  if (!allowed && !denied) {
    hits.push({
      ruleId: "DEFAULT",
      effect: "deny",
      text: "No rule allows this route for this material at this contamination level (default is deny).",
      source: "Engine default",
      is_sample: false,
    });
  }
  // Show the deciding rules first: denials, then allows, then notes.
  const order = { deny: 0, allow: 1, surcharge: 2, warn: 3 } as const;
  hits.sort((a, b) => order[a.effect] - order[b.effect]);
  return { eligible: allowed && !denied, hits };
}

// ------------------------------------------------------------------- capacity

export function liftsPerMonth(frequencyId: string) {
  const f = frequencyById(frequencyId);
  if (!f) throw new Error(`Unknown frequency ${frequencyId}`);
  return f.lifts_per_week * service.weeks_per_month;
}

export function computeCapacity(stream: StreamInput, config: ServiceConfig): Capacity {
  const material = materialById(stream.material)!;
  const container = containerById(config.containerId);
  if (!container) throw new Error(`Unknown container ${config.containerId}`);
  const lifts = liftsPerMonth(config.frequencyId);
  const fill = service.fill_factor.value;
  const volumePerMonth = stream.volumePerWeekM3 * service.weeks_per_month;
  const capacityPerMonth =
    config.containerCount * container.size_m3 * container.compaction_ratio * fill * lifts;
  const tonnesPerMonth = volumePerMonth * material.bulk_density_t_per_m3;
  const tonnesPerLift = tonnesPerMonth / Math.max(lifts * config.containerCount, 1e-9);
  const utilisation = capacityPerMonth > 0 ? volumePerMonth / capacityPerMonth : Infinity;

  const warnings: string[] = [];
  if (!container.materials.includes(stream.material)) {
    warnings.push(`A ${container.name} is not offered for ${material.name.toLowerCase()} in the price list.`);
  }
  if (utilisation > 1) {
    warnings.push(
      `Undersized: ${round2(volumePerMonth)} m³/month generated but only ${round2(capacityPerMonth)} m³/month collected. Add a container or collect more often.`,
    );
  } else if (utilisation < 0.35) {
    warnings.push(
      `Oversized: containers would be emptied at ${Math.round(utilisation * 100)}% of usable capacity. A smaller container or fewer pickups is cheaper.`,
    );
  }
  if (tonnesPerLift > container.max_payload_t) {
    warnings.push(
      `Too heavy: about ${round2(tonnesPerLift)} t per lift exceeds the ${container.max_payload_t} t payload of a ${container.name}.`,
    );
  }

  return {
    liftsPerMonth: lifts,
    volumePerMonthM3: volumePerMonth,
    capacityPerMonthM3: capacityPerMonth,
    utilisation,
    tonnesPerMonth,
    tonnesPerLift,
    warnings,
    citations: [
      cite("materials", material.id, "Bulk density", material.bulk_density_t_per_m3, "t/m³", material),
      cite("service", "fill_factor", "Usable fill", fill, "", service.fill_factor),
      cite("containers", container.id, "Container size", container.size_m3, "m³", container),
    ],
  };
}

/** Smallest container setup (one container type, 1-4 units) whose usable capacity covers the volume. */
export function suggestContainer(stream: StreamInput, frequencyId: string) {
  const lifts = liftsPerMonth(frequencyId);
  const volumePerMonth = stream.volumePerWeekM3 * service.weeks_per_month;
  const material = materialById(stream.material)!;
  const options: Array<{ containerId: string; count: number; monthlyCost: number }> = [];
  for (const c of containers) {
    if (!c.materials.includes(stream.material)) continue;
    for (let count = 1; count <= 4; count++) {
      const cap = count * c.size_m3 * c.compaction_ratio * service.fill_factor.value * lifts;
      const tonnesPerLift = (volumePerMonth * material.bulk_density_t_per_m3) / (lifts * count);
      if (cap >= volumePerMonth && tonnesPerLift <= c.max_payload_t) {
        options.push({ containerId: c.id, count, monthlyCost: count * (c.rent_eur_per_month + lifts * c.lift_fee_eur) });
        break;
      }
    }
  }
  options.sort((a, b) => a.monthlyCost - b.monthlyCost);
  return options[0] ?? null;
}

// -------------------------------------------------------------------- pricing

function treatmentFor(material: MaterialId, route: RouteId) {
  return treatments.find((t) => t.material === material && t.route === route);
}

export function defaultDistance(material: MaterialId, route: RouteId) {
  return treatmentFor(material, route)?.default_distance_km ?? 0;
}

function priceRoute(
  stream: StreamInput,
  config: ServiceConfig,
  capacity: Capacity,
  route: RouteId,
): PriceBreakdown {
  const container = containerById(config.containerId)!;
  const vehicle = vehicles.find((v) => v.id === container.vehicle);
  if (!vehicle) throw new Error(`Container ${container.id} uses unknown vehicle ${container.vehicle}`);
  const t = capacity.tonnesPerMonth;
  const level = stream.contamination;
  const km = config.distanceKm[route] ?? defaultDistance(stream.material, route);
  const liftsTotal = capacity.liftsPerMonth * config.containerCount;
  const lines: PriceLine[] = [];

  // Container rental
  lines.push({
    key: "rental",
    label: "Container rental",
    amount: config.containerCount * container.rent_eur_per_month,
    formula: `${config.containerCount} × ${container.name} × €${container.rent_eur_per_month}/month`,
    citations: [cite("containers", container.id, "Rent", container.rent_eur_per_month, "€/month", container)],
  });

  // Transport: lift fee + round trip km
  const tripKm = 2 * km * vehicle.distance_share;
  const perLift = container.lift_fee_eur + tripKm * vehicle.eur_per_km;
  lines.push({
    key: "transport",
    label: "Collection & transport",
    amount: liftsTotal * perLift,
    formula:
      `${round2(liftsTotal)} lifts/month × (€${container.lift_fee_eur} lift fee + 2 × ${km} km` +
      (vehicle.distance_share < 1 ? ` × ${vehicle.distance_share} round share` : "") +
      ` × €${vehicle.eur_per_km}/km)`,
    citations: [
      cite("containers", container.id, "Lift fee", container.lift_fee_eur, "€/lift", container),
      cite("transport", vehicle.id, "Vehicle cost", vehicle.eur_per_km, "€/km", vehicle),
      cite("transport", vehicle.id, "Round share", vehicle.distance_share, "", vehicle),
    ],
  });

  // Gate fee with contamination surcharge
  const gate = pricing.gate_fees.find((g) => g.material === stream.material && g.route === route);
  if (gate) {
    const s = pricing.contamination_gate_fee_surcharge[level];
    lines.push({
      key: "gate_fee",
      label: s > 0 ? `Treatment gate fee (+${Math.round(s * 100)}% contamination)` : "Treatment gate fee",
      amount: t * gate.eur_per_t * (1 + s),
      formula: `${round2(t)} t × €${gate.eur_per_t}/t` + (s > 0 ? ` × ${1 + s}` : ""),
      citations: [
        cite("pricing.gate_fees", `${gate.material}/${gate.route}`, "Gate fee", gate.eur_per_t, "€/t", gate),
        ...(s > 0
          ? [cite("pricing", "contamination_gate_fee_surcharge", `Surcharge (${level})`, s, "", pricing.contamination_gate_fee_surcharge)]
          : []),
      ],
    });
  }

  // Taxes (landfill, incineration)
  for (const tax of taxes.filter((x) => x.route === route)) {
    lines.push({
      key: "tax",
      label: tax.name,
      amount: t * tax.eur_per_t,
      formula: `${round2(t)} t × €${tax.eur_per_t}/t`,
      citations: [cite("taxes", tax.id, tax.name, tax.eur_per_t, "€/t", tax)],
    });
  }

  // Material rebate (negative)
  const rebate = pricing.rebates.find((r) => r.material === stream.material && r.route === route);
  if (rebate) {
    const f = pricing.contamination_rebate_factor[level];
    lines.push({
      key: "rebate",
      label: f < 1 ? `Material rebate (${Math.round(f * 100)}% of clean grade)` : "Material rebate",
      amount: -t * rebate.eur_per_t * f,
      formula: `− ${round2(t)} t × €${rebate.eur_per_t}/t` + (f < 1 ? ` × ${f}` : ""),
      citations: [
        cite("pricing.rebates", `${rebate.material}/${rebate.route}`, "Rebate", rebate.eur_per_t, "€/t", rebate),
        ...(f < 1
          ? [cite("pricing", "contamination_rebate_factor", `Rebate factor (${level})`, f, "", pricing.contamination_rebate_factor)]
          : []),
      ],
    });
  }

  for (const l of lines) l.amount = round2(l.amount);
  const total = round2(lines.reduce((s, l) => s + l.amount, 0));
  return { lines, totalPerMonth: total, perTonne: t > 0 ? round2(total / t) : 0 };
}

// ---------------------------------------------------------------------- co2e

function co2Route(
  stream: StreamInput,
  config: ServiceConfig,
  capacity: Capacity,
  route: RouteId,
): Co2Breakdown | null {
  const ef = emissionFactors.find((e) => e.material === stream.material && e.route === route);
  if (!ef) return null;
  const container = containerById(config.containerId)!;
  const vehicle = vehicles.find((v) => v.id === container.vehicle)!;
  const km = config.distanceKm[route] ?? defaultDistance(stream.material, route);
  const liftsTotal = capacity.liftsPerMonth * config.containerCount;
  const transportKgPerMonth = liftsTotal * 2 * km * vehicle.distance_share * vehicle.kg_co2e_per_km;
  const t = capacity.tonnesPerMonth;
  const transportKgPerT = t > 0 ? transportKgPerMonth / t : 0;
  const totalKgPerT = ef.net_kg_co2e_per_t + transportKgPerT;
  return {
    directKgPerT: ef.direct_kg_co2e_per_t,
    netKgPerT: ef.net_kg_co2e_per_t,
    transportKgPerMonth: Math.round(transportKgPerMonth),
    transportKgPerT: Math.round(transportKgPerT),
    totalKgPerT: Math.round(totalKgPerT),
    totalKgPerMonth: Math.round(totalKgPerT * t),
    citations: [
      cite(
        "emission_factors",
        `${ef.material}/${ef.route}`,
        "Net factor (lifecycle)",
        ef.net_kg_co2e_per_t,
        "kg CO2e/t",
        { source: ef.net_source ?? ef.source, source_url: ef.net_source_url ?? ef.source_url, is_sample: ef.is_sample, notes: ef.notes },
      ),
      cite(
        "emission_factors",
        `${ef.material}/${ef.route}`,
        "Direct factor (reporting)",
        ef.direct_kg_co2e_per_t,
        "kg CO2e/t",
        { source: ef.direct_source ?? ef.source, source_url: ef.direct_source_url ?? ef.source_url, is_sample: ef.is_sample, notes: ef.notes },
      ),
      cite("transport", vehicle.id, "Vehicle emissions", vehicle.kg_co2e_per_km, "kg CO2e/km", vehicle),
    ],
  };
}

// ------------------------------------------------------------------- evaluate

export function evaluate(stream: StreamInput, config: ServiceConfig): Evaluation {
  const capacity = computeCapacity(stream, config);
  const results: RouteResult[] = routes.map((r) => {
    const route = r.id;
    const { eligible, hits } = checkEligibility(stream.material, route, stream.contamination);
    const tr = treatmentFor(stream.material, route);
    const price = eligible ? priceRoute(stream, config, capacity, route) : null;
    const co2 = eligible ? co2Route(stream, config, capacity, route) : null;
    const usesSampleData =
      !!price &&
      (price.lines.some((l) => l.citations.some((c) => c.is_sample)) ||
        capacity.citations.some((c) => c.is_sample) ||
        !!co2?.citations.some((c) => c.is_sample));
    return {
      route,
      routeName: r.name,
      treatmentName: tr?.treatment ?? "Not applicable",
      facilityName: tr?.facility ?? "",
      rdCode: tr?.rd_code ?? "-",
      hierarchyRank: r.hierarchy_rank,
      circular: r.circular,
      eligible,
      rules: hits,
      price,
      co2,
      usesSampleData,
      tags: [],
    };
  });

  const eligible = results.filter((r) => r.eligible && r.price);
  const recommended = eligible.filter((r) => r.circular).sort((a, b) => a.hierarchyRank - b.hierarchyRank)[0];
  const cheapest = [...eligible].sort((a, b) => a.price!.totalPerMonth - b.price!.totalPerMonth)[0];
  const greenest = [...eligible]
    .filter((r) => r.co2)
    .sort((a, b) => a.co2!.totalKgPerT - b.co2!.totalKgPerT)[0];
  if (recommended) recommended.tags.push("circular_choice");
  if (cheapest) cheapest.tags.push("lowest_cost");
  if (greenest) greenest.tags.push("lowest_co2");

  return {
    stream,
    config,
    capacity,
    routes: results,
    recommendedRoute: recommended?.route ?? null,
    cheapestRoute: cheapest?.route ?? null,
  };
}

/** Distances for every route at their facility defaults. */
export function defaultDistances(material: MaterialId): Partial<Record<RouteId, number>> {
  const out: Partial<Record<RouteId, number>> = {};
  for (const r of routes) out[r.id] = defaultDistance(material, r.id);
  return out;
}
