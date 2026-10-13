// Loads and validates the editable data tables in /data. Anything that
// fails validation throws at import time, so a bad edit shows up on the
// first page load instead of as a wrong number in a quote.
import { z } from "zod";
import { CONTAMINATION_LEVELS, MATERIAL_IDS, ROUTE_IDS } from "./types";

import materialsJson from "../data/materials.json";
import routesJson from "../data/routes.json";
import ewcJson from "../data/ewc.json";
import treatmentsJson from "../data/treatments.json";
import eligibilityJson from "../data/eligibility.json";
import containersJson from "../data/containers.json";
import transportJson from "../data/transport.json";
import pricingJson from "../data/pricing.json";
import taxesJson from "../data/taxes.json";
import emissionsJson from "../data/emission-factors.json";
import serviceJson from "../data/service.json";
import companyJson from "../data/company.json";

const materialId = z.enum(MATERIAL_IDS);
const routeId = z.enum(ROUTE_IDS);
const level = z.enum(CONTAMINATION_LEVELS);

const provenance = {
  source: z.string().min(1),
  source_url: z.string().url().nullish(),
  is_sample: z.boolean(),
  notes: z.string().nullish(),
};

const Material = z.object({
  id: materialId,
  name: z.string(),
  examples: z.string(),
  ewc_codes: z.array(z.string()).min(1),
  contamination: z.object({ low: z.string(), medium: z.string(), high: z.string() }),
  bulk_density_t_per_m3: z.number().positive(),
  ...provenance,
});

const Route = z.object({
  id: routeId,
  name: z.string(),
  hierarchy_rank: z.number().int(),
  hierarchy_level: z.string(),
  circular: z.boolean(),
  description: z.string(),
  ...provenance,
});

const Ewc = z.object({
  code: z.string().regex(/^\d{2} \d{2} \d{2}$/),
  description: z.string(),
  material: materialId,
  chapter: z.string(),
  hazardous: z.boolean(),
  ...provenance,
});

const Treatment = z.object({
  material: materialId,
  route: routeId,
  treatment: z.string(),
  facility: z.string(),
  default_distance_km: z.number().nonnegative(),
  rd_code: z.string(),
  ...provenance,
});

const Rule = z.object({
  id: z.string(),
  material: z.union([materialId, z.literal("*"), z.array(materialId)]),
  route: z.union([routeId, z.literal("*")]),
  contamination: z.array(level).min(1),
  effect: z.enum(["allow", "deny", "surcharge", "warn"]),
  text: z.string(),
  ...provenance,
});

const Container = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  size_m3: z.number().positive(),
  rent_eur_per_month: z.number().nonnegative(),
  lift_fee_eur: z.number().nonnegative(),
  vehicle: z.string(),
  max_payload_t: z.number().positive(),
  compaction_ratio: z.number().positive(),
  materials: z.array(materialId),
  ...provenance,
});

const Vehicle = z.object({
  id: z.string(),
  name: z.string(),
  eur_per_km: z.number().nonnegative(),
  distance_share: z.number().min(0).max(1),
  kg_co2e_per_km: z.number().nonnegative(),
  ...provenance,
});

const PerTonne = z.object({
  material: materialId,
  route: routeId,
  eur_per_t: z.number(),
  ...provenance,
});

const LevelFactors = z.object({
  low: z.number(),
  medium: z.number(),
  high: z.number(),
  ...provenance,
});

const Pricing = z.object({
  gate_fees: z.array(PerTonne),
  rebates: z.array(PerTonne),
  contamination_gate_fee_surcharge: LevelFactors,
  contamination_rebate_factor: LevelFactors,
});

const Tax = z.object({
  id: z.string(),
  route: routeId,
  name: z.string(),
  eur_per_t: z.number().nonnegative(),
  ...provenance,
});

const EmissionFactor = z.object({
  material: materialId,
  route: routeId,
  direct_kg_co2e_per_t: z.number(),
  net_kg_co2e_per_t: z.number(),
  direct_source: z.string().nullish(),
  direct_source_url: z.string().url().nullish(),
  net_source: z.string().nullish(),
  net_source_url: z.string().url().nullish(),
  ...provenance,
});

const Service = z.object({
  weeks_per_month: z.number().positive(),
  fill_factor: z.object({ value: z.number().positive().max(1), ...provenance }),
  frequencies: z.array(
    z.object({ id: z.string(), name: z.string(), lifts_per_week: z.number().positive() }),
  ),
});

const Company = z.object({
  seller: z.object({
    name: z.string(),
    address: z.string(),
    phone: z.string(),
    email: z.string(),
    carrier_registration: z.string(),
    waste_manager_registration: z.string(),
    is_sample: z.boolean(),
  }),
  demo_customer: z.object({
    company: z.string(),
    site: z.string(),
    contact: z.string(),
    sic_or_nace: z.string(),
    is_sample: z.boolean(),
  }),
  quote_terms: z.object({ valid_days: z.number(), currency: z.string(), vat_note: z.string() }),
});

export type Material = z.infer<typeof Material>;
export type Route = z.infer<typeof Route>;
export type EwcEntry = z.infer<typeof Ewc>;
export type Treatment = z.infer<typeof Treatment>;
export type Rule = z.infer<typeof Rule>;
export type Container = z.infer<typeof Container>;
export type Vehicle = z.infer<typeof Vehicle>;
export type TaxRow = z.infer<typeof Tax>;
export type EmissionFactorRow = z.infer<typeof EmissionFactor>;
export type Frequency = z.infer<typeof Service>["frequencies"][number];

function rows<T extends z.ZodTypeAny>(schema: T, json: unknown, table: string): z.infer<T>[] {
  const parsed = z.object({ rows: z.array(schema) }).safeParse(json);
  if (!parsed.success) throw new Error(`data/${table}: ${parsed.error.message}`);
  return parsed.data.rows;
}

function one<T extends z.ZodTypeAny>(schema: T, json: unknown, table: string): z.infer<T> {
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new Error(`data/${table}: ${parsed.error.message}`);
  return parsed.data;
}

export const materials = rows(Material, materialsJson, "materials.json");
export const routes = rows(Route, routesJson, "routes.json").sort(
  (a, b) => a.hierarchy_rank - b.hierarchy_rank,
);
export const ewcCatalogue = rows(Ewc, ewcJson, "ewc.json");
export const treatments = rows(Treatment, treatmentsJson, "treatments.json");
export const rules = rows(Rule, eligibilityJson, "eligibility.json");
export const containers = rows(Container, containersJson, "containers.json");
export const vehicles = rows(Vehicle, transportJson, "transport.json");
export const pricing = one(Pricing, pricingJson, "pricing.json");
export const taxes = rows(Tax, taxesJson, "taxes.json");
export const emissionFactors = rows(EmissionFactor, emissionsJson, "emission-factors.json");
export const service = one(Service, serviceJson, "service.json");
export const company = one(Company, companyJson, "company.json");

export const tableMeta = {
  materials: materialsJson._meta,
  routes: routesJson._meta,
  ewc: ewcJson._meta,
  treatments: treatmentsJson._meta,
  eligibility: eligibilityJson._meta,
  containers: containersJson._meta,
  transport: transportJson._meta,
  pricing: pricingJson._meta,
  taxes: taxesJson._meta,
  emission_factors: emissionsJson._meta,
  service: serviceJson._meta,
} as const;

export const materialById = (id: string) => materials.find((m) => m.id === id);
export const routeById = (id: string) => routes.find((r) => r.id === id);
export const containerById = (id: string) => containers.find((c) => c.id === id);
export const frequencyById = (id: string) => service.frequencies.find((f) => f.id === id);
export const ewcByCode = (code: string) => ewcCatalogue.find((e) => e.code === code);
