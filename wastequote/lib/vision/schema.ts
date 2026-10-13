// What the vision step returns. The same schema is sent to Claude as the
// structured-output format and used to validate fixtures and API responses.
import { z } from "zod";
import { ewcCatalogue, materials } from "../data";
import { CONTAMINATION_LEVELS, MATERIAL_IDS } from "../types";

/** Fields below this confidence are flagged for the salesperson to confirm. */
export const CONFIDENCE_THRESHOLD = 0.7;

const EWC_CODES = ewcCatalogue.map((e) => e.code) as [string, ...string[]];

export const VisionSchema = z.object({
  image_ok: z.boolean().describe("false if the photo is too dark, blurry or does not show waste"),
  image_issue: z.string().nullable().describe("what is wrong with the photo, or null"),
  summary: z.string().describe("one plain sentence describing the waste, for the quote"),
  materials_seen: z
    .array(
      z.object({
        stream: z.enum([...MATERIAL_IDS, "other"]),
        share_pct: z.number().describe("estimated share of visible volume, 0-100"),
        evidence: z.string().describe("what in the photo shows this material"),
      }),
    )
    .describe("every material visible, largest share first"),
  primary_stream: z.object({
    value: z.enum(MATERIAL_IDS),
    confidence: z.number().describe("0-1"),
    rationale: z.string(),
  }),
  contamination: z.object({
    value: z.enum(CONTAMINATION_LEVELS),
    confidence: z.number().describe("0-1"),
    contaminants: z.array(z.string()).describe("visible non-target items, e.g. 'plastic film', 'food residue'"),
    rationale: z.string(),
  }),
  volume_m3: z.object({
    value: z.number().describe("loose volume of waste visible in the photo, in m³"),
    confidence: z.number().describe("0-1"),
    basis: z.string().describe("the reference object and reasoning used, e.g. '1,100 L bin about 80% full'"),
  }),
  ewc_code: z.object({
    value: z.enum(EWC_CODES),
    confidence: z.number().describe("0-1"),
    rationale: z.string(),
  }),
  hazard_flags: z.array(z.string()).describe("anything that may be hazardous and needs a check before collection; empty if none"),
  segregation_tip: z
    .string()
    .nullable()
    .describe("if separating one material out would unlock a better route, say which; otherwise null"),
});

export type VisionResult = z.infer<typeof VisionSchema>;

/**
 * What the model is asked to return. Same fields as VisionSchema but with
 * plain strings where VisionSchema has enums: the SDK sends enum lists to
 * the API as descriptions, so a near-miss ("15 01 01 " or "Cardboard")
 * must be normalised by us rather than fail validation mid-demo.
 */
export const VisionWireSchema = z.object({
  image_ok: z.boolean().describe("false if the photo is too dark, blurry or does not show waste"),
  image_issue: z.string().nullable().describe("what is wrong with the photo, or null"),
  summary: z.string().describe("one plain sentence describing the waste, for the quote"),
  materials_seen: z
    .array(
      z.object({
        stream: z.string().describe(`one of: ${[...MATERIAL_IDS, "other"].join(", ")}`),
        share_pct: z.number().describe("estimated share of visible volume, 0-100"),
        evidence: z.string().describe("what in the photo shows this material"),
      }),
    )
    .describe("every material visible, largest share first"),
  primary_stream: z.object({
    value: z.string().describe(`one of: ${MATERIAL_IDS.join(", ")}`),
    confidence: z.number().describe("0-1"),
    rationale: z.string(),
  }),
  contamination: z.object({
    value: z.string().describe("one of: low, medium, high"),
    confidence: z.number().describe("0-1"),
    contaminants: z.array(z.string()).describe("visible non-target items, e.g. 'plastic film', 'food residue'"),
    rationale: z.string(),
  }),
  volume_m3: z.object({
    value: z.number().describe("loose volume of waste visible in the photo, in m³"),
    confidence: z.number().describe("0-1"),
    basis: z.string().describe("the reference object and reasoning used, e.g. '1,100 L bin about 80% full'"),
  }),
  ewc_code: z.object({
    value: z.string().describe(`one of: ${EWC_CODES.join(", ")} (format 'NN NN NN')`),
    confidence: z.number().describe("0-1"),
    rationale: z.string(),
  }),
  hazard_flags: z.array(z.string()).describe("anything that may be hazardous and needs a check before collection; empty if none"),
  segregation_tip: z
    .string()
    .nullable()
    .describe("if separating one material out would unlock a better route, say which; otherwise null"),
});
export type VisionWire = z.infer<typeof VisionWireSchema>;

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n > 1 ? n / 100 : n)) : 0);
const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z]+/g, "_").replace(/^_|_$/g, "");

function toMaterial(s: string): (typeof MATERIAL_IDS)[number] | null {
  const k = slug(s);
  const direct = MATERIAL_IDS.find((m) => m === k);
  if (direct) return direct;
  const byName = materials.find((m) => slug(m.name) === k || k.includes(m.id.split("_")[0]));
  return byName?.id ?? null;
}

/** Map the model's loose output onto VisionSchema. Anything off-list drops to confidence 0 so the UI flags it. */
export function normalizeVision(w: VisionWire): VisionResult {
  const primary = toMaterial(w.primary_stream.value);
  const level = (["low", "medium", "high"] as const).find((l) => l === w.contamination.value.trim().toLowerCase());
  const code = w.ewc_code.value.replace(/\D/g, "").replace(/^(\d{2})(\d{2})(\d{2})$/, "$1 $2 $3");
  const ewcOk = EWC_CODES.includes(code);
  const fallbackMaterial = primary ?? "mixed_cd";
  return VisionSchema.parse({
    image_ok: w.image_ok,
    image_issue: w.image_issue,
    summary: w.summary,
    materials_seen: w.materials_seen.map((m) => ({
      stream: toMaterial(m.stream) ?? "other",
      share_pct: Math.max(0, Math.min(100, m.share_pct)),
      evidence: m.evidence,
    })),
    primary_stream: {
      value: fallbackMaterial,
      confidence: primary ? clamp01(w.primary_stream.confidence) : 0,
      rationale: primary ? w.primary_stream.rationale : `Model answered "${w.primary_stream.value}", which is not a known stream.`,
    },
    contamination: {
      value: level ?? "medium",
      confidence: level ? clamp01(w.contamination.confidence) : 0,
      contaminants: w.contamination.contaminants,
      rationale: w.contamination.rationale,
    },
    volume_m3: {
      value: Number.isFinite(w.volume_m3.value) && w.volume_m3.value > 0 ? w.volume_m3.value : 1,
      confidence: clamp01(w.volume_m3.confidence),
      basis: w.volume_m3.basis,
    },
    ewc_code: {
      value: ewcOk ? code : materials.find((m) => m.id === fallbackMaterial)!.ewc_codes[0],
      confidence: ewcOk ? clamp01(w.ewc_code.confidence) : 0,
      rationale: ewcOk ? w.ewc_code.rationale : `Model answered "${w.ewc_code.value}", which is not in the catalogue.`,
    },
    hazard_flags: w.hazard_flags,
    segregation_tip: w.segregation_tip,
  });
}

export type VisionMode = "sailsrep" | "claude" | "stub" | "stub_fallback";

export interface VisionResponse {
  mode: VisionMode;
  model: string | null;
  ms: number;
  result: VisionResult;
  /** Why the stub was used, when it was. */
  note: string | null;
  /** Sailsrep configuration the photo was classified on (the quote keeps using it). */
  configurationId?: string | null;
  /** The Sailsrep assistant's reasons for the selections it made. */
  agentNotes?: string[];
}

export function buildSystemPrompt() {
  const streams = materials
    .map(
      (m) =>
        `- ${m.id} (${m.name}: ${m.examples})\n` +
        `  contamination low: ${m.contamination.low}\n` +
        `  contamination medium: ${m.contamination.medium}\n` +
        `  contamination high: ${m.contamination.high}\n` +
        `  EWC codes: ${m.ewc_codes.join(", ")}`,
    )
    .join("\n");
  const ewc = ewcCatalogue.map((e) => `- ${e.code} ${e.description} (stream: ${e.material})`).join("\n");
  return `You are the vision step in Selinsight, a quoting tool used by a waste-management company's sales team. A salesperson photographs a customer's waste (a bin, skip, container or pile at a factory or construction site). You classify it so the quote can be configured. A deterministic rules engine, not you, decides treatment routes and prices, and the salesperson confirms or corrects every field you return.

Classify into exactly one primary stream from this list, and grade contamination against that stream's definitions:
${streams}

Suggest the European Waste Catalogue (List of Waste) code from this list only:
${ewc}
Pick by origin when the photo shows it: packaging (chapter 15) for boxes, wrap and pallets from a factory; construction (chapter 17) for site waste; production residues (chapters 02, 03, 12) when it is clearly process waste; municipal (chapter 20) for canteen or office waste.

Volume: estimate the loose volume of waste you can see, in m³. Anchor on reference objects with known sizes: 240 L and 1,100 L wheelie bins, 6-8 m³ skips (about 3.7 m × 1.8 m), 20-40 m³ roll-off containers (about 6 m long), a euro pallet (1.2 × 0.8 m), a person (about 1.75 m), a door. Say which reference you used. Without any reference, give your best estimate with low confidence.

Confidence is 0-1 per field and must be honest: below 0.7 means the salesperson should check it. Use below 0.7 when the material is partly hidden, the photo is ambiguous between two streams, contamination cannot be judged from the surface, or there is no size reference. If the photo shows no waste, set image_ok false.

Flag anything possibly hazardous (asbestos-like sheeting, batteries, gas cylinders, paint or chemical containers, oily liquids, sharps). Keep text short and concrete; it is shown to the salesperson and may go on the customer's quote.`;
}
