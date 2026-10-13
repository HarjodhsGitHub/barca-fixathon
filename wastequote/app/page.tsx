import Link from "next/link";
import { eur, date } from "@/lib/format";
import { materialById } from "@/lib/data";
import { listQuotes } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const quotes = await listQuotes();
  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-10 sm:px-6">
      <section className="grid items-end gap-8 border-b border-line pb-10 md:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">CPQ for waste</div>
          <h1 className="mt-2 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Photo in. Priced, circular-first quote out.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-2">
            Photograph a customer&apos;s waste stream. Claude suggests the material, contamination, volume and EWC code; the rules open
            only the routes that are allowed; every route is priced side by side with its CO₂e.
          </p>
        </div>
        <div className="flex md:justify-end">
          <Link
            href="/quote/new"
            className="inline-flex items-center gap-3 rounded-xl bg-circular px-6 py-4 text-base font-medium text-white shadow-sm hover:bg-circular/90"
          >
            New quote from a photo
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Quotes</h2>
          <span className="text-xs text-muted">{quotes.length} accepted</span>
        </div>
        {quotes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-2 px-6 py-12 text-center text-sm text-muted">
            No quotes yet. Start with a photo, or use one of the demo photos.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <table className="w-full text-sm">
              <thead className="bg-sunken/60 text-left text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Quote</th>
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="px-4 py-2.5 font-medium">Stream</th>
                  <th className="px-4 py-2.5 font-medium">Route</th>
                  <th className="px-4 py-2.5 text-right font-medium">Per month</th>
                  <th className="px-4 py-2.5 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {quotes.map((q) => {
                  const r = q.evaluation.routes.find((x) => x.route === q.chosenRoute);
                  return (
                    <tr key={q.id} className="hover:bg-paper">
                      <td className="px-4 py-3 font-mono">
                        <Link href={`/quotes/${q.id}`} className="underline decoration-line-2 underline-offset-4 hover:decoration-ink">
                          {q.number}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{q.customer.company}</td>
                      <td className="px-4 py-3">
                        {materialById(q.evaluation.stream.material)?.name}{" "}
                        <span className="font-mono text-xs text-muted">{q.evaluation.stream.ewc}</span>
                      </td>
                      <td className="px-4 py-3">{r?.routeName}</td>
                      <td className="px-4 py-3 text-right font-mono tabular">{r?.price ? eur(r.price.totalPerMonth) : "–"}</td>
                      <td className="px-4 py-3 text-ink-2">{date(q.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
