import { z } from "zod";
import { classifyWithSailsrep, type VisionProgress } from "@/lib/sailsrep";
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
  /** true: answer as an SSE stream of progress events ending in the result. */
  stream: z.boolean().nullish(),
});

async function runVision(body: z.infer<typeof Body>, onProgress: (p: VisionProgress) => void): Promise<VisionResponse> {
  const { image, mediaType, sha256, filename } = body;
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
      onProgress({ kind: "activity", label: "Sending the photo to Selinsight AI" });
      const v = await classifyWithSailsrep(`data:${mediaType};base64,${image}`, onProgress);
      return {
        mode: "sailsrep",
        model: "Selinsight AI",
        ms: Date.now() - started,
        result: v.result,
        note: null,
        configurationId: v.configurationId,
        agentNotes: v.agentNotes,
      };
    } catch (e) {
      return fallback(`AI vision failed (${e instanceof Error ? e.message : String(e)}).`);
    }
  }
  if (provider === "claude") {
    try {
      onProgress({ kind: "activity", label: `Asking ${VISION_MODEL}` });
      const result = await classifyWithClaude(image, mediaType);
      return { mode: "claude", model: VISION_MODEL, ms: Date.now() - started, result, note: null };
    } catch (e) {
      return fallback(`Claude vision failed (${e instanceof Error ? e.message : String(e)}).`);
    }
  }
  return fallback("No AI vision is set up on this machine.");
}

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Send { image: base64, mediaType }." }, { status: 400 });
  }
  if (!parsed.data.stream) {
    return Response.json(await runVision(parsed.data, () => {}));
  }
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        const result = await runVision(parsed.data, (p) => send({ type: "progress", ...p }));
        send({ type: "result", result });
      } catch (e) {
        send({ type: "error", message: e instanceof Error ? e.message : String(e) });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform" },
  });
}
