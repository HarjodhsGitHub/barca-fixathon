import Link from "next/link";
import { notFound } from "next/navigation";
import { containerById, ewcByCode, frequencyById, materialById } from "@/lib/data";
import { date, eur, eur2, signedKg, tonnes } from "@/lib/format";
import { getQuote } from "@/lib/store";
import { CONFIDENCE_THRESHOLD } from "@/lib/vision/schema";

export const dynamic = "force-dynamic";

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = await getQuote(id);
  if (!q) notFound();
  const ev = q.evaluation;
  const chosen = ev.routes.find((r) => r.route === q.chosenRoute)!;
  const material = materialById(ev.stream.material)!;
  const container = containerById(ev.config.containerId)!;
  const freq = frequencyById(ev.config.frequencyId)!;

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-8 sm:px-6">
      <Link href="/" className="text-sm text-ink-2 hover:text-ink">
        ← All quotes
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">Accepted quote</div>
          <h1 className="text-3xl font-semibold tracking-tight">{q.number}</h1>
          <p className="mt-1 text-sm text-ink-2">
            {q.customer.company} · {q.customer.site} · issued {date(q.createdAt)}, valid until {date(q.validUntil)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/quotes/${q.id}/quote.pdf`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-ink/85"
          >
            Quote PDF
          </a>
          <a
            href={`/api/quotes/${q.id}/wtn.pdf`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border border-line-2 bg-surface px-4 py-2.5 text-sm font-medium hover:border-ink"
          >
            Waste transfer note (draft)
          </a>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-circular/40 bg-circular-soft p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-circular">
              {chosen.circular ? "Circular route accepted" : "Route accepted"}
            </div>
            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <div className="text-xl font-semibold">
                  {chosen.routeName}: {chosen.treatmentName}
                </div>
                <div className="text-sm text-ink-2">
                  {ev.config.containerCount} × {container.name} · {freq.name.toLowerCase()} · {chosen.facilityName} · {chosen.rdCode}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-semibold tabular">{eur(chosen.price!.totalPerMonth)}</div>
                <div className="font-mono text-xs text-ink-2">
                  {eur2(chosen.price!.perTonne)}/t · {signedKg(chosen.co2!.totalKgPerT)} kg CO₂e/t
                </div>
              </div>
            </div>
            {q.usesSampleData && <p className="mt-3 text-xs text-flag">Built partly on sample prices or factors (see the price book). Indicative.</p>}
          </div>

          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <table className="w-full text-sm">
              <thead className="bg-sunken/60 text-left text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Route</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Per month</th>
                  <th className="px-4 py-2.5 text-right font-medium">CO₂e / t</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ev.routes.map((r) => (
                  <tr key={r.route} className={r.route === chosen.route ? "bg-circular-soft/60" : undefined}>
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{r.routeName}</div>
                      <div className="text-xs text-muted">{r.eligible ? r.treatmentName : r.rules.find((h) => h.effect === "deny")?.text}</div>
                    </td>
                    <td className="px-4 py-2.5 text-ink-2">{r.route === chosen.route ? "Accepted" : r.eligible ? "Available" : "Not allowed"}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular">{r.price ? eur(r.price.totalPerMonth) : "–"}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular">{r.co2 ? signedKg(r.co2.totalKgPerT) : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold">AI classification vs final quote</h2>
            <p className="mt-0.5 text-xs text-muted">
              {q.vision.mode === "claude"
                ? `Claude vision (${q.vision.model}), ${(q.vision.ms / 1000).toFixed(1)} s.`
                : "Vision stub: recorded demo classification, not live inference."}{" "}
              Fields under {Math.round(CONFIDENCE_THRESHOLD * 100)}% confidence had to be confirmed.
            </p>
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="py-1.5 font-medium">Field</th>
                  <th className="py-1.5 font-medium">AI</th>
                  <th className="py-1.5 font-medium">Confidence</th>
                  <th className="py-1.5 font-medium">Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {q.audit.map((a) => (
                  <tr key={a.field}>
                    <td className="py-2">{a.field}</td>
                    <td className="py-2 text-ink-2">{a.ai}</td>
                    <td className={`py-2 font-mono tabular ${a.aiConfidence < CONFIDENCE_THRESHOLD ? "text-flag" : "text-ink-2"}`}>
                      {Math.round(a.aiConfidence * 100)}%
                    </td>
                    <td className="py-2">
                      {a.final}{" "}
                      <span className="text-xs text-muted">{a.changed ? "· changed by salesperson" : a.confirmed ? "· confirmed" : ""}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/quotes/${q.id}/photo`} alt="Waste stream" className="w-full rounded-xl border border-line object-cover" />
          <dl className="space-y-2 rounded-xl border border-line bg-surface p-4 text-sm">
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted">Stream</dt>
              <dd>{material.name}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted">EWC</dt>
              <dd>
                <span className="font-mono">{ev.stream.ewc}</span> <span className="text-xs text-muted">{ewcByCode(ev.stream.ewc)?.description}</span>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted">Quantity</dt>
              <dd>
                {ev.stream.volumePerWeekM3} m³/week · ≈ {tonnes(ev.capacity.tonnesPerMonth)} t/month
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted">Sailsrep CPQ</dt>
              <dd className="text-xs text-ink-2">
                {q.sailsrep.validated ? (
                  <>
                    Validated · configuration <span className="font-mono">{q.sailsrep.configurationId}</span> · tenant{" "}
                    <span className="font-mono">{q.sailsrep.tenant}</span>
                  </>
                ) : (
                  q.sailsrep.note
                )}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
