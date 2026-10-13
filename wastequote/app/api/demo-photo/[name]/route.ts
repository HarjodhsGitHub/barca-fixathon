import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEMO_DIR, listDemoPhotos } from "@/lib/demo";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  if (!listDemoPhotos().includes(name)) return new Response("Not found", { status: 404 });
  const bytes = await readFile(path.join(DEMO_DIR, name));
  const type = name.endsWith(".png") ? "image/png" : name.endsWith(".webp") ? "image/webp" : "image/jpeg";
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": type, "Cache-Control": "public, max-age=3600" } });
}
