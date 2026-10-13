import { sailsrepStatus } from "../sailsrep";
import { VISION_MODEL, claudeConfigured } from "./claude";

export type VisionProvider = "sailsrep" | "claude" | "stub";

/** Which vision provider runs: WASTEQUOTE_VISION overrides, else Sailsrep, else Claude, else the stub. */
export function visionProvider(): VisionProvider {
  const forced = process.env.WASTEQUOTE_VISION;
  if (forced === "stub") return "stub";
  if (forced === "claude" && claudeConfigured()) return "claude";
  if (sailsrepStatus().configured) return "sailsrep";
  if (claudeConfigured()) return "claude";
  return "stub";
}

export function visionLabel(p: VisionProvider) {
  return p === "sailsrep" ? "Sailsrep assistant" : p === "claude" ? VISION_MODEL : "recorded demo results";
}
