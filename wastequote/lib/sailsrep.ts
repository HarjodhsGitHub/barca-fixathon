// Server-side client for the Sailsrep Configurator (Self-Service) API.
// The WasteQuote model lives in a Sailsrep demo tenant, generated from
// /data by scripts/sailsrep-export.ts. Sailsrep decides which routes,
// containers and frequencies are open for a stream; WasteQuote's engine
// prices them per tonne. The key never leaves the server.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { containers, routes, service } from "./data";
import { SAILSREP_IDS as ID } from "./sailsrep-ids";
import type { Contamination, MaterialId, RouteId } from "./types";

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

export interface Availability {
  source: "sailsrep";
  tenant: string;
  configurationId: string;
  catalogVersion: string | null;
  ms: number;
  routes: Partial<Record<RouteId, OptionStatus>>;
  containers: Record<string, OptionStatus>;
  frequencies: Record<string, OptionStatus>;
  listPrice: { total: number; currency: string } | null;
}

interface CfgVariant {
  id: string;
  status: "available" | "selected" | "blocked";
  reason?: string;
}
interface CfgModule {
  id: string;
  variants?: CfgVariant[];
}
interface CfgDoc {
  id: string;
  catalogVersion?: string;
  modules: CfgModule[];
  price?: { total: number; currency: string };
}
interface ApiError {
  error?: { code?: string; message?: string; details?: unknown };
}

export class SailsrepConflict extends Error {
  constructor(message: string, public details: unknown) {
    super(message);
  }
}

async function call(method: "POST" | "PUT", pathname: string, body: unknown): Promise<CfgDoc> {
  const t = tenantInfo();
  const key = t && apiKey(t.tenant);
  if (!t || !key) throw new Error("Sailsrep is not configured");
  const res = await fetch(t.api_base + pathname, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(Number(process.env.WASTEQUOTE_SAILSREP_TIMEOUT_MS || 9000)),
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

export async function getAvailability(material: MaterialId, contamination: Contamination): Promise<Availability> {
  const started = Date.now();
  const t = tenantInfo()!;
  const doc = await call("POST", "/configurations", {
    selections: [
      { moduleId: ID.material, variantId: ID.materialVariant(material) },
      { moduleId: ID.contamination, variantId: ID.contaminationVariant(contamination) },
    ],
  });
  const mod = (id: string) => doc.modules.find((m) => m.id === id)?.variants ?? [];
  const routeVariants = mod(ID.route);
  const out: Availability = {
    source: "sailsrep",
    tenant: t.tenant,
    configurationId: doc.id,
    catalogVersion: doc.catalogVersion ?? null,
    ms: 0,
    routes: {},
    containers: {},
    frequencies: {},
    listPrice: doc.price ?? null,
  };
  for (const r of routes) {
    const id = ID.routeVariant(material, r.id);
    const v = routeVariants.find((x) => x.id === id);
    // A route with no variant at all (e.g. metal → recovery) is closed by the model itself.
    out.routes[r.id] = v ? statusOf(v) : { status: "blocked", reason: "No such route for this stream in the catalog" };
  }
  for (const c of containers) out.containers[c.id] = statusOf(mod(ID.container).find((x) => x.id === ID.containerVariant(c.id)));
  for (const f of service.frequencies) out.frequencies[f.id] = statusOf(mod(ID.frequency).find((x) => x.id === ID.frequencyVariant(f.id)));
  out.ms = Date.now() - started;
  return out;
}

/** Validate a complete configuration in Sailsrep. Throws SailsrepConflict if a rule breaks. */
export async function validateConfiguration(sel: {
  material: MaterialId;
  contamination: Contamination;
  route: RouteId;
  containerId: string;
  frequencyId: string;
}) {
  const doc = await call("POST", "/configurations", {
    selections: [
      { moduleId: ID.material, variantId: ID.materialVariant(sel.material) },
      { moduleId: ID.contamination, variantId: ID.contaminationVariant(sel.contamination) },
      { moduleId: ID.route, variantId: ID.routeVariant(sel.material, sel.route) },
      { moduleId: ID.container, variantId: ID.containerVariant(sel.containerId) },
      { moduleId: ID.frequency, variantId: ID.frequencyVariant(sel.frequencyId) },
    ],
  });
  return { configurationId: doc.id, catalogVersion: doc.catalogVersion ?? null, listPrice: doc.price ?? null };
}
