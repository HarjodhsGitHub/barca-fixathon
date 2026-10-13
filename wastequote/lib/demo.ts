// The demo photos live in /demo (outside public/) so they ship with the
// repo as test assets; the app serves them through /api/demo-photo/[name].
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export const DEMO_DIR = path.join(process.cwd(), "demo");

export function listDemoPhotos(): string[] {
  try {
    return readdirSync(DEMO_DIR)
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort();
  } catch {
    return [];
  }
}

let hashIndex: Map<string, string> | null = null;

/** sha256 of each demo photo's bytes -> its filename. */
export function demoPhotoByHash(sha256: string): string | null {
  if (!hashIndex) {
    hashIndex = new Map();
    for (const f of listDemoPhotos()) {
      const h = createHash("sha256").update(readFileSync(path.join(DEMO_DIR, f))).digest("hex");
      hashIndex.set(h, f);
    }
  }
  return hashIndex.get(sha256.toLowerCase()) ?? null;
}
