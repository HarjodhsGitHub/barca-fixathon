// Client-side types and helpers shared by the wizard steps.
import { checkEligibility } from "@/lib/engine";
import { containers } from "@/lib/data";
import type { Contamination, MaterialId, RouteId } from "@/lib/types";
import type { VisionResponse } from "@/lib/vision/schema";

export interface OptionStatus {
  status: "available" | "selected" | "blocked";
  reason: string | null;
}

export type Availability =
  | {
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
  | { source: "local"; reason: string };

export interface PhotoState {
  dataUrl: string;
  base64: string;
  mediaType: "image/jpeg";
  sha256: string;
  filename: string;
}

export interface StreamState {
  material: MaterialId;
  contamination: Contamination;
  ewc: string;
  volumePerWeekM3: number;
}

export interface Customer {
  company: string;
  site: string;
  contact: string;
  email: string;
  nace: string;
}

export type FieldKey = "Material stream" | "Contamination" | "Volume (m³ per week)" | "EWC code";

export interface AppInfo {
  demoPhotos: string[];
  vision: { live: boolean; model: string };
  sailsrep: { configured: boolean; tenant: string | null; reason: string | null };
  customer: Customer;
}

export function initialStream(v: VisionResponse): StreamState {
  return {
    material: v.result.primary_stream.value,
    contamination: v.result.contamination.value,
    ewc: v.result.ewc_code.value,
    volumePerWeekM3: Math.max(0.1, Math.round(v.result.volume_m3.value * 10) / 10),
  };
}

/** Container availability: Sailsrep when it answered, else the local container table. */
export function containerStatus(av: Availability | null, material: MaterialId, containerId: string): OptionStatus {
  if (av?.source === "sailsrep" && av.containers[containerId]) return av.containers[containerId];
  const c = containers.find((x) => x.id === containerId);
  return c && c.materials.includes(material)
    ? { status: "available", reason: null }
    : { status: "blocked", reason: "Not offered for this material in the price list" };
}

/** Route availability: Sailsrep when it answered, else the local eligibility table. */
export function routeStatus(av: Availability | null, material: MaterialId, level: Contamination, route: RouteId) {
  const local = checkEligibility(material, route, level).eligible;
  if (av?.source === "sailsrep" && av.routes[route]) {
    const s = av.routes[route]!;
    const open = s.status !== "blocked";
    return { open, local, sailsrep: s, mismatch: open !== local };
  }
  return { open: local, local, sailsrep: null, mismatch: false };
}

export const STEPS = [
  { id: "photo", label: "Photo" },
  { id: "review", label: "Classify" },
  { id: "configure", label: "Configure" },
  { id: "compare", label: "Compare & accept" },
] as const;
export type StepId = (typeof STEPS)[number]["id"];
