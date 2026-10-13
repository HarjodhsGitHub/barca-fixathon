import { z } from "zod";
import { VISION_MODEL, classifyWithClaude, claudeConfigured } from "@/lib/vision/claude";
import { stubClassify } from "@/lib/vision/stub";
import type { VisionResponse } from "@/lib/vision/schema";

export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({
  // About 6 MB of JPEG; the browser downscales to 1568 px first, so real uploads are far smaller.
  image: z.string().min(100).max(8_000_000),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  sha256: z.string().nullish(),
  filename: z.string().nullish(),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Send { image: base64, mediaType }." }, { status: 400 });
  }
  const { image, mediaType, sha256, filename } = parsed.data;
  const started = Date.now();

  if (claudeConfigured()) {
    try {
      const result = await classifyWithClaude(image, mediaType);
      const body: VisionResponse = { mode: "claude", model: VISION_MODEL, ms: Date.now() - started, result, note: null };
      return Response.json(body);
    } catch (e) {
      const { result, matched } = stubClassify({ sha256, filename });
      const body: VisionResponse = {
        mode: "stub_fallback",
        model: null,
        ms: Date.now() - started,
        result,
        note: `Live vision failed (${e instanceof Error ? e.message : String(e)}). ${
          matched ? `Showing the recorded classification for ${matched}.` : "Set each field by hand."
        }`,
      };
      return Response.json(body);
    }
  }

  const { result, matched } = stubClassify({ sha256, filename });
  const body: VisionResponse = {
    mode: "stub",
    model: null,
    ms: Date.now() - started,
    result,
    note: matched
      ? `No ANTHROPIC_API_KEY set: showing the recorded classification for demo photo ${matched}.`
      : "No ANTHROPIC_API_KEY set and this is not a demo photo: set each field by hand.",
  };
  return Response.json(body);
}
