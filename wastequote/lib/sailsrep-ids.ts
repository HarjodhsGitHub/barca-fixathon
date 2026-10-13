// Module and variant ids of the WasteQuote model in Sailsrep. Shared by the
// exporter (scripts/sailsrep-export.ts) and the Configurator API client, so
// both sides address the same ids.
import type { Contamination, MaterialId, RouteId } from "./types";

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
