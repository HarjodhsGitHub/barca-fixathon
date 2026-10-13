// The vision stub. Used when no Anthropic credentials are configured, or
// when the live call fails. For the demo photos it returns a recorded
// classification from demo/vision-fixtures.json; for any other photo it
// returns an empty, low-confidence result so the salesperson sets every
// field by hand. The UI always labels stub results as such.
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { DEMO_DIR, demoPhotoByHash } from "../demo";
import { VisionSchema, type VisionResult } from "./schema";

const Fixtures = z.object({
  _meta: z.object({ description: z.string() }).passthrough(),
  fixtures: z.array(z.object({ file: z.string(), result: VisionSchema })),
});

function loadFixtures() {
  try {
    const raw = JSON.parse(readFileSync(path.join(DEMO_DIR, "vision-fixtures.json"), "utf8"));
    return Fixtures.parse(raw).fixtures;
  } catch (e) {
    console.warn("vision-fixtures.json unreadable:", e);
    return [];
  }
}

export function stubClassify(opts: { sha256?: string | null; filename?: string | null }): {
  result: VisionResult;
  matched: string | null;
} {
  const fixtures = loadFixtures();
  const byHash = opts.sha256 ? demoPhotoByHash(opts.sha256) : null;
  const name = byHash ?? opts.filename ?? null;
  const hit = name ? fixtures.find((f) => f.file === path.basename(name)) : undefined;
  if (hit) return { result: hit.result, matched: hit.file };
  return { result: UNKNOWN, matched: null };
}

const UNKNOWN: VisionResult = {
  image_ok: true,
  image_issue: null,
  summary: "Not classified: the vision stub only knows the demo photos. Set each field by hand.",
  materials_seen: [],
  primary_stream: { value: "mixed_cd", confidence: 0, rationale: "Stub placeholder, not a classification." },
  contamination: { value: "medium", confidence: 0, contaminants: [], rationale: "Stub placeholder, not a classification." },
  volume_m3: { value: 5, confidence: 0, basis: "Stub placeholder, not an estimate." },
  ewc_code: { value: "17 09 04", confidence: 0, rationale: "Stub placeholder, not a classification." },
  hazard_flags: [],
  segregation_tip: null,
};
