import { quotePdf } from "@/lib/pdf/quote";
import { wtnPdf } from "@/lib/pdf/wtn";
import { getQuote, readPhoto } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string; doc: string }> }) {
  const { id, doc } = await ctx.params;
  const q = await getQuote(id);
  if (!q) return new Response("Quote not found", { status: 404 });
  let bytes: Uint8Array;
  let name: string;
  if (doc === "quote.pdf") {
    const photo = await readPhoto(q.photoFile).catch(() => null);
    bytes = await quotePdf(q, photo ? new Uint8Array(photo) : null);
    name = `${q.number}-quote.pdf`;
  } else if (doc === "wtn.pdf") {
    bytes = await wtnPdf(q);
    name = `${q.number}-waste-transfer-note-DRAFT.pdf`;
  } else if (doc === "photo") {
    const photo = await readPhoto(q.photoFile).catch(() => null);
    if (!photo) return new Response("No photo", { status: 404 });
    return new Response(new Uint8Array(photo), { headers: { "Content-Type": "image/jpeg" } });
  } else {
    return new Response("Unknown document", { status: 404 });
  }
  return new Response(new Uint8Array(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${name}"` },
  });
}
