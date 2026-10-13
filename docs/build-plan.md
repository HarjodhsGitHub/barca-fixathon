# Build plan

What we build in the 24 hours (Tue 13 Oct 18:00 → Wed 14 Oct 18:00), and what we build after. The why is in [the plan](climate-priorities-fixathon-plan.md).

## The demo in one sentence

A judge picks Barcelona and a budget; the tool shows which neighbourhoods carry the most climate risk, ranks 20–40 real projects in one euro value ("Climate Value", see the plan), picks the best mix of adaptation, mitigation and nature for the money, and shows how far that mix moves the city toward each goal in the cascade (city → Catalonia → Spain → EU → Paris). Every number clicks through to its source.

## Scope

**Built and working**

1. **Classify at scale.** The decision model (Jev, or Laya / Claude Haiku as fallback) reads a few hundred to a few thousand raw project records and tags each one with typed labels: adaptation / mitigation / both / nature, hazard, sector, co-benefits, which goals it contributes to, feasibility. This is the "AI is central" part: it's how a city gets from a pile of documents to a comparable catalogue.
2. **Score project × place.** For each of the ~73 Barcelona neighbourhoods (or 10 districts if time is short), score how well each intervention fits, from heat, people over 65, income, tree cover and flood exposure.
3. **Climate Value per euro.** For each project: health (DALYs averted), carbon (tCO2e × carbon price), losses avoided, nature value, all converted to euros with visible, adjustable factors. Low / central / high.
4. **Portfolio optimizer.** Budget in, best mix out. Constraints: emissions target met, equity floor (share of benefit to the most vulnerable neighbourhoods), never trade mitigation away for adaptation. Presets: "Paris first", "Lives first", "50:50".
5. **Goal cascade view.** Each goal (bioregion → city → regional → national → EU → Paris) shows the gap to target and how much the chosen mix closes it.
6. **Why panel and memo.** Click any number to see its source. A Claude agent writes a one-page brief for the city council.

**Shown, not built (mocked screens)**

- **Delivery marketplace.** A project card becomes a tender-ready package with matched, pre-qualified providers. This is the long-term revenue story.
- **Funder view.** The same portfolio, bundled for the EIB / Climate City Capital Hub.
- **Second city.** The same framework on a second city, to show it travels.

**Out of scope**

Logins, multi-tenant, real procurement, live data pipelines. We use static, pre-processed data files.

## Architecture

```
raw sources ──► ingest (Python notebooks) ──► classify (Jev typed questions) ──► catalogue.json
                                                                                     │
neighbourhood data (Open Data BCN, ASPB, Copernicus) ──► grid.geojson ──► project×place scoring
                                                                                     │
goals.json (cascade) ◄──────────── contribution calc ◄── optimizer (budget, constraints, weights)
                                                                                     │
                                                    Next.js UI: map · ranking · cascade · why · memo
```

| Piece | Choice | Why |
| --- | --- | --- |
| Frontend | Next.js + Tailwind, MapLibre GL (or Leaflet) | Fast, one repo, maps are free |
| Backend | Next.js API routes (TypeScript) | No second service to deploy |
| Data prep | Python + GeoPandas notebooks → JSON / GeoJSON in `data/` | We know it, and it's offline |
| Decision model | Jev via `@typesafe-ai/sdk` (`POST /v1/systemone`) | Typed answers with confidence; ~$34 per million calls |
| Fallback 1 | Laya (`laya-serve`), the same request shape, on a Colab / Kaggle T4 | Swap one base URL |
| Fallback 2 | Claude Haiku 5.5 with structured outputs | Always works; ~$60 per million calls with Batch |
| Memo | Claude (Sonnet 5.5) | Decision models output no text |
| Optimizer | Greedy by value-per-€ with constraint repair, or `javascript-lp-solver` | Runs in the browser, so it's transparent and instant when sliders move |
| Hosting | Vercel | One command |

### How we use the decision model

One call = one record (the state) + several narrow, typed questions. Example:

```json
{
  "model": "jev-latest",
  "state": {"title": "Superilla Sant Antoni green axis", "description": "...", "budget_eur": 4200000, "district": "Eixample"},
  "questions": {
    "action_type": {"type": "choice", "instructions": "Primary climate action type",
      "criteria": {"adaptation": "reduces exposure or vulnerability to climate impacts",
                   "mitigation": "reduces greenhouse gas emissions",
                   "both": "materially does both", "nature": "mainly restores ecosystems",
                   "neither": "no climate relevance"}},
    "hazard": {"type": "choice", "instructions": "Main climate hazard addressed",
      "criteria": {"heat": "heatwaves and urban heat", "pluvial_flood": "stormwater flooding",
                   "drought": "water scarcity", "coastal": "sea level and erosion", "none": "none"}},
    "feasibility": {"type": "score", "instructions": "Feasibility given budget, permits and timeline",
      "criteria": ["Blocked or unfunded", "Uncertain", "Funded and scheduled"]},
    "cobenefit_health": {"type": "choice", "instructions": "Does it deliver public-health co-benefits?",
      "criteria": {"yes": "explicit health benefit", "no": "no health benefit"}}
  }
}
```

Rules from the Jev and Laya docs:
- Compute numbers in code and pass them as words ("high heat", "low canopy"), because the model is not a calculator.
- Shuffle option order to avoid position bias.
- Use two-option `choice` questions instead of `noul`, which is label-biased in Laya.
- For taxonomies with more than about 20 labels, go coarse to fine.
- Gate on `confidence`: low-confidence answers go to Claude or a human, not into the ranking.
- Before trusting the outputs, hand-check 50–100 labelled examples (Claude as teacher, checked by us).

## Data we need (pre-process tonight)

| File | Contents | Sources |
| --- | --- | --- |
| `data/neighbourhoods.geojson` | Polygons + population, % over 65, income, tree canopy, summer surface temperature, flood exposure | Open Data BCN (CKAN API), INE, Copernicus Urban Atlas / Landsat LST, Barcelona Resilience Atlas |
| `data/heat_burden.json` | Climate-attributable heat deaths and DALYs by district | ASPB annual heat-mortality reports 2024 & 2025, ISGlobal, GBD baseline |
| `data/raw_projects/*` | Raw project records to classify | Barcelona Pla Clima measures and Climate Emergency Declaration (100 measures), Climate-ADAPT case studies, Project Drawdown, CORDIS, EU Innovation Fund |
| `data/interventions.json` | 15–25 intervention types: cost, effect range, lifetime, source | Literature: climate shelters, trees, cool roofs, superblocks, heat alerts, building retrofit, rooftop solar, SUDS / rain gardens, water reuse, transit electrification |
| `data/goals.json` | The goal cascade, with baseline, metric, target, deadline, legal status and source | See the table in the plan |
| `data/factors.json` | Climate Value conversion factors (€ per DALY, € per tCO2e, etc.) with low / central / high values and sources | See the plan |

## 24-hour timeline

| When | Gate | Who | Done when |
| --- | --- | --- | --- |
| Tue 18:00–19:00 | **G0 Setup** | all | Repo scaffold deployed to Vercel; Jev early-access request sent; Laya Colab running as backup; roles agreed |
| 19:00–23:00 | **G1 Data** | data ×2 | `neighbourhoods.geojson`, `heat_burden.json`, `goals.json`, `factors.json`, 20+ interventions with sources |
| 19:00–23:00 | **G1 Skeleton** | frontend | Map renders neighbourhoods; ranking list; budget slider wired to dummy data |
| 23:00–03:00 | **G2 Engine** | backend + data | Classification run over raw projects; Climate Value calc; optimizer returns a portfolio; cascade contributions computed |
| 03:00–08:00 | Sleep in shifts | — | At least 3–4 hours each |
| 08:00–12:00 | **G3 Integrated** | all | Real data end to end; why panel; presets; memo agent |
| 12:30 | **Expert feedback** | pitcher | 4 min per expert; ask each one: "Would a city pay for this? Who signs?" |
| 13:00–16:00 | **G4 Polish** | all | Fix from feedback; mock screens (marketplace, funder, second city); demo script rehearsed |
| 16:00–17:30 | **G5 Pitch** | pitcher + demo driver | Deck, 2 full rehearsals, backup video recording of the demo |
| 18:00 | **Submit** | — | — |

If a gate slips more than an hour, cut scope in this order: second city → funder view → marketplace mock → memo. The demo moment is never cut.

## Roles (confirm at kickoff)

| Role | Owns | Person |
| --- | --- | --- |
| Data & evidence | Neighbourhood data, heat burden, intervention catalogue, factors, sources | ? |
| Engine | Decision-model calls, Climate Value, optimizer, cascade | ? |
| Frontend | Map, ranking, sliders, why panel, mocks | ? |
| Story & business | Pitch, deck, expert interviews, business model, memo prompt | ? |

## After the Fixathon

| When | Milestone |
| --- | --- |
| Week 1 | Clean up the prototype; write to Barcelona's Climate Office, ASPB, ISGlobal and the AMB with the demo |
| 3–5 Nov 2026 | **Smart City Expo World Congress, Barcelona**: demo to cities, line up 3 pilot conversations |
| Month 1–3 | 1–2 paid pilots, kept under Spain's direct-award limit (€15k for services), or funded through NetZeroCities / Pathways2Resilience; replace literature defaults with the city's own data |
| Month 3–6 | Apply with 2 more cities to an EU innovation-procurement call (PCP/PPI); the funder view goes live with the EIB / Climate City Capital Hub |
| Month 6–18 | Delivery: pre-qualified providers inside framework agreements or dynamic purchasing systems; private-side pilots with homeowner associations (comunidades de propietarios) |
