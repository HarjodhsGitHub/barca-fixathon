// Generates the Sailsrep CPQ model from the same /data tables the app uses,
// so the tenant and the app can never disagree about which routes and
// containers are valid. `npm run sailsrep:export` writes
//   sailsrep/wastequote-sailsrep.json  (Sailsrep import format)
//   sailsrep/testfall.json             (5 valid + 5 invalid configurations)
// and fails if the model breaks any of the validator rules below.
import { writeFileSync } from "node:fs";
import path from "node:path";
import { containers, materials, pricing, routes, service, taxes, treatments } from "../lib/data";
import { checkEligibility } from "../lib/engine";
import { CONTAMINATION_LEVELS, type Contamination, type MaterialId, type RouteId } from "../lib/types";
import { SAILSREP_IDS as ID } from "../lib/sailsrep-ids";

const now = new Date().toISOString();
const OUT = path.join(process.cwd(), "sailsrep");

type Dep = { moduleId: string; allowedVariants: string[]; excludedVariants: string[] };
interface Variant {
  id: string;
  moduleId: string;
  name: string;
  description: string;
  longDescription: string;
  sku: string | null;
  includeInBom: boolean;
  defaultPrice: number | null;
  aggregatePriceToParent: false;
  quantity: "1";
  priceFactor: null;
  priceType: "capex";
  imgLink: null;
  smallImage: null;
  activatesModules: [];
  sortOrder: number;
  reviewed: false;
  reviewNote: null;
  dependencies: Dep[];
  conditions: [];
  constraintStatus: "available";
  constraintClass: "constraint-available";
  constraintLabel: "Available";
}

function variant(
  moduleId: string,
  id: string,
  sortOrder: number,
  v: { name: string; description: string; longDescription: string; sku?: string | null; price?: number | null; feature?: boolean },
): Variant {
  return {
    id,
    moduleId,
    name: v.name,
    description: v.description,
    longDescription: v.longDescription,
    sku: v.feature ? null : (v.sku ?? null),
    includeInBom: !v.feature,
    defaultPrice: v.feature ? null : (v.price ?? 0),
    aggregatePriceToParent: false,
    quantity: "1",
    priceFactor: null,
    priceType: "capex",
    imgLink: null,
    smallImage: null,
    activatesModules: [],
    sortOrder,
    reviewed: false,
    reviewNote: null,
    dependencies: [],
    conditions: [],
    constraintStatus: "available",
    constraintClass: "constraint-available",
    constraintLabel: "Available",
  };
}

function module(
  id: string,
  m: { name: string; question: string; description: string; longDescription: string; feature: boolean; displayOrder: number },
  variants: Variant[],
) {
  return {
    id,
    name: m.name,
    question: m.question,
    description: m.description,
    longDescription: m.longDescription,
    moduleType: m.feature ? "feature" : "bom",
    visible: true,
    mandatory: true,
    autoSelect: false,
    step: null,
    stepNumber: null,
    displayOrder: m.displayOrder,
    parent: null,
    useVariantsFrom: null,
    inputType: null,
    minValue: null,
    maxValue: null,
    expression: null,
    isBigDataModule: false,
    isSleeping: false,
    reviewed: false,
    reviewNote: null,
    createdAt: now,
    updatedAt: now,
    variants,
    type: m.feature ? "string" : "object",
    minValueCurrent: null,
    maxValueCurrent: null,
    computedValue: null,
  };
}

const eurT = (n: number) => `€${n}/t`;

// --- route variants: one per material × route that is ever eligible
const routeVariants: Variant[] = [];
const routeVariantOf = new Map<string, string>(); // "material/route" -> variant id
let sort = 10;
for (const m of materials) {
  for (const r of routes) {
    const everEligible = CONTAMINATION_LEVELS.some((l) => checkEligibility(m.id, r.id, l).eligible);
    if (!everEligible) continue;
    const t = treatments.find((x) => x.material === m.id && x.route === r.id)!;
    const gate = pricing.gate_fees.find((g) => g.material === m.id && g.route === r.id);
    const rebate = pricing.rebates.find((g) => g.material === m.id && g.route === r.id);
    const tax = taxes.filter((x) => x.route === r.id);
    const levels = CONTAMINATION_LEVELS.filter((l) => checkEligibility(m.id, r.id, l).eligible);
    const id = ID.routeVariant(m.id, r.id);
    routeVariantOf.set(`${m.id}/${r.id}`, id);
    routeVariants.push(
      variant(ID.route, id, sort, {
        name: `${m.name}: ${r.name.toLowerCase()} (${t.treatment.toLowerCase()})`,
        description: `${r.hierarchy_level}. ${t.treatment}, operation ${t.rd_code}.`,
        longDescription: [
          `## ${r.name}: ${t.treatment}`,
          r.description,
          "",
          `- Waste hierarchy: ${r.hierarchy_level}${r.circular ? " (circular)" : ""}`,
          `- Operation code: ${t.rd_code}`,
          `- Allowed at contamination: ${levels.join(", ")}`,
          gate ? `- Gate fee: ${eurT(gate.eur_per_t)}${gate.is_sample ? " (indicative)" : ""}` : null,
          rebate ? `- Material rebate: ${eurT(rebate.eur_per_t)} at clean grade${rebate.is_sample ? " (indicative)" : ""}` : null,
          ...tax.map((x) => `- ${x.name}: ${eurT(x.eur_per_t)}`),
          "",
          "Priced per tonne in WasteQuote from the estimated weight, so the list price here is 0.",
        ]
          .filter((x) => x !== null)
          .join("\n"),
        sku: `WQ-ROUTE-${m.id.toUpperCase()}-${r.id.toUpperCase()}`,
        price: 0,
      }),
    );
    sort += 10;
  }
}

// --- container variants
const containerVariants = containers.map((c, i) =>
  variant(ID.container, ID.containerVariant(c.id), (i + 1) * 10, {
    name: c.name,
    description: `${c.size_m3} m³, rented per month. Lift fee €${c.lift_fee_eur} per emptying.`,
    longDescription: [
      `## ${c.name}`,
      `- Size: ${c.size_m3} m³${c.compaction_ratio > 1 ? `, compacts about ${c.compaction_ratio}:1` : ""}`,
      `- Max payload: ${c.max_payload_t} t per lift`,
      `- Rent: €${c.rent_eur_per_month} per month (indicative)`,
      `- Lift fee: €${c.lift_fee_eur} per emptying (indicative)`,
      `- Suits: ${c.materials.map((id) => materials.find((m) => m.id === id)!.name.toLowerCase()).join(", ")}`,
    ].join("\n"),
    sku: `WQ-CONT-${c.id.toUpperCase()}`,
    price: c.rent_eur_per_month,
  }),
);

// --- frequency variants
const frequencyVariants = service.frequencies.map((f, i) =>
  variant(ID.frequency, ID.frequencyVariant(f.id), (i + 1) * 10, {
    name: f.name,
    description: `${Math.round(f.lifts_per_week * service.weeks_per_month * 100) / 100} lifts per container per month.`,
    longDescription: `## ${f.name}\nThe lift fee and transport are charged per lift in WasteQuote, from the container's lift fee and the distance to the facility.`,
    sku: `WQ-FREQ-${f.id.toUpperCase()}`,
    price: 0,
  }),
);

// --- feature: material
const materialVariants = materials.map((m, i) => {
  const v = variant(ID.material, ID.materialVariant(m.id), (i + 1) * 10, {
    name: m.name,
    description: `For example ${m.examples}. EWC ${m.ewc_codes.join(", ")}.`,
    longDescription: [
      `## ${m.name}`,
      `For example ${m.examples}.`,
      "",
      `- EWC codes: ${m.ewc_codes.join(", ")}`,
      `- Low contamination: ${m.contamination.low}`,
      `- Medium contamination: ${m.contamination.medium}`,
      `- High contamination: ${m.contamination.high}`,
    ].join("\n"),
    feature: true,
  });
  v.dependencies = [
    {
      moduleId: ID.route,
      allowedVariants: routes.map((r) => routeVariantOf.get(`${m.id}/${r.id}`)).filter((x): x is string => !!x),
      excludedVariants: [],
    },
    {
      moduleId: ID.container,
      allowedVariants: containers.filter((c) => c.materials.includes(m.id)).map((c) => ID.containerVariant(c.id)),
      excludedVariants: [],
    },
  ];
  return v;
});

// --- feature: contamination
const levelText: Record<Contamination, string> = {
  low: "Clean and separated. Fits the material's best route.",
  medium: "Some other material mixed in. Recycling may carry a surcharge.",
  high: "Heavily mixed, wet or soiled. Some routes are closed.",
};
const contaminationVariants = CONTAMINATION_LEVELS.map((l, i) => {
  const v = variant(ID.contamination, ID.contaminationVariant(l), (i + 1) * 10, {
    name: l[0].toUpperCase() + l.slice(1),
    description: levelText[l],
    longDescription: `## ${l[0].toUpperCase() + l.slice(1)} contamination\n${levelText[l]} Each material defines the level in its own terms.`,
    feature: true,
  });
  const allowed: string[] = [];
  for (const m of materials) {
    for (const r of routes) {
      const id = routeVariantOf.get(`${m.id}/${r.id}`);
      if (id && checkEligibility(m.id, r.id, l).eligible) allowed.push(id);
    }
  }
  v.dependencies = [{ moduleId: ID.route, allowedVariants: allowed, excludedVariants: [] }];
  return v;
});

const modules = [
  module(
    ID.material,
    {
      name: "Waste stream",
      question: "Which waste stream is it?",
      description: "The material in the container. WasteQuote suggests it from a photo.",
      longDescription: "## Waste stream\nThe vision step in WasteQuote suggests the stream from a photo; the salesperson confirms it.",
      feature: true,
      displayOrder: 5,
    },
    materialVariants,
  ),
  module(
    ID.contamination,
    {
      name: "Contamination",
      question: "How clean is the stream?",
      description: "How much other material is mixed in. Decides which routes are open.",
      longDescription: "## Contamination\nGraded low, medium or high against the material's own definitions.",
      feature: true,
      displayOrder: 6,
    },
    contaminationVariants,
  ),
  module(
    ID.route,
    {
      name: "Treatment route",
      question: "Where should the waste go?",
      description: "Reuse, recycling, recovery or landfill: the EU waste hierarchy, circular first.",
      longDescription:
        "## Treatment route\nOnly routes allowed for the stream and its contamination are open. The rules come from the WasteQuote eligibility table, generated into this model.",
      feature: false,
      displayOrder: 8,
    },
    routeVariants,
  ),
  module(
    ID.container,
    {
      name: "Container",
      question: "Which container?",
      description: "Rented per month. Only containers offered for the stream are open.",
      longDescription: "## Container\nRent per month is the list price here. Lift fees and transport are priced per lift in WasteQuote.",
      feature: false,
      displayOrder: 10,
    },
    containerVariants,
  ),
  module(
    ID.frequency,
    {
      name: "Pickup frequency",
      question: "How often should we empty it?",
      description: "How often each container is lifted.",
      longDescription: "## Pickup frequency\nSets the number of lifts per month.",
      feature: false,
      displayOrder: 20,
    },
    frequencyVariants,
  ),
];

// ------------------------------------------------------------------ validate
const errors: string[] = [];
const allVariantIds = new Set<string>();
for (const mod of modules) {
  for (const v of mod.variants) {
    if (allVariantIds.has(v.id)) errors.push(`duplicate variant id ${v.id}`);
    allVariantIds.add(v.id);
    if (mod.moduleType === "feature" && (v.sku !== null || v.defaultPrice !== null)) errors.push(`feature variant ${v.id} has sku/price`);
    const targets = new Set<string>();
    for (const d of v.dependencies) {
      if (targets.has(d.moduleId)) errors.push(`${v.id}: two dependencies on ${d.moduleId}`);
      targets.add(d.moduleId);
      if (d.allowedVariants.length && d.excludedVariants.length) errors.push(`${v.id}: allowed and excluded together`);
      if (!modules.some((m) => m.id === d.moduleId)) errors.push(`${v.id}: unknown module ${d.moduleId}`);
    }
  }
}
for (const mod of modules) for (const v of mod.variants) for (const d of v.dependencies) for (const x of [...d.allowedVariants, ...d.excludedVariants]) if (!allVariantIds.has(x)) errors.push(`${v.id}: unknown variant ${x}`);
if (new Set(modules.map((m) => m.displayOrder)).size !== modules.length) errors.push("displayOrder not unique");
// Every pair of answers to the two feature questions leaves at least one route and container.
for (const mv of materialVariants) {
  for (const cv of contaminationVariants) {
    const a = mv.dependencies.find((d) => d.moduleId === ID.route)!.allowedVariants;
    const b = new Set(cv.dependencies[0].allowedVariants);
    if (!a.some((x) => b.has(x))) errors.push(`no route left for ${mv.name} × ${cv.name}`);
  }
  if (!mv.dependencies.find((d) => d.moduleId === ID.container)!.allowedVariants.length) errors.push(`no container for ${mv.name}`);
}
// The intersection reproduces the app's eligibility table exactly.
for (const m of materials) {
  for (const l of CONTAMINATION_LEVELS) {
    const a = new Set(materialVariants.find((v) => v.id === ID.materialVariant(m.id))!.dependencies[0].allowedVariants);
    const b = new Set(contaminationVariants.find((v) => v.id === ID.contaminationVariant(l))!.dependencies[0].allowedVariants);
    for (const r of routes) {
      const id = routeVariantOf.get(`${m.id}/${r.id}`);
      const inModel = !!id && a.has(id) && b.has(id);
      if (inModel !== checkEligibility(m.id, r.id, l).eligible) errors.push(`mismatch ${m.id}/${r.id}/${l}`);
    }
  }
}
// A reachable route variant must also be reachable by at least one level.
for (const v of routeVariants) {
  if (!contaminationVariants.some((c) => c.dependencies[0].allowedVariants.includes(v.id))) errors.push(`unreachable ${v.id}`);
}

if (errors.length) {
  console.error("Sailsrep model invalid:\n  " + errors.join("\n  "));
  process.exit(1);
}

const doc = { modules: Object.fromEntries(modules.map((m) => [m.id, m])), currency: "EUR" };
writeFileSync(path.join(OUT, "wastequote-sailsrep.json"), JSON.stringify(doc, null, 2) + "\n");

// ---------------------------------------------------------------- test cases
const sel = (m: MaterialId, l: Contamination, r: RouteId, c: string, f: string) => ({
  [ID.material]: ID.materialVariant(m),
  [ID.contamination]: ID.contaminationVariant(l),
  [ID.route]: routeVariantOf.get(`${m}/${r}`)!,
  [ID.container]: ID.containerVariant(c),
  [ID.frequency]: ID.frequencyVariant(f),
});
const testfall = {
  giltiga: [
    { namn: "Clean cardboard to recycling, 20 m³ roll-off, weekly", val: sel("cardboard_paper", "low", "recycling", "roro_20", "weekly") },
    { namn: "Clean pallets to reuse, 6 m³ skip, every 2 weeks", val: sel("clean_wood", "low", "reuse", "skip_6", "fortnightly") },
    { namn: "Mixed site waste to C&D recycling, 8 m³ skip, weekly", val: sel("mixed_cd", "medium", "recycling", "skip_8_lid", "weekly") },
    { namn: "Steel offcuts to reuse, 20 m³ roll-off, every 4 weeks", val: sel("scrap_metal", "low", "reuse", "roro_20", "four_weekly") },
    { namn: "Canteen food waste to anaerobic digestion, 240 L bins, twice a week", val: sel("organic_food", "low", "recycling", "bin_240", "twice_weekly") },
  ],
  ogiltiga: [
    { namn: "Wet cardboard to recycling", val: sel("cardboard_paper", "high", "recycling", "roro_20", "weekly"), regel: "CB-4: wet or food-soiled cardboard is rejected by paper mills" },
    { namn: "Clean cardboard to landfill", val: sel("cardboard_paper", "low", "landfill", "roro_20", "weekly"), regel: "LF-2: separately collected recyclables may not be landfilled" },
    { namn: "Dirty film to recycling", val: sel("plastic_film", "high", "recycling", "roro_20", "weekly"), regel: "PF-4: soiled film is rejected by film recyclers" },
    {
      namn: "Food waste in an open skip",
      val: { ...sel("organic_food", "low", "recycling", "bin_240", "weekly"), [ID.container]: ID.containerVariant("skip_6") },
      regel: "Container table: a 6 m³ open skip is not offered for food waste",
    },
    {
      namn: "Scrap metal sent down the cardboard recycling route",
      val: { ...sel("scrap_metal", "low", "recycling", "roro_20", "weekly"), [ID.route]: routeVariantOf.get("cardboard_paper/recycling")! },
      regel: "Waste stream allows only its own routes",
    },
  ],
};
writeFileSync(path.join(OUT, "testfall.json"), JSON.stringify(testfall, null, 2) + "\n");

console.log(
  `OK: ${modules.length} modules, ${allVariantIds.size} variants, ` +
    `${modules.flatMap((m) => m.variants).reduce((s, v) => s + v.dependencies.length, 0)} dependencies -> sailsrep/wastequote-sailsrep.json`,
);
