# Climate Priorities — Fixathon plan

## The idea

A decision tool that tells a city or government how to split its climate budget, and which investments save the most lives and money per euro. Every government adapts it to its own goals and situation; we start with heat in Barcelona.

**The problem. **Every government has climate goals, but few can compare a heat plan, a flood barrier and a solar programme on the same scale. Barcelona plans more than €1.8 billion of climate spending to 2030 ([Betévé](https://beteve.cat/politica/pla-clima-barcelona-destina-1800-milions-euros-ciutat-verda-sostenible/)), yet climate change caused about 630 heat deaths there in summer 2025, third-highest in Europe ([Ara](https://en.ara.cat/environment/the-climate-crisis-has-tripled-heat-deaths-in-europe-this-summer_1_5499274.html)). Is the money going where the deaths are?

**The story hook. **Ausubel, Meyer and Wernick showed that in 20th-century America, improvements in water and air supply were the main defence against infectious disease, and warned infections could regain ground ([Technology in Society, 2001](https://www.sciencedirect.com/science/article/pii/S0160791X01000057)). Environmental infrastructure did more for health than medicine. Climate change is that control slipping; we help governments choose the next generation of environmental infrastructure.

**Our wedge versus the Global Burden of Disease. **GBD counts heat and cold deaths, not deaths caused by climate change, and it ranks problems, not investments. We add attribution and a ranked list of what to fund.

**Why now. **Three things line up in the same year: the Paris Agreement turns ten, COP31 is coming, and decision models just got cheap. A new class of "System One" models returns structured decisions with calibrated confidence instead of text.

* **Laya (our default): **open weights under Apache 2.0, runs on our own GPU or a city's own servers, answers a question in about 33 ms in 100+ languages, at no per-call cost ([Hugging Face](https://huggingface.co/convaiinnovations/laya)). Multilingual matters: experts and residents can answer in Catalan, Spanish or Swahili.
* **Jev (if we get access): **TypeSafe AI's closed model, released September 15, 2026, at $0.042 per million input tokens ([TypeSafe](https://typesafe.ai/blog/introducing-system-one-models-and-jev)). Laya ships a server with the same request shape as Jev's API, so we can switch by changing one URL.

Together they make it affordable to score every intervention against every neighbourhood, in every city, instead of hiring consultants city by city.

Caveats we state ourselves: Laya's own model card says its base checkpoints are near chance on typed decisions without fine-tuning and ship over-confident until calibrated on your own data; Jev's figures come from TypeSafe's own evaluations and it is in early access. So the pitch rests on the framework, and the decision model is a swappable engine that makes it cheap.

## What we optimize

No study gives a universal "x% to prevention, y% to adaptation" split, and none should: the right split depends on how much a place emits and how exposed it is. So the split is an output of our tool, built from each place's own data. Research gives us the structure and the defaults.

| Reference point | What it says | How we use it |
| --- | --- | --- |
| [Green Climate Fund allocation rule](https://www.greenclimate.fund/decision/b06-06) (2014) | Aim for 50:50 mitigation and adaptation over time; at least 50% of adaptation money to the most vulnerable countries | A preset users can pick, and the model for our equity floor |
| [CPI Global Landscape of Climate Finance](https://www.climatepolicyinitiative.org/publication/global-landscape-of-climate-finance-2021/) (2019/2020 data) | Mitigation took over 90% of climate finance; adaptation 7% | The status quo we compare against |
| [UNEP Adaptation Gap Report 2025](https://www.unep.org/news-and-stories/press-release/slow-climate-adaptation-threatening-lives-and-economies) | Developing countries need $310–365 billion a year for adaptation by 2035; international public flows were $26 billion in 2023 | Shows where the gap is |
| [Global Commission on Adaptation](https://www.preventionweb.net/news/view/67533) (2019) | $1.8 trillion of adaptation could yield $7.1 trillion in net benefits; benefit-cost ratios of 2:1 to 10:1 | Starting priors for returns on adaptation |
| [Bosello, Carraro and De Cian](https://ageconsearch.umn.edu/record/116907) (2013) | Optimal path: mitigation early, large adaptation later; the two are complements, not substitutes | Rule: never trade mitigation away for adaptation |
| [Chisari, Galiani and Miller](https://economia.lse.ac.uk/articles/46) (2016) | Economies that contribute little to emissions get more from adaptation, on cost-effectiveness grounds | Why a city's split leans to adaptation once its own targets are met |

**Our objective (proposal for kickoff):**

1. **Maximise** healthy life-years saved plus economic losses avoided, per euro.
2. **Subject to** the budget, and the place's own emissions target being met. Barcelona's plan targets a 45% cut by 2030 ([Sostenible.cat](https://www.sostenible.cat/print/noticia/barcelona-es-conjura-contra-el-canvi-climatic-per-evitar-temperatures-extremes)), so that is a constraint, not something we trade off.
3. **With an equity floor:** a minimum share of benefits must reach the most vulnerable districts (default 50%, after the GCF rule).
4. **Mitigation choices** meet the target at lowest cost, preferring measures with local co-benefits (shade, cooling, cleaner air).

The split across prevention, adaptation, health and infrastructure then falls out as a result, and each government can change the weights, the floor or the target. Presets: "Paris target first", "Lives first", "GCF 50:50".

## Stakeholders

The buyer is the city climate or resilience office; everyone else either feeds the model or benefits from it.

| Group | Examples | Role |
| --- | --- | --- |
| Decision-makers (users) | City climate offices, public health agencies, finance ministries | Ask "where should the next €10M go?" and act on the answer |
| Funders | Development banks, EIB, climate funds, insurers | Need a credible, comparable case before they lend |
| Knowledge contributors | Climate and health researchers, local experts, residents, holders of traditional knowledge | Supply effect sizes, local context and validation |
| Beneficiaries | Residents, especially older people, low-income households, outdoor workers | Who the decisions are for; their exposure drives the ranking |
| Ecosystem partners | Norrsken, C40-style city networks, data providers | Distribution and data |

Barcelona contacts to call during the event: the city's Climate Change and Sustainability Office, its public health agency (ASPB), and ISGlobal.

## Product architecture

![product architecture · 4 layers, 1 learning loop](data:image/png;base64...)

product architecture · 4 layers, 1 learning loop

LLM agents gather and read; the decision model (Laya by default, Jev if we get access) answers many small, typed questions ("Is a climate shelter effective in this district? Feasible within 2 years?") with calibrated confidence; a plain optimizer allocates the budget under the objective above. The memo agent explains the result in words, since decision models output no text. Trust: a glass box, not a black box

The allocation is plain arithmetic on visible inputs. The decision model only answers narrow questions with a fixed set of answers and a confidence score, so each answer can be checked; answers below a confidence threshold go to an expert instead of into the ranking. Before trusting Laya's confidence, we calibrate it on a small labelled set, as its model card advises.

* **Every number has a source. **Click any figure to see the study or dataset behind it.
* **Ranges, not points. **Each estimate shows low, central and high values.
* **Visible weights. **Users set how much they weigh lives, money and tonnes with sliders, and watch the ranking change.
* **Agents retrieve, they don't guess. **If no evidence exists for an intervention in a place, the tool says so instead of filling the gap.
* **Disagreement shown. **Where experts differ, both views appear with who holds them.
* **One stated value judgment. **We rank by healthy life-years (DALYs) per euro and show deaths alongside; we say this openly because it weights younger lives more.

## How it gets better with more users

Each new city and expert sharpens the evidence for every other city.

1.** Experts add judgement. **A short structured form asks an expert to rate one intervention in one context, with confidence. Answers become priors where studies are thin, credited to the contributor.
2.** Cities add outcomes. **When a city reports what it built and what happened, effect sizes update for similar places.
3.** "Cities like you." **Comparable cities by climate, age profile and income share what worked, so a new city starts with evidence instead of a blank page.
4.** Local knowledge enters as data. **Residents and traditional knowledge holders add context (which streets overheat, which practices cool homes), with consent and credit.

**Using Impact Week. **The event runs Oct 14–15 with a large climate crowd. On the morning of the 14th, we ask 10–20 experts to fill the form via a QR code, then show live in the pitch that their input changed the ranking. That's the network effect demonstrated, not claimed.

## Data

Norrsken's list covers emissions and mitigation well but is thin on health, people and intervention costs, which this idea needs most.

| Layer | From the Norrsken list | Still needed (approximate, verify at kickoff) |
| --- | --- | --- |
| Climate hazard (heat now and 2050) | Copernicus Climate Data Store, European Climate Risk Assessment, Meteostat | Local station data (Meteocat) |
| People and vulnerability | Eurostat | Neighbourhood population, age 65+, income (Barcelona open data portal, INE census) |
| Health response | IPCC (background only) | Barcelona heat–mortality curves (ASPB/ISGlobal), GBD results for baseline DALYs |
| Urban heat and greenery | OpenStreetMap | Copernicus Urban Atlas tree cover, satellite land surface temperature |
| Interventions: cost and effect | none | Published studies on shelters, trees, cool roofs, superblocks, heat alerts; city budget lines |
| Emissions side | Climate TRACE, EDGAR, Ember | Barcelona's own emissions inventory |
| City plans | Climate Policy Radar, NECPs | Barcelona's Pla Clima and heat plan documents |

Rule for the demo: every number on screen comes from a row in this table, with its link.

## What we build in 24 hours

One working slice (heat in Barcelona) plus one screen that shows the framework travels.

**Working:**

* Map of Barcelona's 10 districts shaded by climate-attributable heat burden, now and 2050
* Catalogue of 6–8 interventions, each with cost, effect range and source
* Budget split and ranked portfolio: "Barcelona has €10M, how should it split it?" with presets and weight sliders
* "Why" panel on every recommendation, showing sources and assumptions
* Memo agent that writes a one-page brief for the city council
* Expert input form, live at Impact Week

**Shown, not built: **a second city on the same framework (a Global South city), flood and drought layers, and the emissions-side comparison as a stub.

**Demo moment:** a judge picks a budget; the ranking and memo update live, every number clickable to its source.

## 24-hour roadmap

![24-hour roadmap · 6 phases, 5 gates, not to scale](data:image/png;base64...)

24-hour roadmap · 6 phases, 5 gates, not to scale

If a gate slips by more than an hour, cut scope (drop the second-city screen first), never the demo moment. The Impact Week phase assumes we can reach attendees on the morning of the 14th; confirm at kickoff.

## Open questions to settle at kickoff

* ☐ Laya running on a GPU by 16:30 (Kaggle, Colab or a rented T4); apply for Jev early access now and switch if it arrives; Claude with structured outputs as last resort
* ☐ Agree the objective, constraints and default equity floor (see What we optimize)
* ☐ Which second city for the "it travels" screen?
* ☐ Who pitches, who drives the demo
* ☐ Confirm the submission rules handed out on the day
* ☐ Who runs the Impact Week expert form on the morning of the 14th
* ☐ Build 50–100 labelled examples early (Claude as teacher, checked by us) to calibrate Laya, and to fine-tune it overnight if zero-shot answers are poor