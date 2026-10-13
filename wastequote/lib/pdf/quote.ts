// The one-page customer quote.
import { company, containerById, ewcByCode, frequencyById, materialById } from "../data";
import type { QuoteRecord } from "../quote";
import { A4, C, M, box, eurPdf, eurPdf0, hr, kgPdf, label, newKit, text } from "./kit";

const d = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export async function quotePdf(q: QuoteRecord, photo: Uint8Array | null): Promise<Uint8Array> {
  const k = await newKit(`Quote ${q.number}`);
  const ev = q.evaluation;
  const s = ev.stream;
  const chosen = ev.routes.find((r) => r.route === q.chosenRoute)!;
  const material = materialById(s.material)!;
  const container = containerById(ev.config.containerId)!;
  const freq = frequencyById(ev.config.frequencyId)!;
  const W = A4.w - 2 * M;

  // ---- header band
  box(k, 0, A4.h - 92, A4.w, 92, C.ink);
  text(k, "QUOTE · WASTE COLLECTION SERVICE", M, A4.h - 38, { size: 8, font: k.bold, color: rgbMuted() });
  text(k, q.number, M, A4.h - 60, { size: 20, font: k.bold, color: C.white });
  text(k, `Issued ${d(q.createdAt)} · valid until ${d(q.validUntil)}`, M, A4.h - 76, { size: 8.5, color: rgbMuted() });
  text(k, company.seller.name, A4.w - M, A4.h - 40, { size: 9, font: k.bold, color: C.white, align: "right" });
  text(k, company.seller.address, A4.w - M, A4.h - 53, { size: 7.5, color: rgbMuted(), align: "right" });
  text(k, `${company.seller.phone} · ${company.seller.email}`, A4.w - M, A4.h - 64, { size: 7.5, color: rgbMuted(), align: "right" });
  text(k, `Carrier reg. ${company.seller.carrier_registration}`, A4.w - M, A4.h - 75, { size: 7.5, color: rgbMuted(), align: "right" });

  // ---- customer + stream
  let y = A4.h - 116;
  label(k, "Customer", M, y);
  text(k, q.customer.company, M, y - 12, { size: 10.5, font: k.bold });
  text(k, q.customer.site, M, y - 25, { size: 8.5, color: C.ink2 });
  if (q.customer.contact) text(k, `Attn: ${q.customer.contact}`, M, y - 36, { size: 8.5, color: C.ink2 });

  const colX = M + W * 0.42;
  label(k, "Waste stream", colX, y);
  text(k, `${material.name} · EWC ${s.ewc}`, colX, y - 12, { size: 10.5, font: k.bold });
  text(k, ewcByCode(s.ewc)?.description ?? "", colX, y - 25, { size: 8, color: C.ink2, maxWidth: W * 0.58 - 100 });
  text(
    k,
    `Contamination ${s.contamination} · ${s.volumePerWeekM3} m³/week · about ${ev.capacity.tonnesPerMonth.toFixed(1)} t/month`,
    colX,
    y - 46,
    { size: 8, color: C.ink2 },
  );

  // photo, top right of the stream block
  if (photo) {
    try {
      const img = await k.doc.embedJpg(photo);
      const h = 64;
      const w = Math.min(96, (img.width / img.height) * h);
      k.page.drawImage(img, { x: A4.w - M - w, y: y - 54, width: w, height: h });
    } catch {
      /* not a JPEG: skip the thumbnail */
    }
  }

  y -= 66;
  y = text(k, q.vision.result.summary, M, y, { size: 8, color: C.ink2, maxWidth: W - 110 }) - 2;
  const vis =
    q.vision.mode === "sailsrep"
      ? "Classified from a site photo by the Sailsrep CPQ assistant, confirmed by the salesperson."
      : q.vision.mode === "claude"
        ? `Classified from a site photo with ${q.vision.model}, confirmed by the salesperson.`
        : "Classified by the salesperson from a site photo (recorded demo classification, no live AI).";
  text(k, vis, M, y, { size: 7, color: C.muted });

  // ---- chosen service
  y -= 20;
  hr(k, y + 8);
  label(k, "Proposed service", M, y);
  box(k, M, y - 50, W, 42, chosen.circular ? C.circularSoft : C.paper);
  text(k, `${chosen.routeName}: ${chosen.treatmentName}`, M + 10, y - 22, { size: 12, font: k.bold, color: chosen.circular ? C.circular : C.ink });
  text(
    k,
    `${ev.config.containerCount} × ${container.name} · ${freq.name.toLowerCase()} · ${chosen.facilityName} · operation ${chosen.rdCode} · ${
      ev.config.distanceKm[chosen.route] ?? 0
    } km`,
    M + 10,
    y - 37,
    { size: 8, color: C.ink2 },
  );
  text(k, `${eurPdf0(chosen.price!.totalPerMonth)} / month`, A4.w - M - 10, y - 24, { size: 14, font: k.bold, align: "right" });
  text(k, `${eurPdf(chosen.price!.perTonne)} per tonne · excl. VAT`, A4.w - M - 10, y - 37, { size: 7.5, color: C.ink2, align: "right" });

  // ---- price lines
  y -= 66;
  label(k, "Monthly price breakdown", M, y);
  y -= 6;
  for (const l of chosen.price!.lines) {
    y -= 13;
    text(k, l.label, M, y, { size: 8.5 });
    text(k, l.formula, M + 170, y, { size: 6.8, font: k.mono, color: C.muted, maxWidth: W - 250 });
    text(k, eurPdf(l.amount), A4.w - M, y, { size: 8.5, align: "right", color: l.amount < 0 ? C.circular : C.ink });
  }
  y -= 7;
  hr(k, y);
  y -= 12;
  text(k, "Total per month", M, y, { size: 9, font: k.bold });
  text(k, eurPdf(chosen.price!.totalPerMonth), A4.w - M, y, { size: 9, font: k.bold, align: "right" });
  y -= 12;
  text(k, "Indicative per year", M, y, { size: 8, color: C.ink2 });
  text(k, eurPdf(chosen.price!.totalPerMonth * 12), A4.w - M, y, { size: 8, color: C.ink2, align: "right" });

  // ---- all routes compared
  y -= 26;
  hr(k, y + 8);
  label(k, "Every treatment route for this stream", M, y);
  y -= 4;
  const cols = [M, M + 120, M + 270, M + 350, M + 440];
  const head = ["Route", "Treatment", "Per month", "CO2e per tonne", "Status"];
  y -= 11;
  head.forEach((h, i) => text(k, h, cols[i], y, { size: 7, font: k.bold, color: C.muted }));
  for (const r of ev.routes) {
    y -= 13;
    const isChosen = r.route === chosen.route;
    if (isChosen) box(k, M - 4, y - 3.5, W + 8, 12, C.circularSoft);
    const f = isChosen ? k.bold : k.font;
    text(k, `${r.routeName}${r.circular ? " (circular)" : ""}`, cols[0], y, { size: 8, font: f });
    text(k, r.eligible ? r.treatmentName : "-", cols[1], y, { size: 7.5, color: C.ink2, maxWidth: 145 });
    text(k, r.price ? eurPdf0(r.price.totalPerMonth) : "-", cols[2], y, { size: 8, font: f });
    text(k, r.co2 ? kgPdf(r.co2.totalKgPerT) : "-", cols[3], y, { size: 8, font: f, color: r.co2 && r.co2.totalKgPerT < 0 ? C.circular : C.ink });
    const deny = r.rules.find((h) => h.effect === "deny");
    text(k, r.eligible ? (isChosen ? "Proposed" : "Available") : `Not allowed (${deny?.ruleId ?? "-"})`, cols[4], y, {
      size: 7.5,
      color: r.eligible ? C.ink2 : C.muted,
    });
  }

  // ---- climate line
  const worst = ev.routes.filter((r) => r.eligible && r.co2 && r.route !== chosen.route).sort((a, b) => b.co2!.totalKgPerT - a.co2!.totalKgPerT)[0];
  y -= 22;
  if (worst && chosen.co2) {
    const t = ((worst.co2!.totalKgPerT - chosen.co2.totalKgPerT) * ev.capacity.tonnesPerMonth * 12) / 1000;
    if (t > 0) {
      box(k, M, y - 8, W, 20, C.circularSoft);
      text(
        k,
        `Choosing ${chosen.routeName.toLowerCase()} over ${worst.routeName.toLowerCase()} avoids about ${t.toFixed(1)} t CO2e a year (lifecycle factors incl. avoided virgin material; transport included).`,
        M + 8,
        y - 1,
        { size: 8, color: C.circular, font: k.bold, maxWidth: W - 16 },
      );
      y -= 26;
    }
  }

  // ---- why each route is open or closed
  y -= 4;
  hr(k, y + 8);
  label(k, "Rules applied", M, y);
  y -= 4;
  for (const r of ev.routes) {
    const deciding = r.rules.find((h) => h.effect === (r.eligible ? "allow" : "deny"));
    if (!deciding) continue;
    y -= 11;
    if (y < 150) break;
    text(k, `${r.routeName}`, M, y, { size: 7.5, font: k.bold });
    const next = text(k, `${deciding.ruleId} · ${deciding.text} (${deciding.source})`, M + 70, y, {
      size: 7.2,
      color: r.eligible ? C.ink2 : C.muted,
      maxWidth: W - 70,
    });
    y = next + 9;
  }

  // ---- footer: terms, provenance
  let fy = 112;
  hr(k, fy + 10);
  if (q.usesSampleData) {
    box(k, M, fy - 22, W, 26, C.flagSoft);
    text(
      k,
      "SAMPLE DATA: some prices or factors in this quote come from sample tables marked is_sample in the Selinsight price book. Indicative only; not an offer until confirmed against the seller's price list.",
      M + 8,
      fy - 6,
      { size: 7, color: C.flag, maxWidth: W - 16 },
    );
    fy -= 34;
  }
  text(
    k,
    `${company.quote_terms.vat_note} Valid ${company.quote_terms.valid_days} days. Weights are estimated from volume and bulk density; invoicing follows weighbridge tickets. Routes are opened or closed by the eligibility rules in the price book, and the configuration was ${
      q.sailsrep.validated ? `validated in Sailsrep CPQ (configuration ${q.sailsrep.configurationId})` : "checked against the local copy of the rules"
    }.`,
    M,
    fy,
    { size: 7, color: C.ink2, maxWidth: W },
  );
  text(k, "Emission factors: US EPA WARM v16 (net, incl. avoided production) and UK DESNZ 2026 (reporting basis), see price book.", M, 44, {
    size: 6.5,
    color: C.muted,
    maxWidth: W,
  });
  text(k, `Selinsight · ${q.number}`, A4.w - M, 30, { size: 6.5, color: C.muted, align: "right" });
  return k.doc.save();
}

function rgbMuted() {
  return C.line;
}
