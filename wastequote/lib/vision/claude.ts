// Claude vision call. Structured output guarantees the JSON shape; the
// confidence values inside it are the model's own estimate, not calibrated.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { VisionWireSchema, buildSystemPrompt, normalizeVision, type VisionResult } from "./schema";

export const VISION_MODEL = process.env.WASTEQUOTE_VISION_MODEL || "claude-opus-5-5";
const EFFORT = (process.env.WASTEQUOTE_VISION_EFFORT || "low") as "low" | "medium" | "high";

export function claudeConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | null = null;
function getClient() {
  client ??= new Anthropic({ timeout: 90_000, maxRetries: 1 });
  return client;
}

export type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export async function classifyWithClaude(base64: string, mediaType: ImageMediaType): Promise<VisionResult> {
  const response = await getClient().beta.messages.parse({
    model: VISION_MODEL,
    max_tokens: 16000,
    // Server-side fallback: if a safety classifier declines, the API re-runs
    // the request on Anthropic's recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: EFFORT, format: betaZodOutputFormat(VisionWireSchema) },
    system: buildSystemPrompt(),
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          {
            type: "text",
            text: "Classify the waste stream in this photo for a collection quote.",
          },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The vision model declined to classify this photo.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("The vision model ran out of output tokens.");
  }
  if (!response.parsed_output) {
    throw new Error("The vision model did not return valid structured output.");
  }
  return normalizeVision(response.parsed_output);
}
