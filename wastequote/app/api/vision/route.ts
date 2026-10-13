import { z } from "zod";
import { classifyWithSailsrep } from "@/lib/sailsrep";
import { visionProvider } from "@/lib/vision/provider";
import { VISION_MODEL, classifyWithClaude } from "@/lib/vision/claude";
import { stubClassify } from "@/lib/vision/stub";
import type { VisionResponse } from "@/lib/vision/schema";

export const runtime = "nodejs";
export const maxDuration = 180;

const Body = z.object({
  // About 6 MB of JPEG; the browser downscales first, so real uploads are far smaller.
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
  const provider = visionProvider();

  const fallback = (why: string): VisionResponse => {
    const { result, matched } = stubClassify({ sha256, filename });
    return {
      mode: provider === "stub" ? "stub" : "stub_fallback",
      model: null,
      ms: Date.now() - started,
      result,
      note:
        `${why} ` +
        (matched ? `Showing the recorded classification for demo photo ${matched}.` : "This is not a demo photo: set each field by hand."),
    };
  };

  if (provider === "sailsrep") {
    try {
      const v = await classifyWithSailsrep(`data:${mediaType};base64,${image}`);
      const body: VisionResponse = {
        mode: "sailsrep",
        model: "Sailsrep assistant",
        ms: Date.now() - started,
        result: v.result,
        note: null,
        configurationId: v.configurationId,
        agentNotes: v.agentNotes,
      };
      return Response.json(body);
    } catch (e) {
      return Response.json(fallback(`Sailsrep vision failed (${e instanceof Error ? e.message : String(e)}).`));
    }
  }
  if (provider === "claude") {
    try {
      const result = await classifyWithClaude(image, mediaType);
      const body: VisionResponse = { mode: "claude", model: VISION_MODEL, ms: Date.now() - started, result, note: null };
      return Response.json(body);
    } catch (e) {
      return Response.json(fallback(`Claude vision failed (${e instanceof Error ? e.message : String(e)}).`));
    }
  }
  return Response.json(fallback("No vision provider configured (no Sailsrep key, no ANTHROPIC_API_KEY)."));
}
