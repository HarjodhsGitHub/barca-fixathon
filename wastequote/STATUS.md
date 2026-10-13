# Selinsight: status

Running log for the overnight build (13-14 October 2026). Newest state first. Selinsight was called WasteQuote until 14 October; the folder, the package and the Sailsrep tenant id keep the old name.

## Where it stands

The demo works end to end: photo → AI classification with confidence flags → configure → every route priced side by side with CO₂e → accept → quote PDF and draft waste transfer note. Tested in the browser with the live Sailsrep API on 14 Oct (see DEMO.md). `npm test`, `npm run typecheck` and `npm run lint` pass.

## Real, sample or faked

### Real (sourced or live)

| What | Source |
| --- | --- |
| AI vision | **Live**, through the Sailsrep assistant (Configurator API chat with the photo as an attachment). Tested: the builders' skip photo took 29-35 s and came back as mixed C&D, with the stream and contamination set in the Sailsrep configuration. The direct Claude path (`claude-opus-5-5`, structured output) is implemented and typechecks but was **not run**: there was no Anthropic key on this machine and none is needed. |
| Route and container eligibility | Live from the Sailsrep CPQ tenant `wastequote-waste-collection-service-2610132242` (catalog v3, 5 modules, 40 variants, 15 dependencies). Generated from `data/eligibility.json` + `containers.json`. A smoke test against the live API passes: 5 valid configurations accepted, 6 invalid ones stopped by the right rule. |
| Follow-up chat and specs | Live Sailsrep assistant on the quote's own configuration; specs are the catalog's variant descriptions. |
| Legal rules | EU Landfill Directive Art. 5(3)(f) (no landfill of separately collected recyclables), Spain Ley 7/2022 art. 25.1 (no incineration or landfill of separately collected recyclables), WFD hierarchy and R/D operation codes. |
| Taxes | Catalonia 2026: landfill of non-municipal non-hazardous waste €25/t, R1 incineration €15/t (Decret llei 3/2026). |
| EWC codes | Commission Decision 2014/955/EU wording (verified on the legislation.gov.uk copy). |
| Bulk densities | US EPA Volume-to-Weight Conversion Factors (2016). |
| Emission factors | Net (used for the comparison): US EPA WARM v16. Reporting basis (shown in the drawer): UK DESNZ 2026. Lorry: DESNZ 2026 rigid HGV >17 t. Proxies are labelled in the notes: WARM has no LDPE recycling factor and no wood chip-recycling factor, and DESNZ has no reuse factor. |
| Cardboard rebate | €71/t, REPACAR Spain Q2 2026, grade 1.04. |

### Sample (marked `is_sample: true`, striped badge in the UI)

- **Gate fees.** UK WRAP 2025/26 medians converted at the ECB rate (13 Oct 2026). No Spanish gate-fee survey exists publicly. Mixed C&D recycling (€45/t) and RDF (€95/t) are plain sample values.
- **Other rebates.** Steel and wood come from UK letsrecycle, converted. Film, reused pallets and reused metal offcuts are assumptions.
- **Contamination surcharges and rebate factors.**
- **Containers.** Rent, lift fees and payloads, plus the 3:1 compaction ratio.
- **Transport.** Cost per km, and the share of a collection round charged per wheelie-bin lift.
- **Fill factor** (85%).
- **Facilities and distances.** Treatment facility names and default distances are fictional.
- **Company acceptance rules.** For example "paper mills reject wet cardboard". They are realistic but not taken from a specific company.
- **Mixed C&D emission factors.** A composite of WARM component factors weighted by an assumed renovation-skip mix (60% inert, 15% wood, 15% plasterboard, 5% plastics, 5% metals). Marked sample.
- **Seller and customer.** The seller (Northwind Recycling, registration numbers) and the customer (Acme Fabrication) are fictional.

### Faked or stubbed (labelled in the UI)

- **Vision stub.** With no Sailsrep key and no Anthropic key, the four demo photos return a recorded classification from `demo/vision-fixtures.json`, written by Claude (the coding agent) looking at the photos, so it is not live inference. Any other photo returns empty, zero-confidence fields to fill by hand. The UI says "Vision stub · recorded result, not live".
- **Waste transfer note.** A draft following the UK duty-of-care sections A-D, with a pointer to Spain's documento de identificación (RD 553/2020). It is not a legal document.
- **Confidence scores.** These are the model's own estimates, not calibrated.

## Done

1. Data tables in `/data` with `source` and `is_sample` on every row; research notes in `data/SOURCES.md`.
2. Deterministic engine: eligibility (deny wins, default deny), capacity and payload checks, price lines with formula and citations, CO₂e (net + reporting, transport beyond the 25 km already in the factors).
3. Vision: Sailsrep assistant (default), Claude direct (optional), labelled stub; normalisation of loose model output; fields under 0.7 must be confirmed.
4. Sailsrep: model exported from `/data`, three catalog versions uploaded, live availability, specs, chat, validation on accept. A test key with `price` scope only, so the `/quote` endpoint that sends email is never called.
5. Wizard UI, quote page, quote PDF, draft WTN PDF, JSON quote store.
6. Docs: README (one command), DEMO (60 s script), this file. Design pass on the shell, home, quote page and price book by a parallel agent.

## Next (if there is time)

- Apply the remaining wizard design fixes from `DESIGN-NOTES.md`.
- Mobile pass at 390 px on the compare step.
- Prices as a Sailsrep price list: the API supports formulas over numeric inputs, so per-tonne pricing could move into the tenant instead of `lib/engine`. The import format for formulas is not documented in what we have, so it stays local for now.
- Stream the Sailsrep `activity` events during vision so the 30 s wait shows progress.
- Revoke the demo API key after the event (Sailsrep Admin `revoke_api_key`, key hint `ss_test_…e34f`).

## Open issues and known limits

- **Live vision is slow.** The Sailsrep vision call takes about 30-40 s. DEMO.md fills the wait with narration; `WASTEQUOTE_VISION=stub` is the offline fallback.
- **Live classification can differ from the recorded one.** Both live runs graded the skip photo "high" contamination; the recorded stub result says "medium". The demo script handles either (switching High to Medium opens recycling). Volume estimates also vary between runs, so the demo numbers do too.
- **The demo key is only on this machine.** The Sailsrep key lives in `sailsrep/keys/` (gitignored). A fresh clone runs on the local rules and the stub until someone sets `SAILSREP_API_KEY`.
- **No auth (per spec).** Anyone who can reach the server can classify photos, chat and read quotes. The dev server binds to 127.0.0.1 by default. Configuration ids are validated before they reach a Sailsrep URL, but any caller can address any configuration of the demo tenant.
- **Client-supplied vision result.** `POST /api/quotes` trusts the vision result the browser sends for the audit trail. Prices and eligibility are always recomputed on the server.
- **Rules live in two places.** They are generated from `/data` into Sailsrep. Edit `/data` and re-export; editing the rules in the Sailsrep portal makes the app show a mismatch warning.
- **Ambiguous mixed streams.** WARM rates wood landfilling as net negative (carbon storage), and combustion slightly above AD for food waste. These are shown honestly, so "Lowest CO₂e" is not always the circular route.
