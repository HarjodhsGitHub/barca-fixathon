// Shared domain types. The data tables in /data are validated against the
// zod schemas in lib/data.ts; these are the shapes the engine and UI use.

export const MATERIAL_IDS = [
  "cardboard_paper",
  "clean_wood",
  "mixed_cd",
  "scrap_metal",
  "plastic_film",
  "organic_food",
] as const;
export type MaterialId = (typeof MATERIAL_IDS)[number];

export const ROUTE_IDS = ["reuse", "recycling", "recovery", "landfill"] as const;
export type RouteId = (typeof ROUTE_IDS)[number];

export const CONTAMINATION_LEVELS = ["low", "medium", "high"] as const;
export type Contamination = (typeof CONTAMINATION_LEVELS)[number];

/** Every number in /data carries where it came from. */
export interface Provenance {
  source: string;
  source_url?: string | null;
  is_sample: boolean;
  notes?: string | null;
}

/** A pointer from a computed number back to the table row it used. */
export interface Citation extends Provenance {
  table: string;
  row: string;
  label: string;
  value: number | string;
  unit?: string;
}

export interface StreamInput {
  material: MaterialId;
  contamination: Contamination;
  ewc: string;
  /** m³ of loose waste generated per week at the site. */
  volumePerWeekM3: number;
}

export interface ServiceConfig {
  containerId: string;
  containerCount: number;
  frequencyId: string;
  /** One-way km from the site to each route's treatment facility. */
  distanceKm: Partial<Record<RouteId, number>>;
}

export interface RuleHit {
  ruleId: string;
  effect: "allow" | "deny" | "surcharge" | "warn";
  text: string;
  source: string;
  source_url?: string | null;
  is_sample: boolean;
}

export interface PriceLine {
  key: "rental" | "transport" | "gate_fee" | "tax" | "rebate";
  label: string;
  /** EUR per month. Rebates are negative. */
  amount: number;
  formula: string;
  citations: Citation[];
}

export interface PriceBreakdown {
  lines: PriceLine[];
  totalPerMonth: number;
  perTonne: number;
}

export interface Co2Breakdown {
  /** kg CO2e per tonne at the facility, reporting basis (no credits). */
  directKgPerT: number;
  /** kg CO2e per tonne incl. avoided virgin production / energy (lifecycle). */
  netKgPerT: number;
  transportKgPerMonth: number;
  transportKgPerT: number;
  /** net + transport, per tonne: the headline number. */
  totalKgPerT: number;
  totalKgPerMonth: number;
  citations: Citation[];
}

export interface Capacity {
  liftsPerMonth: number;
  volumePerMonthM3: number;
  capacityPerMonthM3: number;
  utilisation: number;
  tonnesPerMonth: number;
  tonnesPerLift: number;
  warnings: string[];
  citations: Citation[];
}

export interface RouteResult {
  route: RouteId;
  routeName: string;
  treatmentName: string;
  facilityName: string;
  rdCode: string;
  hierarchyRank: number;
  circular: boolean;
  eligible: boolean;
  rules: RuleHit[];
  price: PriceBreakdown | null;
  co2: Co2Breakdown | null;
  usesSampleData: boolean;
  tags: Array<"circular_choice" | "lowest_cost" | "lowest_co2">;
}

export interface Evaluation {
  stream: StreamInput;
  config: ServiceConfig;
  capacity: Capacity;
  routes: RouteResult[];
  recommendedRoute: RouteId | null;
  /** The cheapest eligible route, for the "circular premium" comparison. */
  cheapestRoute: RouteId | null;
}
