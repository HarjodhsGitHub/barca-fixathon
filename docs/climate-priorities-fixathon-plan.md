# Climate Priorities — plan

**One-liner:** a Global Burden of Disease for climate action. One euro value lets a city compare every adaptation, mitigation and nature project, pick the best mix for its budget, see how that mix moves it toward its bioregional, regional, national and Paris goals, and then get it delivered.

How we build it: [build plan](build-plan.md). Event: Norrsken Fixathon, Track 1 ("translate climate plans into concrete needs and connect them with ready-to-scale solutions"), with a strong Track 2 angle.

---

## 1. The problem

Every city has climate goals and a stack of plans, but no way to compare a heat shelter, a flood tank, a solar programme and a river restoration on the same scale. They can't tell which mix gets them furthest toward their goals for the money.

- **The money is big and the choices are blind.** Barcelona's Pla Clima commits about €1.8bn to 2030, roughly €360M a year ([Betevé](https://beteve.cat/politica/pla-clima-barcelona-destina-1800-milions-euros-ciutat-verda-sostenible/)). Yet heat killed 865 people in Barcelona province in summer 2024 (ISGlobal, via [EbreDigital](https://ebredigital.cat/2025/09/22/un-estudi-associa-la-calor-de-lestiu-del-2024-amb-1-153-morts-a-catalunya-6-743-a-espanya-i-mes-de-62-700-a-europa)), and climate change caused about 630 heat deaths in summer 2025 ([Ara](https://en.ara.cat/environment/the-climate-crisis-has-tripled-heat-deaths-in-europe-this-summer_1_5499274.html)). Is the money going where the harm is?
- **Too many goals, on different baselines.** Barcelona answers to its own Pla Clima (−45% per capita vs 2005), its Climate Emergency Declaration (−50% vs 1992), the EU Cities Mission (neutrality by 2030), Catalonia, Spain's PNIEC (−32% vs 1990), the EU Climate Law (−55% by 2030, −90% by 2040), the EU Nature Restoration Law, and Paris. Each uses a different baseline and metric. Nobody sees how one project counts toward all of them.
- **Adaptation and mitigation are planned in silos.** Globally, mitigation took over 90% of climate finance and adaptation 7% ([CPI](https://www.climatepolicyinitiative.org/publication/global-landscape-of-climate-finance-2021/)), even though adaptation returns 2:1 to 10:1 ([Global Commission on Adaptation](https://www.wri.org/news/release-global-leaders-call-urgent-action-climate-adaptation-commission-finds-adaptation-can)).
- **Planning is consultant-driven, slow and one-off.** A climate plan costs a city from $40–60k (small cities) up to $5M (El Paso, AECOM) ([Deceleration](https://deceleration.news/el-paso-climate-planning/), [WFMZ](https://www.wfmz.com/news/area/lehighvalley/lehigh-county/allentown-area/allentown-awards-200k-contract-for-consultant-to-develop-climate-action-plan/article_4ac245ed-9e17-486f-b2a5-b7ed41ef59fe.html)). It is out of date the day it is printed.
- **Then the plan stalls at implementation.** The C40 Cities Finance Facility has moved 20 projects (about $650M) to finance in ten years, project by project, by hand ([UNFCCC](https://unfccc.int/node/256499)). The 112 EU Mission cities need about €650bn to reach neutrality ([Euronews](https://www.euronews.com/green/2024/06/26/project-partner-points-to-650bn-hole-in-eu-climate-neutral-cities-plan)).

**Why it hasn't been solved.** Health got a common unit (the DALY) and a global evidence base (GBD) 30 years ago. Climate never did. Adaptation, mitigation and nature each have their own metrics, and the COP30 Belém outcome adopted 59 adaptation indicators but deliberately no aggregate unit ([C2ES](https://www.c2es.org/wp-content/uploads/2026/03/Next-Steps-for-the-Belem-Adaptation-Indicators.pdf)). Until now, scoring every project against every place and every goal also needed an army of analysts.

**The story hook.** Ausubel, Meyer and Wernick showed that in 20th-century America, clean water and air did more against infectious disease than medicine did, and warned that the gains could be lost ([Technology in Society, 2001](https://www.sciencedirect.com/science/article/pii/S0160791X01000057)). Climate change is that protection slipping. We help cities choose the next generation of environmental infrastructure, and measure it the way GBD measures health.

---

## 2. The idea

Four layers, modelled on what made GBD work:

| GBD | Climate Priorities |
| --- | --- |
| One currency: the DALY | One currency: **Climate Value (€)**, with five visible ledgers (§3) |
| Burden by cause and country | Climate risk and emissions by neighbourhood, city and bioregion |
| Cost per DALY averted ranks interventions (DCP3, WHO-CHOICE) | € of Climate Value per € spent ranks projects |
| Open, versioned methods everyone builds on | Open factors file, sources on every number, expert and city input improve it |

The flow for a city:

1. **Diagnose.** Map hazards (heat, drought, flood, coast), vulnerability and emissions at neighbourhood level, inside the bioregion.
2. **Classify.** A decision model reads thousands of project records (the city's own measures, EU case studies, Drawdown, CORDIS, the Innovation Fund) and tags each one with typed labels: adaptation / mitigation / both / nature, hazard, co-benefits, feasibility, and which goals it serves (§5).
3. **Value.** Each project gets a Climate Value with low, central and high estimates.
4. **Optimize.** The budget goes in, and the best mix of adaptation, mitigation and nature comes out under constraints. The split between them is an *output*, not an assumption.
5. **Cascade.** Show how the mix closes the gap on each goal, from bioregion to Paris.
6. **Deliver** (long term). Each chosen project becomes a tender-ready package, matched with funders and pre-qualified providers (§7).

---

## 3. The common currency: Climate Value (€)

We picked euros because city finance teams, development banks and funders already think in them. A single number is only trusted if it can be taken apart, so every Climate Value is the sum of five ledgers that are always shown separately, with ranges. This follows GBD's lesson to keep *measuring* the burden separate from *weighing* it ([Anand & Reddy](https://sanjayreddy.org/wp-content/uploads/2022/10/SSRN-id3451311.pdf)).

| Ledger | What it counts | Conversion to € (low / **central** / high) | Source |
| --- | --- | --- | --- |
| **Health** | DALYs averted (heat, air pollution, active travel, green space) | €25k / **€70k** / €130k per DALY | Low: Spanish cost-effectiveness threshold (≈€20–25k/QALY, *verify*). High: UK Green Book (1 QALY ≈ 7 WELLBY × ≈€18.5k). Central: our stated midpoint |
| **Climate** | tCO2e avoided over the project's lifetime | €316 / **€375** / €1,050 per tCO2e (2030) | EIB shadow cost ([E3G](https://e3g.org/bank-metrics/shadow-carbon-pricing-eib)); UBA Methodenkonvention 4.0, 1% and 0% time preference ([UBA](https://www.umweltbundesamt.de/system/files/medien/384/bilder/dateien/6_Tab_UBA-Empfehlung-Klimakosten_2026-07-06_1.pdf)) |
| **Losses avoided** | Change in expected annual damage to buildings, infrastructure, water supply and the economy | € 1:1; optional equity weight that counts losses in poorer neighbourhoods more | Equity weighting as in the Green Book (elasticity ≈1.3, *verify*) |
| **Nature** | Ecosystem services *not already counted* above (water regulation, biodiversity, recreation) | Monetary values from the UN's ecosystem accounting framework (SEEA EA), ±50% | [SEEA](https://seea.un.org/node/3319). Its monetary chapters are not yet a formal standard, so we flag them as such |
| **Wellbeing** | Measured life-satisfaction effects (green space, noise, social cohesion) | ≈€18.5k per WELLBY | [HM Treasury Green Book wellbeing guidance](https://whatworkswellbeing.org/?p=10845), £13k in 2019 prices uprated to 2024 |

**Rules that make it defensible**

1. **No double counting.** Each benefit goes into exactly one ledger. For example, trees that avoid heat deaths count under Health, not Nature. The carbon price goes only in Climate, and local air pollution only in Health.
2. **Ledgers and ranges are always visible.** The total is never shown alone.
3. **The factors file is open and versioned.** Presets: "EU banks" (EIB), "Intergenerational" (UBA 0%), "Health-economics" (low DALY value). A sensitivity view shows whether the ranking changes.
4. **No universal "good value" threshold** (the WHO-CHOICE mistake). Each project is compared with the city's next-best alternative.
5. **Nature is also a floor, not just a price.** The EU Nature Restoration Law requires no net loss of urban green space and tree canopy, so we treat it as a hard constraint the optimizer can't trade away.
6. **Every project carries reporting tags:** the Belém adaptation targets (water, food, health, ecosystems, infrastructure, livelihoods, heritage) and SDGs. A city can then report under COP30 indicators without anyone forcing them into one number.
7. **Local weights over time.** Like GBD's disability-weight surveys, cities and residents can set their own equity weight, discount rate and nature treatment, and we show what changed.

The anchor case: Barcelona's superblocks are modelled at 667 premature deaths avoided a year, worth ~€1.7bn a year. That comes from NO₂ (291), noise (163), heat (117), green space (60) and active travel (36) ([ISGlobal/UPF](https://repositori.upf.edu/items/63850877-c5d4-42dc-93a1-8bdbe86bebc4/full)). That is exactly the multi-ledger view a city needs, and nobody computes it routinely for every option.

---

## 4. What we optimize

No study gives a universal "x% adaptation, y% mitigation" split, and none should. The split depends on how much a place emits and how exposed it is. Research gives us the structure and the defaults:

| Reference point | What it says | How we use it |
| --- | --- | --- |
| [Green Climate Fund allocation rule](https://www.greenclimate.fund/decision/b06-06) | 50:50 mitigation:adaptation; ≥50% of adaptation money to the most vulnerable | "50:50" preset; model for our equity floor |
| [CPI Global Landscape](https://www.climatepolicyinitiative.org/publication/global-landscape-of-climate-finance-2021/) | Mitigation over 90%, adaptation 7% | The status quo we compare against |
| [Bosello, Carraro & De Cian (2013)](https://ageconsearch.umn.edu/record/116907) | Mitigation and adaptation are complements; mitigate early | Never trade the emissions target away |
| [Chisari, Galiani & Miller (2016)](https://economia.lse.ac.uk/articles/46) | Small emitters get more from adaptation | Why a city's split leans to adaptation once its targets are met |

**The objective**

1. **Maximise** total Climate Value per euro.
2. **Subject to:**
   - the budget;
   - the city's binding emissions trajectory;
   - no net loss of green space and canopy;
   - an **equity floor**: at least 50% of the benefit reaches the most vulnerable neighbourhoods, by default.
3. **Mitigation** meets the target at lowest cost, preferring measures with local co-benefits such as shade, cooling and cleaner air.

Presets: **Paris first**, **Lives first**, **GCF 50:50**, and **Bioregion first** (where nature and water ledgers are weighted up).

---

## 5. The goal cascade and the bioregion

The spatial unit is the **bioregion**. Watersheds, ecosystems and heat don't stop at city limits. Barcelona sits in:
- **One Earth bioregion PA20**, Balearic Sea & West Mediterranean Mixed Forests ([One Earth](https://www.oneearth.org/bioregions/balearic-sea-west-mediterranean-mixed-forests-pa20); CC BY-NC, so commercial use needs a licence);
- the **Catalan internal river basin district**, run by the Catalan Water Agency (ACA), whose basin plan is €2.38bn for 2022–27 ([ACA](https://info.aca.gencat.cat/ca/aca/informacio/geco/plans-programes/PDG/CA/01-00-Pla-de-gestio-2022-27.pdf));
- the EU **Mediterranean biogeographical region** ([EEA](https://sdi.eea.europa.eu/catalogue/srv/api/records/5e884531-3b0e-4643-af14-ae6281d6fb24)).

A "sustainable bioregion" in the tool means two things: the bioregion's shared risks (drought in the Ter-Llobregat system, heat, coastal erosion) appear in the diagnosis, and its nature and water goals sit in the cascade alongside the climate goals.

**Barcelona's cascade (pilot data)**

| Level | Goal | Target | Deadline | Source |
| --- | --- | --- | --- | --- |
| Bioregion / basin | ACA river basin management plan | Good water status; €2.38bn of measures | 2027 | [ACA](https://info.aca.gencat.cat/ca/aca/informacio/geco/plans-programes/PDG/CA/01-00-Pla-de-gestio-2022-27.pdf) |
| City | Pla Clima 2018–2030 | −45% GHG per capita vs 2005; neutral by 2050 | 2030 / 2050 | [Climate Plan](https://barcelona.cat/barcelona-pel-clima/sites/default/files/climate_plan_maig.pdf) |
| City | Climate Emergency Declaration (2020) | −50% GHG vs 1992; 100 measures; €563M | 2030 | [barcelona.cat](https://barcelona.cat/emergenciaclimatica/es) |
| City | EU 100 Climate-Neutral Cities Mission (Mission Label, March 2024) | Climate neutrality | 2030 | [Ajuntament](https://ajuntament.barcelona.cat/ecologiaurbana/en/noticia/1383103) |
| City (nature) | Pla Natura; Tree Master Plan | +160 ha green space vs 2015; canopy 25% → 30% | 2030 / 2037 | [Nature Plan](https://ajuntament.barcelona.cat/ecologiaurbana/en/what-we-do-and-why/green-city-and-biodiversity/nature-plan) |
| Metropolitan (AMB) | Pla Clima i Energia 2030; signatory to the EU Adaptation Mission charter | −40% → aligned with −55%; neutral by 2050 | 2030 / 2050 | [Interreg](https://www.interregeurope.eu/good-practices/climate-energy-plan-2030-pla-clima-i-energia-2030) |
| Catalonia | Climate law 16/2017 (numeric targets annulled by the Constitutional Court in 2019); adaptation strategy ESCACC30 (312 measures) | Neutral by 2050 | 2030 / 2050 | [barcelona.cat](https://www.barcelona.cat/barcelona-pel-clima/en/compromisos-climatics/climate-change-law) |
| Spain | Climate law 7/2021; PNIEC 2023–30; adaptation plan PNACC 2021–30 | −32% GHG vs 1990; 81% renewable electricity | 2030 | [BOE](https://www.boe.es/buscar/act.php?id=BOE-A-2021-8447) |
| EU | European Climate Law (amended 2026) | −55% net by 2030; −90% net by 2040 | 2030 / 2040 | [EP](https://www.europarl.europa.eu/news/en/press-room/20260205IPR33620/eu-climate-law-a-2040-emissions-reduction-target-of-90-for-the-eu) |
| EU | Nature Restoration Regulation, Art. 8 | No net loss of urban green and canopy vs 2024 | 2030 | [NetworkNature](https://networknature.eu/networknature/article/restoring-urban-nature:-why-national-action-matters) |
| EU → UN | EU NDC (Nov 2025) | −66.25% to −72.5% net vs 1990 | 2035 | [UNFCCC](https://unfccc.int/sites/default/files/2025-11/DK-2025-11-05%20EU%20NDC.pdf) |
| Global | Paris Agreement + Global Goal on Adaptation (59 Belém indicators) | Well below 2°C, 1.5°C; triple adaptation finance by 2035 | — | [UNU-EHS](https://unu.edu/ehs/article/5-outcomes-cop-30-what-belem-political-package-really-delivered) |

**Data model**
- **Goals** are nodes: `{level, spatial unit, metric, baseline year, target, deadline, legal status, source}`. Baseline and metric are stored explicitly because they differ: per capita 2005, 1992, 1990, 2024 for nature, gross or net.
- **Goal → parent goal** edges.
- **Project → goal** edges: `{contribution in the goal's own unit, share of the remaining gap, interaction score −3…+3, confidence}`. The score is Nilsson's SDG-interaction scale ([SEI](https://www.sei.org/publications/sdg-interactions-framework/)) for effects that can't be quantified, including trade-offs.

Machine-readable sources for scaling beyond Barcelona: the Climate Watch NDC Content API, CDP–ICLEI city targets, Covenant of Mayors / JRC energy and climate action plan (SECAP) data, and Climate Policy Radar.

---

## 6. Why now: decision models make this cheap

Scoring every project × every neighbourhood × every goal means millions of small judgements. LLMs are too slow and costly for that, and analysts far more so. A new class of **"System One" decision models** returns typed answers with confidence instead of text:

- **Jev** (TypeSafe AI), in early access since October 2026:
  - **API:** `POST /v1/systemone` with three answer types: choice (up to 255 options), score (2–10 levels) and true/false.
  - **Cost:** $0.042 per million input tokens, output free. That is about $34 per million classifications.
  - **Speed:** 70–500 ms.
  - Sources: [TypeSafe](https://typesafe.ai/blog/introducing-system-one-models-and-jev), [docs](https://docs.typesafe.ai/api.md).
- **Laya** (Apache 2.0, open weights):
  - Same request shape, so switching from Jev means changing one URL.
  - Runs on a single T4 GPU or a city's own servers, which matters for EU data residency. The multilingual checkpoint covers Catalan and Spanish.
  - Source: [Hugging Face](https://huggingface.co/convaiinnovations/laya).
- **Fallback:** Claude Haiku 5.5 with structured outputs, about $60 per million calls via the Batch API. We also use Claude to label training data and to write the memo, since decision models output no text.

**Caveats we state ourselves**
- Jev's benchmarks are the vendor's own, and it runs only in the US.
- Laya's base checkpoints are below the majority-class baseline zero-shot and over-confident until calibrated.
- Both models are weak on numbers and dates, so we compute those in code.

The plan: Claude labels a few thousand examples, the decision model runs the bulk, low-confidence answers go back to Claude or a human, and we calibrate on a held-out set. **The value is in the framework and the data. The model is a swappable engine that makes it cheap.**

---

## 7. The business

### Who has the biggest problem? Cities.

We looked at three candidate buyers:

| Buyer | Their pain | Verdict |
| --- | --- | --- |
| **City climate and resilience offices** | Must turn goals into a funded, defensible investment plan. EU Mission cities owe a Climate City Contract with an Investment Plan. Today they pay consultants for static plans and still can't compare options | **First customer.** Acute pain, existing budget (consultant spend), and a forcing deadline in the Mission |
| Development banks and funders (EIB, CaixaBank, climate funds) | Not money: the shortage is *bankable project pipelines* (C40's facility managed about 20 projects in ten years). The EIB already funds a Climate City Capital Hub to bundle city projects | **Second side.** They don't pay first, but they pay to *receive* comparable, pre-scored portfolios |
| Contractors, installers and NGOs | Expensive customer acquisition; projects too fragmented to bid on | **Third side.** Supply for the long-term delivery layer |

### Full-stack path: from plan to delivered project

Chris Dixon's "full-stack startup" argument: companies that sold software to taxi firms stayed small, while Uber, which delivered the service itself, won ([cdixon.org](https://cdixon.org/2014/03/15/full-stack-startups)). Selling plans to cities is the "software to taxi firms" business. ClimateView, the best-funded plan tool, has stayed at about 30 cities ([tech.eu](https://tech.eu/2023/06/12/sweden-s-climateview-raises-14-million-to-enhance-climate-action-plans-in-cities/)). The money and the impact are in getting projects **financed and built**.

| Stage | What we sell | Who pays | Revenue model |
| --- | --- | --- | --- |
| **1. Decide** (now) | Diagnosis, ranked portfolio, goal cascade, council memo | City; often funded by NetZeroCities / Pathways2Resilience grants | Pilot under Spain's €15k direct-award limit for services, then about €15–175k a year (benchmarked on ClimateView contracts) |
| **2. Finance** (6–18 months) | Bundled, pre-scored, standardised project portfolios across cities | Development banks, green bond arrangers, funds | 1–2% arrangement or success fee, paid by the funder, not the city (avoids conflict of interest) |
| **3. Deliver** (long-term vision: "Uber for climate projects") | Tender-ready project packages plus pre-qualified providers | Providers and project owners | Take rate or prime-contractor margin of 3–15% on project value |
| **4. Learn** | Before and after performance data on what actually works where | Insurers, banks, other cities | Data licensing |

Stage 4 is the moat. Every delivered project feeds outcome data back into the effect sizes. Like GBD, the evidence base gets better with each city, and a competitor that only does planning never sees those outcomes.

### The marketplace: what the law allows

Public contracts above **€216k (services) / €5.4M (works)** must go through an EU tender, and Spain caps direct awards at €15k for services and €40k for works ([Cuatrecasas](https://www.cuatrecasas.com/en/global/public-law/art/new-eu-public-contract-thresholds-2026-2027/)). So we can't "Uber-match" a city to a contractor. The legal routes are:

- **Dynamic purchasing systems and framework agreements.** Providers pre-qualify once, and cities buy through them. Precedents: Scotland's £350M retrofit system and Ireland's energy-agency retrofit system.
- **Joint and innovation procurement.** EU calls for pre-commercial procurement (PCP) and public procurement of innovation (PPI) fund 100% and 50% respectively and need at least 3 cities. Barcelona runs its own innovation tenders (InnovAcció 2030).
- **Private-side delivery.** Homeowner associations (*comunidades de propietarios*) get 40%+ renovation subsidies, and there's no tender. This mirrors Flock Safety, which started with homeowner associations before selling to police.

**Lessons from the installers:**
- Asset-light installer marketplaces struggled: Otovo cut 46% of staff and Zolar went insolvent.
- The winners controlled **financing and labour**: Enpal through leases plus its own installer teams; 1KOMMA5° by buying about 40 installers.
- So delivery comes after we own the decision and the financing relationship, and it starts with a small set of vetted providers, not an open marketplace.

### Competition

| Player | What they do | Our difference |
| --- | --- | --- |
| ClimateView (€24M raised) | Decarbonisation pathways for about 30 cities | Mitigation-only plan tool. We add adaptation, nature, health and the full goal cascade, and go through to finance and delivery |
| Kausal | Open-source tracking of climate action plans | Tracks plans; doesn't choose between projects |
| NetZeroCities / EU Mission | Free platform and grants for 112 cities | **A channel, not a competitor.** Its Climate City Contracts are the documents we help cities fill |
| Jupiter, XDI, Cervest | Physical climate risk for insurers and corporates | Possible data suppliers |
| C40 Cities Finance Facility | Manual project preparation | Our stage 2, automated and comparable |
| Google Environmental Insights Explorer | Free emissions baselines | Turns baselines into a commodity; we use it as an input |

### Market

- Cities need **$4.3tn a year** in climate investment to 2030, against $831bn tracked today ([CPI/CCFLA 2024](https://www.climatepolicyinitiative.org/publication/2024-state-of-cities-climate-finance)).
- EU Mission cities need about **€650bn**.
- Adaptation finance falls 12–14× short of need in developing countries, which is why we show a second city from the Global South ([UNEP 2025](https://www.unep.org/news-and-stories/press-release/slow-climate-adaptation-threatening-lives-and-economies)).
- **Beachhead:** the 112 Mission cities, then Covenant of Mayors cities with energy and climate action plans (SECAP).

---

## 8. Stakeholders

| Group | Examples | Role |
| --- | --- | --- |
| Users and buyers | City climate offices; public health agencies such as Barcelona's ASPB; AMB; finance departments | Ask "where should the next €10M go?" and act on the answer |
| Funders | EIB / Climate City Capital Hub, CaixaBank, Bankinter, climate funds, insurers | Receive comparable portfolios |
| Providers | Installers, engineering firms, NGOs, nature-restoration groups | Deliver projects (stage 3) |
| Knowledge contributors | ISGlobal, researchers, local experts, residents | Effect sizes, local context, validation, local weights |
| Beneficiaries | Older people, low-income households, outdoor workers, the bioregion's ecosystems | Who the decisions are for; their exposure drives the ranking |
| Channels | NetZeroCities, C40, ICLEI, Norrsken, Smart City Expo World Congress (Barcelona, 3–5 Nov 2026) | Distribution |

---

## 9. How it improves with each city

1. **Experts add judgement.** A short structured form rates one intervention in one context, with confidence. It is credited and used where studies are thin.
2. **Cities add outcomes.** Reported results update effect sizes for similar places.
3. **"Cities like you."** Cities that are similar in climate, age profile, income and bioregion share what worked.
4. **Residents add local knowledge** (which streets overheat, which practices cool homes), with consent and credit.
5. **Impact Week as a live demo.** On the morning of 14 Oct, 10–20 experts fill the form via a QR code, and in the pitch we show their input changed the ranking.

---

## 10. Trust: a glass box

- **Every number has a source.** Click any figure to see the study or dataset behind it.
- **Ranges, not single values.** Every estimate shows low, central and high.
- **The ledgers are always visible**, and the factor presets are switchable.
- **The decision model only answers narrow, typed questions.** Low-confidence answers go to a human.
- **Agents retrieve; they don't guess.** If there's no evidence for a project in a place, the tool says so.
- **We state our value judgements openly:** DALYs weight younger lives more; a carbon price is a political choice; turning nature into money is contested. That's why each one is a switch.

---

## 11. Risks

| Risk | Mitigation |
| --- | --- |
| "You can't put a price on lives or nature" | Ledgers are always shown, nature is a hard floor, and every weight is a switch. GBD faced the same critique and won through transparency |
| Long city sales cycles | Pilots under €15k, grant-funded pilots, the NetZeroCities channel, Smart City Expo |
| Planning tools becoming a commodity | Go full stack: the outcome data from finance and delivery is the moat |
| Procurement law blocks the marketplace | Dynamic purchasing systems, framework agreements, PCP/PPI, private-side delivery |
| Decision-model quality and vendor risk | Calibration set, confidence gating, three swappable engines |
| Weak evidence for some interventions | Ranges, expert priors and an explicit "no evidence" state |

---

## 12. Decided and still open

**Decided**
- The first paying customer is the city.
- Funders are the second side.
- The marketplace is the long-term vision, shown in the pitch but not built.
- The common unit is Climate Value in € with five visible ledgers.
- The pilot is Barcelona, framed within its bioregion.

**Still open**
- [ ] Pilot scope: the city only, or the AMB / bioregion? First hazard: heat only, or heat + drought + flood?
- [ ] Jev access: request it at kickoff. Otherwise Laya on Colab/Kaggle, then Claude Haiku.
- [ ] Which second city for the "it travels" screen (one from the Global South)?
- [ ] Central value per DALY for Spain (currently €70k, our assumption).
- [ ] Is "wellbeing" health only, or also green space, jobs and cohesion? (Default: the Wellbeing ledger is on with conservative values.)
- [ ] Roles, the pitcher and the demo driver; who runs the expert form at Impact Week.
- [ ] Do we want to keep building this after Thursday? If so, book meetings with the Barcelona Climate Office, ASPB, ISGlobal and the AMB, and register for the Smart City Expo.
- [ ] A product name, before the pitch.
