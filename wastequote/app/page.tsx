import type { CSSProperties } from "react";
import Link from "next/link";
import { eur, date, signedKg } from "@/lib/format";
import { materialById, routes } from "@/lib/data";
import { listQuotes } from "@/lib/store";
import type { QuoteRecord } from "@/lib/quote";
import { SampleBadge } from "@/components/ui";
import { IconCamera, Plate, RouteName, RouteStrip, cn, routeColor, type StripCell } from "@/components/pricebook/marks";

export const dynamic = "force-dynamic";

function strip(q: QuoteRecord): StripCell[] {
  return q.evaluation.routes.map((r) => ({
    route: r.route,
    name: r.routeName,
    state: r.route === q.chosenRoute ? "chosen" : r.eligible ? "open" : "closed",
  }));
}

/**
 * The EU waste hierarchy as the product sees it: four routes, best first, all priced.
 * This is the page's one entrance moment: the bars draw in from the centre, top down.
 */
function Hierarchy() {
  const widths = [100, 82, 64, 46];
  return (
    <figure className="animate-rise anim-delay-150 rounded-xl border border-line bg-surface p-6 shadow-card sm:p-7">
      <figcaption>
        <div className="text-[15px] font-semibold tracking-[-0.01em]">Every quote prices all four routes</div>
        <p className="mt-1 max-w-[46ch] text-[13px] leading-snug text-ink-2">
          In EU waste hierarchy order, best first. The rules close the routes a stream may not take.
        </p>
      </figcaption>
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4">
        <ol className="space-y-2">
          {routes.map((r, i) => (
            <li key={r.id} className="flex justify-center">
              <div
                className="animate-grow-x flex h-11 items-center justify-between gap-2 rounded-[4px] border-l-[5px] px-3.5 text-[14px]"
                style={{
                  width: `${widths[i] ?? 46}%`,
                  borderColor: routeColor(r.id),
                  background: `color-mix(in srgb, ${routeColor(r.id)} 14%, white)`,
                  animationDelay: `${320 + i * 110}ms`,
                }}
              >
                <span className="animate-fade-in font-semibold" style={{ animationDelay: `${620 + i * 110}ms` }}>
                  {r.name}
                </span>
                <span
                  className="animate-fade-in hidden truncate text-[11px] text-ink-2 sm:inline"
                  style={{ animationDelay: `${700 + i * 110}ms` }}
                >
                  {r.hierarchy_level.split(",")[0]}
                </span>
              </div>
            </li>
          ))}
        </ol>
        <div className="animate-fade-in anim-delay-900 grid grid-rows-4 gap-y-2 text-[12px]">
          <div className="row-span-2 flex items-center border-l-2 border-circular pl-2.5 font-semibold text-circular">Circular</div>
          <div className="row-span-2 flex items-center border-l-2 border-line-2 pl-2.5 text-muted">Linear</div>
        </div>
      </div>
    </figure>
  );
}

export default async function Home() {
  const quotes = await listQuotes();
  const circular = quotes.filter((q) => q.evaluation.routes.find((r) => r.route === q.chosenRoute)?.circular).length;

  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-24 sm:px-6">
      <section className="relative isolate grid gap-10 border-b border-line py-12 md:grid-cols-[minmax(0,1fr)_minmax(0,460px)] md:items-center md:gap-14 md:py-20">
        {/* Engineering-paper grid behind the hierarchy, fading out towards the copy. */}
        <div
          aria-hidden
          className="animate-fade-in anim-delay-200 pointer-events-none absolute inset-y-0 right-0 left-1/3 -z-10 md:-right-6 [background-image:linear-gradient(var(--color-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-line)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_60%_70%_at_68%_50%,black,transparent)]"
        />
        <div className="stagger [--stagger-step:90ms]">
          <h1 className="max-w-[16ch] text-balance text-[40px] font-semibold leading-[1] tracking-[-0.035em] sm:text-[56px] lg:text-[66px]">
            Photo in. Priced, circular-first quote out.
          </h1>
          <p className="mt-6 max-w-[50ch] text-[17px] leading-relaxed text-ink-2 sm:text-[18px]">
            Photograph a customer&apos;s waste stream. AI vision suggests the material, contamination, volume and EWC code. The rules
            open only the routes that are allowed, and every route is priced side by side with its CO₂e.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href="/quote/new"
              className="press lift inline-flex items-center gap-3 rounded-xl bg-circular px-6 py-4 text-[16px] font-semibold text-white shadow-card hover:bg-circular-ink"
            >
              <IconCamera />
              New quote from a photo
            </Link>
            <Link href="/pricebook" className="draw-underline pb-0.5 text-[15px] font-medium text-ink-2 hover:text-ink">
              See where every number comes from
            </Link>
          </div>
        </div>
        <Hierarchy />
      </section>

      <section className="mt-14">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="animate-rise anim-delay-300">
            <h2 className="text-[28px] font-semibold tracking-[-0.025em]">Quotes</h2>
            <p className="mt-1 text-[14px] text-ink-2">
              {quotes.length === 0 ? (
                "Accepted quotes appear here."
              ) : (
                <>
                  <span className="font-mono font-medium tabular text-ink">{quotes.length}</span> accepted,{" "}
                  <span className="font-mono font-medium tabular text-circular">{circular}</span> on a circular route.
                </>
              )}
            </p>
          </div>
          {quotes.length > 0 && (
            <div className="animate-fade-in anim-delay-500 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-2" aria-hidden>
              <span className="inline-flex items-center gap-1.5">
                <span className="block h-3 w-3 rounded-[2px] bg-line-2 ring-2 ring-ink ring-offset-1 ring-offset-paper" /> Accepted
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="block h-3 w-3 rounded-[2px] bg-line-2" /> Allowed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="hatch block h-3 w-3 rounded-[2px] border border-line-2" /> Not allowed
              </span>
            </div>
          )}
        </div>

        {quotes.length === 0 ? (
          <div className="animate-rise anim-delay-400 flex flex-col items-start gap-5 rounded-xl border border-dashed border-line-2 px-6 py-12 sm:items-center sm:text-center">
            <p className="max-w-[46ch] text-[15px] text-ink-2">
              No quotes yet. Start with a photo of a bin, skip or pile, or pick one of the demo photos.
            </p>
            <Link href="/quote/new" className="press rounded-lg bg-ink px-5 py-3 text-[14px] font-medium text-white hover:bg-ink/85">
              New quote from a photo
            </Link>
          </div>
        ) : (
          <>
            {/* Wide screens: a table. */}
            <div className="animate-rise anim-delay-400 hidden overflow-hidden rounded-xl border border-line bg-surface shadow-card md:block">
              <table className="w-full text-[14px]">
                <thead className="border-b border-line bg-tablehead text-left text-[12px] text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Quote</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Stream</th>
                    <th className="px-4 py-3 font-medium">Routes</th>
                    <th className="px-4 py-3 font-medium">Accepted</th>
                    <th className="px-4 py-3 text-right font-medium">Per month</th>
                    <th className="px-4 py-3 text-right font-medium">CO₂e kg/t</th>
                    <th className="px-5 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="stagger divide-y divide-line [--stagger-start:520ms] [--stagger-step:60ms]">
                  {quotes.map((q) => {
                    const r = q.evaluation.routes.find((x) => x.route === q.chosenRoute);
                    return (
                      <tr
                        key={q.id}
                        style={{ "--route": routeColor(q.chosenRoute) } as CSSProperties}
                        className="group relative align-top transition-[background-color,box-shadow] duration-300 ease-out-quart hover:bg-paper/60 hover:shadow-[inset_4px_0_0_var(--route)]"
                      >
                        <td className="px-5 py-4">
                          <Link
                            href={`/quotes/${q.id}`}
                            className="font-mono text-[14px] font-medium after:absolute after:inset-0 group-hover:text-circular"
                          >
                            {q.number}
                          </Link>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium">{q.customer.company}</div>
                          <div className="mt-0.5 text-[12px] text-muted">{q.customer.site}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div>{materialById(q.evaluation.stream.material)?.name}</div>
                          <Plate className="mt-1">{q.evaluation.stream.ewc}</Plate>
                        </td>
                        <td className="px-4 py-4 pt-[18px]">
                          <RouteStrip cells={strip(q)} />
                        </td>
                        <td className="px-4 py-4">{r && <RouteName route={r.route} name={r.routeName} className="font-medium" />}</td>
                        <td className="px-4 py-4 text-right">
                          <div className="font-mono text-[16px] font-medium tabular">{r?.price ? eur(r.price.totalPerMonth) : "–"}</div>
                          {q.usesSampleData && (
                            <div className="mt-1.5">
                              <SampleBadge />
                            </div>
                          )}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-4 text-right font-mono tabular",
                            r?.co2 && r.co2.totalKgPerT < 0 ? "font-medium text-circular" : "text-ink-2",
                          )}
                        >
                          {r?.co2 ? signedKg(r.co2.totalKgPerT) : "–"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-ink-2">
                          <span className="flex items-center justify-between gap-3">
                            {date(q.createdAt)}
                            <svg
                              viewBox="0 0 16 16"
                              className="h-4 w-4 -translate-x-1 text-muted opacity-0 transition-all duration-300 ease-out-quart group-hover:translate-x-0 group-hover:opacity-100"
                              aria-hidden
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                            >
                              <path d="M6 3.5L10.5 8 6 12.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Phones: one card per quote. */}
            <ul className="stagger space-y-3 [--stagger-start:400ms] md:hidden">
              {quotes.map((q) => {
                const r = q.evaluation.routes.find((x) => x.route === q.chosenRoute);
                return (
                  <li key={q.id}>
                    <Link
                      href={`/quotes/${q.id}`}
                      className="press block overflow-hidden rounded-xl border border-line bg-surface shadow-card active:bg-paper"
                    >
                      <div className="h-1" style={{ background: routeColor(q.chosenRoute) }} />
                      <div className="px-4 py-4">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-mono text-[13px] font-medium">{q.number}</span>
                          <span className="text-[12px] text-muted">{date(q.createdAt)}</span>
                        </div>
                        <div className="mt-2 text-[15px] font-medium leading-snug">{q.customer.company}</div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-ink-2">
                          {materialById(q.evaluation.stream.material)?.name}
                          <Plate>{q.evaluation.stream.ewc}</Plate>
                        </div>
                        <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3">
                          <span className="flex flex-col gap-1.5">
                            <RouteStrip cells={strip(q)} />
                            {r && <span className="text-[13px] font-medium">{r.routeName}</span>}
                          </span>
                          <span className="text-right">
                            <span className="block font-mono text-[20px] font-medium leading-none tabular">
                              {r?.price ? eur(r.price.totalPerMonth) : "–"}
                            </span>
                            <span className="mt-1 block text-[11px] text-muted">per month</span>
                          </span>
                        </div>
                        {q.usesSampleData && (
                          <div className="mt-3">
                            <SampleBadge />
                          </div>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
