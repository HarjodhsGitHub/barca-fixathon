// Sanity checks on the engine and the data tables: `npm test`.
// Runs every material × contamination level through the engine and checks
// the invariants the demo relies on. Exits non-zero on the first broken one.
import { containers, ewcCatalogue, materials, routes, service, treatments } from "../lib/data";
import { checkEligibility, defaultDistances, evaluate, suggestContainer } from "../lib/engine";
import { CONTAMINATION_LEVELS, type StreamInput } from "../lib/types";

let failures = 0;
function check(ok: boolean, msg: string) {
  if (!ok) {
    failures++;
    console.error("FAIL", msg);
  }
}

// Every material has its EWC codes in the catalogue and a treatment row per route.
for (const m of materials) {
  for (const code of m.ewc_codes) {
    const e = ewcCatalogue.find((x) => x.code === code);
    check(!!e && e.material === m.id, `${m.id}: EWC ${code} missing or mapped to another material`);
  }
  for (const r of routes) {
    check(
      treatments.some((t) => t.material === m.id && t.route === r.id),
      `${m.id}: no treatment row for ${r.id}`,
    );
  }
  check(containers.some((c) => c.materials.includes(m.id)), `${m.id}: no container offered`);
}

const rowsOut: string[] = [];
for (const m of materials) {
  for (const level of CONTAMINATION_LEVELS) {
    const stream: StreamInput = { material: m.id, contamination: level, ewc: m.ewc_codes[0], volumePerWeekM3: 6 };
    const freq = "weekly";
    const pick = suggestContainer(stream, freq);
    check(!!pick, `${m.id}/${level}: no container fits 6 m³/week`);
    if (!pick) continue;
    const ev = evaluate(stream, {
      containerId: pick.containerId,
      containerCount: pick.count,
      frequencyId: freq,
      distanceKm: defaultDistances(m.id),
    });
    const eligible = ev.routes.filter((r) => r.eligible);
    check(eligible.length > 0, `${m.id}/${level}: no eligible route`);
    const anyCircular = eligible.some((r) => r.circular);
    if (anyCircular) {
      const rec = ev.routes.find((r) => r.route === ev.recommendedRoute);
      check(!!rec?.circular, `${m.id}/${level}: recommended route is not circular`);
    }
    for (const r of eligible) {
      const sum = Math.round(r.price!.lines.reduce((s, l) => s + l.amount, 0) * 100) / 100;
      check(Math.abs(sum - r.price!.totalPerMonth) < 0.011, `${m.id}/${level}/${r.route}: lines don't sum to total`);
      check(!!r.co2, `${m.id}/${level}/${r.route}: no emission factor`);
    }
    for (const r of ev.routes.filter((x) => !x.eligible)) {
      check(r.rules.some((h) => h.effect === "deny"), `${m.id}/${level}/${r.route}: ineligible without a deny reason`);
    }
    rowsOut.push(
      [
        m.id.padEnd(16),
        level.padEnd(6),
        `${pick.count}×${pick.containerId}`.padEnd(16),
        ev.routes
          .map((r) =>
            r.eligible
              ? `${r.route}:€${Math.round(r.price!.totalPerMonth)}/${r.co2?.totalKgPerT}kg`
              : `${r.route}:✗`,
          )
          .join("  "),
      ].join(" "),
    );
  }
}

// Specific rules the demo script relies on.
check(!checkEligibility("cardboard_paper", "landfill", "low").eligible, "LF-2: clean cardboard must not be landfillable");
check(checkEligibility("mixed_cd", "landfill", "low").eligible, "LF-3: mixed C&D may be landfilled");
check(!checkEligibility("scrap_metal", "recovery", "low").eligible, "MT-5: metal has no energy recovery");
check(!checkEligibility("plastic_film", "recycling", "high").eligible, "PF-4: dirty film cannot be recycled");
check(checkEligibility("clean_wood", "reuse", "low").eligible, "WD-1: clean wood can be reused");
check(service.frequencies.length > 0, "frequencies defined");

console.log(rowsOut.join("\n"));
if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll engine checks passed.");
