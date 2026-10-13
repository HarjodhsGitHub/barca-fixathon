// Server-side client for the Sailsrep Configurator (Self-Service) API, docs in
// sailsrep/api-docs/. The Selinsight model lives in a Sailsrep demo tenant,
// generated from /data by scripts/sailsrep-export.ts. Sailsrep decides which
// routes, containers and frequencies are open, reads the photo through its
// assistant, and answers follow-up questions; Selinsight's engine prices the
// open routes per tonne. The key never leaves the server.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { containers, ewcCatalogue, routes, service } from "./data";
import { SAILSREP_IDS as ID, fromSailsrep, toSailsrep, type WizardSelections } from "./sailsrep-ids";
import type { Contamination, MaterialId, RouteId } from "./types";
import { VisionWireSchema, normalizeVision, type VisionResult } from "./vision/schema";

const DIR = path.join(process.cwd(), "sailsrep");

interface TenantInfo {
  tenant: string;
  api_base: string;
}

function tenantInfo(): TenantInfo | null {
  try {
    return JSON.parse(readFileSync(path.join(DIR, "tenant.json"), "utf8")) as TenantInfo;
  } catch {
    return null;
  }
}

function apiKey(tenant: string): string | null {
  if (process.env.SAILSREP_API_KEY) return process.env.SAILSREP_API_KEY.trim();
  try {
    const file = readdirSync(path.join(DIR, "keys")).find((f) => f === `${tenant}.key`);
    return file ? readFileSync(path.join(DIR, "keys", file), "utf8").trim() : null;
  } catch {
    return null;
  }
}

export function sailsrepStatus() {
  const t = tenantInfo();
  if (!t) return { configured: false as const, tenant: null, reason: "sailsrep/tenant.json missing" };
  if (process.env.WASTEQUOTE_SAILSREP === "off") return { configured: false as const, tenant: t.tenant, reason: "turned off (WASTEQUOTE_SAILSREP=off)" };
  if (!apiKey(t.tenant)) return { configured: false as const, tenant: t.tenant, reason: "no API key (SAILSREP_API_KEY or sailsrep/keys/<tenant>.key)" };
  return { configured: true as const, tenant: t.tenant, reason: null };
}

export interface OptionStatus {
  status: "available" | "selected" | "blocked";
  reason: string | null;
}

export interface Spec {
  name: string;
  description: string | null;
  longDescription: string | null;
}

export interface Availability {
  source: "sailsrep";
  tenant: string;
  configurationId: string;
  catalogVersion: string | null;
  ms: number;
  routes: Partial<Record<RouteId, OptionStatus>>;
  containers: Record<string, OptionStatus>;
  frequencies: Record<string, OptionStatus>;
  specs: { routes: Partial<Record<RouteId, Spec>>; containers: Record<string, Spec> };
  listPrice: { total: number; currency: string } | null;
}

interface CfgVariant {
  id: string;
  name: string;
  status: "available" | "selected" | "blocked";
  reason?: string;
  description?: string;
  longDescription?: string;
}
interface CfgModule {
  id: string;
  variants?: CfgVariant[];
  selection?: { variantId: string; source: string; reason?: string };
}
export interface CfgDoc {
  id: string;
  catalogVersion?: string;
  modules: CfgModule[];
  price?: { total: number; currency: string };
}
interface ApiError {
  error?: { code?: string; message?: string; details?: unknown };
}

/** Sailsrep configuration ids look like cfg_<hex>. Anything else never reaches a URL path. */
export const CONFIGURATION_ID = /^cfg_[A-Za-z0-9]{8,64}$/;
function cfgPath(id: string, suffix = "") {
  if (!CONFIGURATION_ID.test(id)) throw new Error("Invalid configuration id");
  return `/configurations/${id}${suffix}`;
}

export class SailsrepConflict extends Error {
  constructor(message: string, public details: unknown) {
    super(message);
  }
}

function auth() {
  const t = tenantInfo();
  const key = t && apiKey(t.tenant);
  if (!t || !key) throw new Error("Sailsrep is not configured");
  return { base: t.api_base, tenant: t.tenant, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" } };
}

async function call(method: "GET" | "POST" | "PUT", pathname: string, body?: unknown, timeoutMs = 9000): Promise<CfgDoc> {
  const a = auth();
  const res = await fetch(a.base + pathname, {
    method,
    headers: a.headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(Number(process.env.WASTEQUOTE_SAILSREP_TIMEOUT_MS || timeoutMs)),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as CfgDoc & ApiError;
  if (!res.ok) {
    if (json.error?.code === "selections_conflict") {
      throw new SailsrepConflict(json.error.message ?? "Selections conflict", json.error.details);
    }
    throw new Error(`Sailsrep ${res.status}: ${json.error?.message ?? "request failed"}`);
  }
  return json;
}

const statusOf = (v?: CfgVariant): OptionStatus =>
  v ? { status: v.status, reason: v.reason ?? null } : { status: "blocked", reason: "Not in the Sailsrep catalog" };
const specOf = (v?: CfgVariant): Spec | undefined =>
  v ? { name: v.name, description: v.description ?? null, longDescription: v.longDescription ?? null } : undefined;

/** Which routes, containers and frequencies Sailsrep opens for this stream, with their specs. */
export async function getAvailability(
  material: MaterialId,
  contamination: Contamination,
  configurationId?: string | null,
): Promise<Availability> {
  const started = Date.now();
  const selections = toSailsrep({ material, contamination });
  let doc: CfgDoc;
  try {
    doc = configurationId
      ? await call("PUT", cfgPath(configurationId), { selections })
      : await call("POST", "/configurations", { selections });
  } catch (e) {
    // A configuration from an earlier session may be gone: start a fresh one.
    if (!configurationId || e instanceof SailsrepConflict) throw e;
    doc = await call("POST", "/configurations", { selections });
  }
  const mod = (id: string) => doc.modules.find((m) => m.id === id)?.variants ?? [];
  const out: Availability = {
    source: "sailsrep",
    tenant: auth().tenant,
    configurationId: doc.id,
    catalogVersion: doc.catalogVersion ?? null,
    ms: 0,
    routes: {},
    containers: {},
    frequencies: {},
    specs: { routes: {}, containers: {} },
    listPrice: doc.price ?? null,
  };
  for (const r of routes) {
    const v = mod(ID.route).find((x) => x.id === ID.routeVariant(material, r.id));
    // A route with no variant at all (e.g. metal to recovery) is closed by the model itself.
    out.routes[r.id] = v ? statusOf(v) : { status: "blocked", reason: "No such route for this stream in the catalog" };
    const spec = specOf(v);
    if (spec) out.specs.routes[r.id] = spec;
  }
  for (const c of containers) {
    const v = mod(ID.container).find((x) => x.id === ID.containerVariant(c.id));
    out.containers[c.id] = statusOf(v);
    const spec = specOf(v);
    if (spec) out.specs.containers[c.id] = spec;
  }
  for (const f of service.frequencies) out.frequencies[f.id] = statusOf(mod(ID.frequency).find((x) => x.id === ID.frequencyVariant(f.id)));
  out.ms = Date.now() - started;
  return out;
}

/**
 * Write the wizard's complete selection set to a configuration. If the full
 * set conflicts (the salesperson picked something the rules now close), fall
 * back to the stream facts so the assistant still sees the right stream.
 */
export async function syncConfiguration(configurationId: string, sel: WizardSelections) {
  const attempts = [sel, { material: sel.material, contamination: sel.contamination, containerId: sel.containerId, frequencyId: sel.frequencyId }, { material: sel.material, contamination: sel.contamination }];
  for (const a of attempts) {
    try {
      return await call("PUT", cfgPath(configurationId), { selections: toSailsrep(a) });
    } catch (e) {
      if (!(e instanceof SailsrepConflict)) throw e;
    }
  }
  throw new Error("Sailsrep refused every selection set");
}

/** Validate a complete configuration in Sailsrep. Throws SailsrepConflict if a rule breaks. */
export async function validateConfiguration(
  sel: Required<Pick<WizardSelections, "material" | "contamination" | "route" | "containerId" | "frequencyId">>,
  configurationId?: string | null,
) {
  const selections = toSailsrep(sel);
  const doc = configurationId
    ? await call("PUT", cfgPath(configurationId), { selections }).catch((e) => {
        if (e instanceof SailsrepConflict) throw e;
        return call("POST", "/configurations", { selections });
      })
    : await call("POST", "/configurations", { selections });
  return { configurationId: doc.id, catalogVersion: doc.catalogVersion ?? null, listPrice: doc.price ?? null };
}

/** Open a chat turn and hand back the raw SSE response for streaming. */
export async function openChat(configurationId: string, body: { message?: string; attachments?: Array<{ name?: string; data: string }> }) {
  const a = auth();
  return fetch(a.base + cfgPath(configurationId, "/chat"), {
    method: "POST",
    headers: a.headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(180_000),
    cache: "no-store",
  });
}

export interface SseEvent {
  type: string;
  [k: string]: unknown;
}

export function parseSse(raw: string): SseEvent[] {
  const out: SseEvent[] = [];
  for (const block of raw.split("\n\n")) {
    const data = block
      .split("\n")
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trim())
      .join("\n");
    if (!data) continue;
    try {
      out.push(JSON.parse(data) as SseEvent);
    } catch {
      /* skip partial or unknown frames */
    }
  }
  return out;
}

// ------------------------------------------------------------------ vision

function visionMessage() {
  const codes = ewcCatalogue.map((e) => `${e.code} (${e.material})`).join(", ");
  return `Selinsight vision step. A salesperson photographed a customer's waste at a factory or construction site. Look at the attached photo and classify it.

1. Select the waste stream (Waste stream module) and the contamination level (Contamination module) that fit the photo, using each stream's own contamination definitions. Do not pick a route, container or frequency.
2. Then reply with ONLY one JSON object, no prose, in this shape:
{"image_ok": true, "image_issue": null, "summary": "one plain sentence for the quote", "materials_seen": [{"stream": "cardboard_paper|clean_wood|mixed_cd|scrap_metal|plastic_film|organic_food|other", "share_pct": 0, "evidence": "..."}], "primary_stream": {"value": "cardboard_paper|clean_wood|mixed_cd|scrap_metal|plastic_film|organic_food", "confidence": 0.0, "rationale": "..."}, "contamination": {"value": "low|medium|high", "confidence": 0.0, "contaminants": ["..."], "rationale": "..."}, "volume_m3": {"value": 0, "confidence": 0.0, "basis": "reference object used"}, "ewc_code": {"value": "NN NN NN", "confidence": 0.0, "rationale": "..."}, "hazard_flags": [], "segregation_tip": null}

EWC codes allowed: ${codes}. Packaging from a factory is chapter 15, site waste chapter 17, process residues chapters 02, 03 and 12, canteen or office waste chapter 20.
Volume: loose m³ of waste visible. Anchor on known sizes: 240 L and 1,100 L bins, 6-8 m³ skips (about 3.7 m long), 20-40 m³ roll-off containers (about 6 m long), a euro pallet (1.2 x 0.8 m), a person (about 1.75 m). Say which reference you used.
Confidence is 0-1 per field and must be honest: under 0.7 means the salesperson has to check it. Flag anything possibly hazardous (asbestos-like sheeting, batteries, gas cylinders, chemical containers, electrical equipment).`;
}

function extractJson(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(candidate);
}

export interface SailsrepVision {
  result: VisionResult;
  configurationId: string;
  agentNotes: string[];
}

export type VisionProgress =
  | { kind: "activity"; label: string }
  | { kind: "selection"; module: string; value: string; reason: string | null };

async function chatTurn(
  configurationId: string,
  body: { message?: string; attachments?: Array<{ name?: string; data: string }> },
  onProgress?: (p: VisionProgress) => void,
) {
  const res = await openChat(configurationId, body);
  if (!res.ok || !res.body) {
    const j = (await res.json().catch(() => ({}))) as ApiError;
    throw new Error(`Sailsrep chat ${res.status}: ${j.error?.message ?? "refused"}`);
  }
  const events: SseEvent[] = [];
  const seen = new Map<string, string>();
  const handle = (e: SseEvent) => {
    events.push(e);
    if (!onProgress) return;
    if (e.type === "activity" && e.label) onProgress({ kind: "activity", label: String(e.label) });
    if (e.type === "configuration.updated") {
      const doc = e.configuration as CfgDoc & { modules: Array<CfgModule & { name?: string }> };
      for (const m of doc?.modules ?? []) {
        if (m.selection?.source !== "agent" || seen.get(m.id) === m.selection.variantId) continue;
        seen.set(m.id, m.selection.variantId);
        const v = m.variants?.find((x) => x.id === m.selection!.variantId);
        onProgress({ kind: "selection", module: m.name ?? m.id, value: v?.name ?? m.selection.variantId, reason: m.selection.reason ?? null });
      }
    }
  };
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let acc = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    acc += dec.decode(value, { stream: true });
    const parts = acc.split("\n\n");
    acc = parts.pop() ?? "";
    for (const part of parts) parseSse(part).forEach(handle);
  }
  if (acc.trim()) parseSse(acc).forEach(handle);
  return {
    error: (events.find((e) => e.type === "error") as { error?: { message?: string } } | undefined)?.error?.message ?? null,
    text: (events.filter((e) => e.type === "message.complete").pop()?.text as string | undefined) ?? "",
    lastDoc: events.filter((e) => e.type === "configuration.updated").pop()?.configuration as CfgDoc | undefined,
  };
}

function parseWire(text: string) {
  try {
    return VisionWireSchema.safeParse(extractJson(text));
  } catch {
    return { success: false as const };
  }
}

/** Classify a photo with the Sailsrep assistant, on a fresh configuration that the quote then keeps using. */
export async function classifyWithSailsrep(dataUrl: string, onProgress?: (p: VisionProgress) => void): Promise<SailsrepVision> {
  const cfg = await call("POST", "/configurations", {});
  const first = await chatTurn(cfg.id, { message: visionMessage(), attachments: [{ name: "site-photo.jpg", data: dataUrl }] }, onProgress);
  let { text, lastDoc } = first;
  let parsed = parseWire(text);
  if (!parsed.success) {
    // The assistant sometimes answers in prose first. Ask once more on the same
    // configuration: it still has the photo.
    onProgress?.({ kind: "activity", label: "Asking for the structured result" });
    const again = await chatTurn(
      cfg.id,
      { message: "Now reply with ONLY the JSON object described in my first message, filled in for the photo. No prose, no code fence." },
      onProgress,
    );
    text = again.text || text;
    lastDoc = again.lastDoc ?? lastDoc;
    parsed = parseWire(text);
  }
  const agentSel = lastDoc?.modules.filter((m) => m.selection).map((m) => ({ moduleId: m.id, variantId: m.selection!.variantId })) ?? [];
  const agent = fromSailsrep(agentSel);
  const agentNotes =
    lastDoc?.modules
      .filter((m) => m.selection?.source === "agent" && m.selection.reason)
      .map((m) => m.selection!.reason!) ?? [];

  if (!parsed.success) {
    if (!agent.material) throw new Error(first.error ?? "The Sailsrep assistant did not return a classification.");
    // Fall back to what the assistant selected in the configuration.
    const result = normalizeVision({
      image_ok: true,
      image_issue: null,
      summary: text.replace(/```[\s\S]*?```/g, "").trim().slice(0, 280) || "Classified by the Sailsrep assistant.",
      materials_seen: [],
      primary_stream: { value: agent.material, confidence: 0.6, rationale: agentNotes[0] ?? "Selected by the Sailsrep assistant." },
      contamination: { value: agent.contamination ?? "medium", confidence: agent.contamination ? 0.6 : 0, contaminants: [], rationale: agentNotes[1] ?? "" },
      volume_m3: { value: 5, confidence: 0, basis: "Not estimated: set it by hand." },
      ewc_code: { value: "", confidence: 0, rationale: "Not returned: pick the code by hand." },
      hazard_flags: [],
      segregation_tip: null,
    });
    return { result, configurationId: cfg.id, agentNotes };
  }
  const result = normalizeVision(parsed.data);
  // The configuration is the record: if the JSON and the assistant's selections disagree, trust the selections and flag it.
  if (agent.material && agent.material !== result.primary_stream.value) {
    result.primary_stream = { value: agent.material, confidence: Math.min(result.primary_stream.confidence, 0.5), rationale: `The assistant's text and its selection disagreed; using its selection. ${agentNotes[0] ?? ""}`.trim() };
  }
  if (agent.contamination && agent.contamination !== result.contamination.value) {
    result.contamination = { ...result.contamination, value: agent.contamination, confidence: Math.min(result.contamination.confidence, 0.5) };
  }
  return { result, configurationId: cfg.id, agentNotes };
}
