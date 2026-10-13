// The accepted-quote record and how it is built from a client submission.
// The server recomputes the evaluation from the inputs: numbers shown in the
// browser are never trusted as-is.
import { z } from "zod";
import { company, ewcByCode, materialById } from "./data";
import { evaluate } from "./engine";
import { CONTAMINATION_LEVELS, MATERIAL_IDS, ROUTE_IDS, type Evaluation, type RouteId } from "./types";
import { VisionSchema, type VisionMode } from "./vision/schema";

export const QuoteSubmission = z.object({
  customer: z.object({
    company: z.string().min(1),
    site: z.string().min(1),
    contact: z.string().default(""),
    email: z.string().default(""),
    nace: z.string().default(""),
  }),
  vision: z.object({
    mode: z.enum(["claude", "stub", "stub_fallback"]),
    model: z.string().nullable(),
    ms: z.number(),
    result: VisionSchema,
  }),
  stream: z.object({
    material: z.enum(MATERIAL_IDS),
    contamination: z.enum(CONTAMINATION_LEVELS),
    ewc: z.string(),
    volumePerWeekM3: z.number().positive(),
  }),
  config: z.object({
    containerId: z.string(),
    containerCount: z.number().int().min(1).max(20),
    frequencyId: z.string(),
    distanceKm: z.record(z.enum(ROUTE_IDS), z.number().nonnegative()),
  }),
  chosenRoute: z.enum(ROUTE_IDS),
  /** Fields the salesperson confirmed or changed after the vision step. */
  confirmedFields: z.array(z.string()).default([]),
  photo: z.object({ dataUrl: z.string().startsWith("data:image/"), filename: z.string().nullish() }),
});
export type QuoteSubmission = z.infer<typeof QuoteSubmission>;

export interface FieldAudit {
  field: string;
  ai: string;
  aiConfidence: number;
  final: string;
  changed: boolean;
  confirmed: boolean;
}

export interface QuoteRecord {
  id: string;
  number: string;
  createdAt: string;
  validUntil: string;
  customer: QuoteSubmission["customer"];
  vision: { mode: VisionMode; model: string | null; ms: number; result: QuoteSubmission["vision"]["result"] };
  audit: FieldAudit[];
  evaluation: Evaluation;
  chosenRoute: RouteId;
  photoFile: string;
  usesSampleData: boolean;
  /** The configuration as validated by the Sailsrep Configurator API, or why it wasn't. */
  sailsrep: {
    validated: boolean;
    tenant: string | null;
    configurationId: string | null;
    catalogVersion: string | null;
    note: string | null;
  };
}

export function buildAudit(sub: QuoteSubmission): FieldAudit[] {
  const r = sub.vision.result;
  const m = (id: string) => materialById(id)?.name ?? id;
  const rows: Array<[string, string, number, string]> = [
    ["Material stream", m(r.primary_stream.value), r.primary_stream.confidence, m(sub.stream.material)],
    ["Contamination", r.contamination.value, r.contamination.confidence, sub.stream.contamination],
    ["Volume (m³ per week)", String(r.volume_m3.value), r.volume_m3.confidence, String(sub.stream.volumePerWeekM3)],
    ["EWC code", r.ewc_code.value, r.ewc_code.confidence, sub.stream.ewc],
  ];
  return rows.map(([field, ai, conf, final]) => ({
    field,
    ai,
    aiConfidence: conf,
    final,
    changed: ai !== final,
    confirmed: sub.confirmedFields.includes(field),
  }));
}

export function validateSubmission(sub: QuoteSubmission): string | null {
  const e = ewcByCode(sub.stream.ewc);
  if (!e) return `EWC code ${sub.stream.ewc} is not in the catalogue.`;
  if (e.material !== sub.stream.material) return `EWC code ${sub.stream.ewc} does not belong to the chosen material.`;
  return null;
}

export function evaluateSubmission(sub: QuoteSubmission) {
  const evaluation = evaluate(sub.stream, sub.config);
  const chosen = evaluation.routes.find((r) => r.route === sub.chosenRoute);
  if (!chosen?.eligible) {
    return { evaluation, error: `Route ${sub.chosenRoute} is not allowed for this stream.` };
  }
  return { evaluation, error: null };
}

export function quoteNumber(seq: number, date = new Date()) {
  return `WQ-${date.getFullYear()}-${String(seq).padStart(4, "0")}`;
}

export function validUntil(from: Date) {
  const d = new Date(from);
  d.setDate(d.getDate() + company.quote_terms.valid_days);
  return d.toISOString();
}
