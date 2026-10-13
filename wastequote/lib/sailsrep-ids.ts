// Module and variant ids of the Selinsight model in Sailsrep. Shared by the
// exporter (scripts/sailsrep-export.ts) and the Configurator API client, so
// both sides address the same ids.
import type { Contamination, MaterialId, RouteId } from "./types";
import { containers, materials, routes, service } from "./data";
import { CONTAMINATION_LEVELS } from "./types";


const slug = (s: string) => s.toLowerCase().replace(/_/g, "-");

export const SAILSREP_IDS = {
  material: "feat-material",
  contamination: "feat-contamination",
  route: "mod-route",
  container: "mod-container",
  frequency: "mod-frequency",
  materialVariant: (m: MaterialId) => `feat-material-${slug(m)}`,
  contaminationVariant: (l: Contamination) => `feat-contamination-${l}`,
  routeVariant: (m: MaterialId, r: RouteId) => `mod-route-${slug(m)}-${r}`,
  containerVariant: (c: string) => `mod-container-${slug(c)}`,
  frequencyVariant: (f: string) => `mod-frequency-${slug(f)}`,
} as const;


export interface WizardSelections {
  material?: MaterialId;
  contamination?: Contamination;
  route?: RouteId;
  containerId?: string;
  frequencyId?: string;
}

/** Read Sailsrep module selections back into Selinsight terms. Unknown ids are ignored. */
export function fromSailsrep(selections: Array<{ moduleId: string; variantId: string | number }>): WizardSelections {
  const out: WizardSelections = {};
  for (const s of selections) {
    const v = String(s.variantId);
    if (s.moduleId === SAILSREP_IDS.material) out.material = materials.find((m) => SAILSREP_IDS.materialVariant(m.id) === v)?.id;
    if (s.moduleId === SAILSREP_IDS.contamination) out.contamination = CONTAMINATION_LEVELS.find((l) => SAILSREP_IDS.contaminationVariant(l) === v);
    if (s.moduleId === SAILSREP_IDS.container) out.containerId = containers.find((c) => SAILSREP_IDS.containerVariant(c.id) === v)?.id;
    if (s.moduleId === SAILSREP_IDS.frequency) out.frequencyId = service.frequencies.find((f) => SAILSREP_IDS.frequencyVariant(f.id) === v)?.id;
    if (s.moduleId === SAILSREP_IDS.route) {
      for (const m of materials) for (const r of routes) if (SAILSREP_IDS.routeVariant(m.id, r.id) === v) out.route = r.id;
    }
  }
  return out;
}

/** Selinsight selections as a Sailsrep selection set, most important first (Sailsrep keeps the last pick on conflict). */
export function toSailsrep(sel: WizardSelections) {
  const out: Array<{ moduleId: string; variantId: string }> = [];
  if (sel.containerId) out.push({ moduleId: SAILSREP_IDS.container, variantId: SAILSREP_IDS.containerVariant(sel.containerId) });
  if (sel.frequencyId) out.push({ moduleId: SAILSREP_IDS.frequency, variantId: SAILSREP_IDS.frequencyVariant(sel.frequencyId) });
  if (sel.material && sel.route) out.push({ moduleId: SAILSREP_IDS.route, variantId: SAILSREP_IDS.routeVariant(sel.material, sel.route) });
  if (sel.contamination) out.push({ moduleId: SAILSREP_IDS.contamination, variantId: SAILSREP_IDS.contaminationVariant(sel.contamination) });
  if (sel.material) out.push({ moduleId: SAILSREP_IDS.material, variantId: SAILSREP_IDS.materialVariant(sel.material) });
  return out;
}
