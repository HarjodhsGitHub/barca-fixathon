import { randomUUID } from "node:crypto";
import {
  QuoteSubmission,
  buildAudit,
  evaluateSubmission,
  quoteNumber,
  validUntil,
  validateSubmission,
} from "@/lib/quote";
import { SailsrepConflict, sailsrepStatus, validateConfiguration } from "@/lib/sailsrep";
import { listQuotes, saveQuote } from "@/lib/store";

export const runtime = "nodejs";

type QuoteRecordSailsrep = import("@/lib/quote").QuoteRecord["sailsrep"];

export async function GET() {
  const quotes = await listQuotes();
  return Response.json(
    quotes.map((q) => ({ id: q.id, number: q.number, createdAt: q.createdAt, customer: q.customer.company })),
  );
}

export async function POST(request: Request) {
  const parsed = QuoteSubmission.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid quote", issues: parsed.error.issues.slice(0, 5) }, { status: 400 });
  }
  const sub = parsed.data;
  const invalid = validateSubmission(sub);
  if (invalid) return Response.json({ error: invalid }, { status: 422 });
  const { evaluation, error } = evaluateSubmission(sub);
  if (error) return Response.json({ error }, { status: 422 });

  // Sailsrep is the CPQ of record: the full configuration must pass its rules too.
  const status = sailsrepStatus();
  let sailsrep: QuoteRecordSailsrep = {
    validated: false,
    tenant: status.tenant,
    configurationId: null,
    catalogVersion: null,
    note: status.configured ? null : `Not validated in Sailsrep: ${status.reason}.`,
  };
  if (status.configured) {
    try {
      const v = await validateConfiguration({
        material: sub.stream.material,
        contamination: sub.stream.contamination,
        route: sub.chosenRoute,
        containerId: sub.config.containerId,
        frequencyId: sub.config.frequencyId,
      });
      sailsrep = { ...sailsrep, validated: true, configurationId: v.configurationId, catalogVersion: v.catalogVersion };
    } catch (e) {
      if (e instanceof SailsrepConflict) {
        return Response.json({ error: `Sailsrep rejected this configuration: ${e.message}` }, { status: 422 });
      }
      sailsrep.note = `Sailsrep unreachable, validated against the local copy of the rules only (${e instanceof Error ? e.message : String(e)}).`;
    }
  }

  const match = sub.photo.dataUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
  if (!match) return Response.json({ error: "Photo must be a JPEG, PNG or WebP data URL." }, { status: 400 });
  const ext = match[1] === "jpeg" ? "jpg" : match[1];
  const bytes = Buffer.from(match[2], "base64");

  const now = new Date();
  const chosen = evaluation.routes.find((r) => r.route === sub.chosenRoute)!;
  const record = await saveQuote(
    (seq) => ({
      id: randomUUID(),
      number: quoteNumber(seq, now),
      createdAt: now.toISOString(),
      validUntil: validUntil(now),
      customer: sub.customer,
      vision: sub.vision,
      audit: buildAudit(sub),
      evaluation,
      chosenRoute: sub.chosenRoute,
      photoFile: "",
      usesSampleData: chosen.usesSampleData,
      sailsrep,
    }),
    { bytes, ext },
  );
  return Response.json({ id: record.id, number: record.number }, { status: 201 });
}
