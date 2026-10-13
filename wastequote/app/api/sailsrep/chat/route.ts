// Proxies a chat turn to the Sailsrep assistant on the quote's configuration.
// The wizard's current selections are written first, so the assistant answers
// about exactly what is on screen; its SSE stream is passed straight through.
import { z } from "zod";
import { openChat, sailsrepStatus, syncConfiguration } from "@/lib/sailsrep";
import { CONTAMINATION_LEVELS, MATERIAL_IDS, ROUTE_IDS } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 180;

const Body = z.object({
  configurationId: z.string().min(4),
  message: z.string().min(1).max(4000),
  selections: z.object({
    material: z.enum(MATERIAL_IDS),
    contamination: z.enum(CONTAMINATION_LEVELS),
    route: z.enum(ROUTE_IDS).nullish(),
    containerId: z.string().nullish(),
    frequencyId: z.string().nullish(),
  }),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Send { configurationId, message, selections }." }, { status: 400 });
  if (!sailsrepStatus().configured) return Response.json({ error: "Sailsrep is not configured." }, { status: 503 });
  const { configurationId, message, selections } = parsed.data;
  try {
    await syncConfiguration(configurationId, {
      material: selections.material,
      contamination: selections.contamination,
      route: selections.route ?? undefined,
      containerId: selections.containerId ?? undefined,
      frequencyId: selections.frequencyId ?? undefined,
    });
    const upstream = await openChat(configurationId, { message });
    if (!upstream.ok || !upstream.body) {
      const j = (await upstream.json().catch(() => ({}))) as { error?: { message?: string } };
      return Response.json({ error: j.error?.message ?? `Sailsrep chat ${upstream.status}` }, { status: 502 });
    }
    return new Response(upstream.body, {
      headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform" },
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
