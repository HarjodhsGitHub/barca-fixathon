import { z } from "zod";
import { getAvailability, sailsrepStatus } from "@/lib/sailsrep";
import { CONTAMINATION_LEVELS, MATERIAL_IDS } from "@/lib/types";

export const runtime = "nodejs";

const Body = z.object({ material: z.enum(MATERIAL_IDS), contamination: z.enum(CONTAMINATION_LEVELS) });

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Send { material, contamination }." }, { status: 400 });
  const status = sailsrepStatus();
  if (!status.configured) {
    return Response.json({ source: "local", reason: `Sailsrep not used: ${status.reason}.` });
  }
  try {
    return Response.json(await getAvailability(parsed.data.material, parsed.data.contamination));
  } catch (e) {
    return Response.json({
      source: "local",
      reason: `Sailsrep unreachable (${e instanceof Error ? e.message : String(e)}). Using the local copy of the rules.`,
    });
  }
}
