# WasteQuote: sourced reference data

Researched 14 October 2026. Every value below was read from the source document named in its row: a downloaded XLSX/PDF parsed locally, or a fetched web page. Nothing is estimated. Converted values say so in the notes and show the formula. Anything that could not be found is marked **NOT FOUND** and collected in the list at the end.

Conventions
- "blank" means the source table has an empty cell for that material/route. Treat it as "no factor published", not as zero.
- kg/t means kg CO2e per metric tonne unless stated otherwise.
- Short ton to metric tonne: 1 short ton = 0.90718474 t, so kg/t = (MTCO2E per short ton) x 1000 / 0.90718474.
- lb/yd3 to t/m3: 1 lb = 0.45359237 kg and 1 yd3 = 0.764554858 m3, so kg/m3 = lb/yd3 x 0.593276.

---

## A. UK Government GHG Conversion Factors 2026 (DESNZ), "Waste disposal" sheet

- Publication page: https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2026 (first published 11 June 2026, last updated 31 July 2026. The July update only republished the flat file. The full set was not revised.)
- Full-set file used: https://assets.publishing.service.gov.uk/media/6a29392bade52dc0882218a8/ghg-conversion-factors-2026-full-set.xlsx (sheet "Waste disposal", Scope 3, Version 1, Year 2026, next publication June 2027)
- Methodology paper: https://assets.publishing.service.gov.uk/media/6a2940543b15d05a7ce3202e/2026-GHG-conversion-factors-methodology-report.pdf (Section 12, pp. 120-125)
- Source title for every row below: "UK Government GHG Conversion Factors for Company Reporting 2026: full set, sheet Waste disposal". All values are kg CO2e per tonne of waste and are copied exactly as stored in the XLSX.
- Route columns in the sheet: Re-use, Open-loop, Closed-loop, Combustion, Composting, Landfill, Anaerobic digestion.

| value | unit | year | exact source title | URL | notes |
|---|---|---|---|---|---|
| 4.65358 | kg CO2e/t | 2026 | DESNZ 2026 full set, Waste disposal: "Paper and board: board", Closed-loop | https://assets.publishing.service.gov.uk/media/6a29392bade52dc0882218a8/ghg-conversion-factors-2026-full-set.xlsx | Re-use, Open-loop and AD cells are blank |
| 4.65358 | kg CO2e/t | 2026 | same, "Paper and board: board", Combustion | same | |
| 9.00687 | kg CO2e/t | 2026 | same, "Paper and board: board", Composting | same | |
| 1164.51317 | kg CO2e/t | 2026 | same, "Paper and board: board", Landfill | same | "Paper and board: mixed" and "Paper and board: paper" have identical values in every column |
| 4.65358 | kg CO2e/t | 2026 | same, Construction: "Wood", Closed-loop | same | The 2026 sheet has no stand-alone "Wood" line. Wood appears only under Construction. Re-use, Open-loop and AD are blank. |
| 4.65358 | kg CO2e/t | 2026 | same, Construction: "Wood", Combustion | same | |
| 9.00687 | kg CO2e/t | 2026 | same, Construction: "Wood", Composting | same | |
| 925.36725 | kg CO2e/t | 2026 | same, Construction: "Wood", Landfill | same | |
| 1.01398 | kg CO2e/t | 2026 | same, Construction: "Average construction", Open-loop | same | Landfill cell is **blank** (checked in the raw XML: cell I25 is empty). Re-use, Composting and AD are also blank. |
| 1.01398 | kg CO2e/t | 2026 | same, Construction: "Average construction", Closed-loop | same | |
| 4.65358 | kg CO2e/t | 2026 | same, Construction: "Average construction", Combustion | same | |
| 1.27043 | kg CO2e/t | 2026 | same, Construction: "Aggregates" / "Asphalt" / "Concrete", Landfill | same | Open-loop and Closed-loop are both 1.01398 for these three lines. "Bricks": Open-loop 1.01398, Landfill 1.27043. Possible landfill proxy for inert C&D. |
| 1.26435 | kg CO2e/t | 2026 | same, Construction: "Metals", Landfill | same | Closed-loop 1.01398 |
| 71.95 | kg CO2e/t | 2026 | same, Construction: "Plasterboard", Landfill | same | Closed-loop 4.65358 |
| 19.55376 | kg CO2e/t | 2026 | same, Construction: "Soils", Landfill | same | Closed-loop 1.01398 |
| 520.58023 | kg CO2e/t | 2026 | same, Refuse: "Commercial and industrial waste", Landfill | same | Closed-loop 4.65358, Combustion 4.65358, AD 9.00687. A possible proxy for mixed general C&I waste (not C&D). |
| 4.65358 | kg CO2e/t | 2026 | same, Metal: "Metal: scrap metal", Open-loop | same | Re-use, Composting and AD are blank |
| 4.65358 | kg CO2e/t | 2026 | same, "Metal: scrap metal", Closed-loop | same | |
| 4.65358 | kg CO2e/t | 2026 | same, "Metal: scrap metal", Combustion | same | |
| 9.00687 | kg CO2e/t | 2026 | same, "Metal: scrap metal", Landfill | same | |
| 4.65358 | kg CO2e/t | 2026 | same, Plastic: "Plastics: average plastic film", Open-loop | same | Re-use, Composting and AD are blank. "Plastics: LDPE and LLDPE (incl. forming)" has identical values. |
| 4.65358 | kg CO2e/t | 2026 | same, "Plastics: average plastic film", Closed-loop | same | |
| 4.65358 | kg CO2e/t | 2026 | same, "Plastics: average plastic film", Combustion | same | |
| 9.00687 | kg CO2e/t | 2026 | same, "Plastics: average plastic film", Landfill | same | |
| 4.65358 | kg CO2e/t | 2026 | same, Refuse: "Organic: food and drink waste", Combustion | same | Re-use, Open-loop and Closed-loop are blank |
| 9.00687 | kg CO2e/t | 2026 | same, "Organic: food and drink waste", Composting | same | |
| 700.33263 | kg CO2e/t | 2026 | same, "Organic: food and drink waste", Landfill | same | |
| 9.00687 | kg CO2e/t | 2026 | same, "Organic: food and drink waste", Anaerobic digestion | same | "Organic: mixed food and garden waste" landfill = 656.10991, "Organic: garden waste" landfill = 646.72934 |
| (no value) | - | 2026 | same, FAQ "Why there are no conversion factors for the disposal method 'Re-use'?" | same | No re-use factor exists for any material in 2026. The sheet FAQ says re-use is out of scope because it is not a disposal method. |

**Methodology: is avoided virgin production credited? No. Your reading of a cut-off approach is correct.**
- Methodology para 12.8 (p.121): a company sending waste for recycling gets no benefit to its carbon account, because the waste-disposal figures do not include the benefit of recycled material replacing primary extraction. The benefit is attributed to whoever uses the recycled material (para 12.16).
- Para 12.3 and 12.22 (pp.120, 123): apart from landfill, the factors cover only collecting the waste and delivering it to the first point of treatment (for example a MRF or energy-recovery plant). Emissions from recycling and energy recovery belong to the organisation that uses the recycled material or the energy.
- Para 12.23: landfill factors come from MELMod and include collection, transport and landfill emissions (gate to grave). Biogenic CO2 is excluded (para 12.10).
- Para 12.9 and 12.24: the factors "cannot be used to compare the impacts of different waste management options". The sheet guidance repeats this and points to WRAP's Carbon Waste and Resources Metric (https://wrap.org.uk/resources/report/carbon-waste-and-resources-metric) for comparing options.
- Para 12.6: no methodological changes since 2025. Changes come only from updated freight factors.
- Transport built into the factors (Table 51, p.124): 25 km by 26 t refuse collection vehicle to a transfer station or MRF, then 10 km bulk transport to landfill or composting. For inert waste, 12.85 km to recycling and 16.1 km to inert landfill by 4-axle rigid tipper.
- **Implication for the app:** DESNZ waste factors already include a default collection leg, so adding Section F transport on top double-counts that leg. In a demo, DESNZ factors show recycling at about 5 kg/t against about 700 to 1,165 kg/t for landfilling biodegradables. For metals and plastics, landfill is only 9 kg/t, because landfilled plastics and metals do not degrade into methane. To show recycling as a benefit, use Section B.

---

## B. US EPA WARM, net lifecycle factors (credits avoided virgin production)

- Latest version: **WARM Version 16 (December 2023)**. EPA's versions page, checked 14 Oct 2026, lists v16 as the latest: https://www.epa.gov/warm/versions-waste-reduction-model-warm
- Chapter PDFs used (all v16, Dec 2023):
  - Containers, Packaging and Non-Durable Goods: https://www.epa.gov/system/files/documents/2023-12/warm_containers_packaging_and_non-durable_goods_materials_v16_dec.pdf (Exhibit 2-7 Metals, Exhibit 3-7 Paper Products, Exhibit 5-3 Plastics)
  - Organic Materials: https://www.epa.gov/system/files/documents/2023-12/warm_organic_materials_v16_dec.pdf (Exhibit 1-10 Food Waste)
  - Construction Materials: https://www.epa.gov/system/files/documents/2023-12/warm_construction_materials_v16_dec.pdf (Exhibits 1-3, 4-3, 5-3, 6-5, 9-3, 11-3, 12-3)
  - Management Practices (method background): https://www.epa.gov/system/files/documents/2024-01/warm_management_practices_v16_dec.pdf
- Sign convention (stated under every exhibit): negative values are net GHG reductions or carbon storage. The recycling factor is the emissions of virgin production minus recycled production, adjusted for losses. The glass chapter, Step 3, describes the method. So recycling **does** credit avoided virgin production.
- Exhibit values are rounded to 2 decimals (0.01 MTCO2E per short ton, about 11 kg/t), so the converted values carry that uncertainty.
- Converted = raw x 1000 / 0.90718474.

| value (raw) | value (converted) | unit | year | exact source title | URL | notes |
|---|---|---|---|---|---|---|
| -5.58 | -6,150.9 | MTCO2E/short ton; kg CO2e/t | 2023 (v16) | WARM v16 Paper Products, Exhibit 3-7, Corrugated Containers: Net Source Reduction | https://www.epa.gov/system/files/documents/2023-12/warm_containers_packaging_and_non-durable_goods_materials_v16_dec.pdf | Source reduction for the current mix of inputs |
| -3.14 | -3,461.3 | same | 2023 | same, Corrugated Containers: Net Recycling | same | Composting and AD = NA |
| -0.49 | -540.1 | same | 2023 | same, Corrugated Containers: Net Combustion | same | |
| 0.18 | 198.4 | same | 2023 | same, Corrugated Containers: Net Landfilling | same | |
| -2.11 | -2,325.9 | same | 2023 | WARM v16 Construction Materials, Exhibit 12-3 Wood Products, Dimensional Lumber: Net Source Reduction | https://www.epa.gov/system/files/documents/2023-12/warm_construction_materials_v16_dec.pdf | |
| -1.66 | -1,829.8 | same | 2023 | same, Dimensional Lumber: Net Reuse | same | Footnote: dimensional lumber is modelled as reuse under the recycling pathway. No separate recycling factor. Composting and AD = NA. |
| -0.58 | -639.3 | same | 2023 | same, Dimensional Lumber: Net Combustion | same | |
| -0.92 | -1,014.1 | same | 2023 | same, Dimensional Lumber: Net Landfilling | same | Negative because of landfill carbon storage. Landfilling wood scores better than combustion in WARM. |
| -4.11 / -3.68 / -0.74 / -0.86 | -4,530.5 / -4,056.5 / -815.7 / -948.0 | same | 2023 | same, Exhibit 11-3, Wood Flooring: Source Reduction / Reuse / Combustion / Landfilling | same | Alternative wood line. MDF: SR -3.05 (-3,362.1), Combustion -0.58 (-639.3), Landfill -0.85 (-937.0), Recycling NA. |
| -3.65 | -4,023.4 | same | 2023 | WARM v16 Metals, Exhibit 2-7, Mixed Metals: Net Source Reduction | https://www.epa.gov/system/files/documents/2023-12/warm_containers_packaging_and_non-durable_goods_materials_v16_dec.pdf | |
| -4.39 | -4,839.1 | same | 2023 | same, Mixed Metals: Net Recycling | same | Composting and AD = NA |
| -1.02 | -1,124.4 | same | 2023 | same, Mixed Metals: Net Combustion | same | Negative because WARM assumes ferrous recovery at waste-to-energy plants |
| 0.02 | 22.0 | same | 2023 | same, Mixed Metals: Net Landfilling | same | |
| -3.03 / -1.83 / -1.59 / 0.02 | -3,340.0 / -2,017.2 / -1,752.7 / 22.0 | same | 2023 | same, Steel Cans: SR / Recycling / Combustion / Landfilling | same | Ferrous alternative. Structural Steel (Construction Exhibit 9-3): SR -1.67 (-1,840.9), Recycling -1.93 (-2,127.5), Landfill 0.02 (22.0), Combustion NA. |
| -1.80 | -1,984.2 | same | 2023 | WARM v16 Plastics, Exhibit 5-3, LDPE: Net Source Reduction | same | **LDPE Net Recycling = NA in v16.** The footnote limits the recycling pathway to HDPE, PET and PP. |
| 1.29 | 1,422.0 | same | 2023 | same, LDPE: Net Combustion | same | Positive: fossil carbon is released |
| 0.02 | 22.0 | same | 2023 | same, LDPE: Net Landfilling | same | |
| -1.87 / -0.93 / 1.26 / 0.02 | -2,061.3 / -1,025.1 / 1,388.9 / 22.0 | same | 2023 | same, Mixed Plastics: SR / Recycling / Combustion / Landfilling | same | Use "Mixed Plastics recycling" as the **proxy** for LDPE film recycling and label it as a proxy |
| -3.66 | -4,034.5 | same | 2023 | WARM v16 Food Waste, Exhibit 1-10, Food Waste: Net Source Reduction | https://www.epa.gov/system/files/documents/2023-12/warm_organic_materials_v16_dec.pdf | Recycling = NA |
| -0.15 | -165.3 | same | 2023 | same, Food Waste: Net Composting | same | |
| -0.04 | -44.1 | same | 2023 | same, Food Waste: Net Anaerobic Digestion | same | Footnote: dry digestion with curing of digestate before land application |
| -0.13 | -143.3 | same | 2023 | same, Food Waste: Net Combustion | same | |
| 0.50 | 551.2 | same | 2023 | same, Food Waste: Net Landfilling | same | National-average landfill moisture and gas-collection scenario (chapter section on landfilling) |
| -0.01 / 0.02 | -11.0 / 22.0 | same | 2023 | WARM v16 Construction, Exhibit 5-3, Concrete: Recycling / Landfilling | https://www.epa.gov/system/files/documents/2023-12/warm_construction_materials_v16_dec.pdf | SR, Combustion and AD = NA. Proxy for inert C&D. |
| -0.11 / -0.08 / 0.02 | -121.3 / -88.2 / 22.0 | same | 2023 | same, Exhibit 1-3, Asphalt Concrete: SR / Recycling / Landfilling | same | Combustion = NA |
| -0.22 / 0.03 / -0.06 | -242.5 / 33.1 / -66.1 | same | 2023 | same, Exhibit 6-5, Drywall: SR / Recycling / Landfilling | same | Recycling is slightly positive. Combustion = NA. |
| -0.27 / 0.02 | -297.6 / 22.0 | same | 2023 | same, Exhibit 4-3, Clay Bricks: SR / Landfilling | same | Recycling = NA |
| NOT FOUND | - | - | - | WARM v16 has no "mixed C&D" material in the Construction chapter | - | Use the concrete, asphalt, drywall and brick lines above as proxies, labelled as proxies |

---

## C. Gate fees and landfill/incineration taxes

### C1. UK: WRAP Gate Fees Report 2025/26 (latest edition)
- Report page: https://www.wrap.ngo/resources/report/uk-gate-fees-report-2025-26 (published 3 July 2026)
- PDF: https://www.wrap.ngo/sites/default/files/2026-07/Gate-Fees-Report-2025-26-V1.0.pdf (executive summary tables ESG 1 to 5)
- The figures are survey data from **local authorities** (262 LAs, collected Sep to Dec 2025). They are municipal contract fees, not C&I spot fees. Facility types in scope are MRF, IVC, AD, EfW and NHLF. **Open windrow composting is not covered**, and EfW is no longer split by plant age.

| value | unit | year | exact source title | URL | notes |
|---|---|---|---|---|---|
| 90 | GBP/t | 2025/26 | WRAP Gate Fees Report 2025/26, ESG 1: MRF gross gate fee, median | https://www.wrap.ngo/sites/default/files/2026-07/Gate-Fees-Report-2025-26-V1.0.pdf | Range 31 to 137, n=103. 2024/25 median was 82. |
| 42 | GBP/t | 2025/26 | same, ESG 1: MRF net gate fee, median | same | Range 9 to 110, n=99. Net = after material income. |
| 66 | GBP/t | 2025/26 | same, ESG 2: IVC mixed food and green waste, median | same | Range 37 to 86, n=32. 2024/25: 73. |
| 45 | GBP/t | 2025/26 | same, ESG 2: IVC green waste only, median | same | Range 29 to 66, n=32. 2024/25: 57. |
| 77 | GBP/t | 2025/26 | same, ESG 2: IVC food waste only, median | same | Range 72 to 77, n=7. 2024/25: 72. |
| 13 | GBP/t | 2025/26 | same, ESG 3: AD food waste, median | same | Range -32 to 80, n=109. 10 LAs reported negative fees. 2024/25: 24. |
| 125 | GBP/t | 2025/26 | same, ESG 4: EfW residual waste mixed with bulky waste containing POPs, median | same | Range 78 to 171, n=37 |
| 129 | GBP/t | 2025/26 | same, ESG 4: EfW residual waste excluding bulky waste containing POPs, median | same | Range 65 to 175, n=44. Closest match to an EfW gate fee for ordinary residual waste. |
| 182 | GBP/t | 2025/26 | same, ESG 4: EfW bulky waste containing POPs only, median | same | Range 98 to 311, n=29 |
| 34 | GBP/t | 2025/26 | same, ESG 5: Non-hazardous landfill gate fee excluding landfill tax, median | same | Range 15 to 115, n=13 (small sample). 2024/25: 26. |
| 126.15 | GBP/t | from 1 Apr 2025 | UK Landfill Tax standard rate (the rate at the time of the 2025/26 survey; also stated in the WRAP report) | https://www.gov.uk/government/publications/rates-and-allowances-landfill-tax/landfill-tax-rates-from-1-april-2013 | Lower rate (inert) 4.05. The 1 Apr 2024 rate was 103.70 (lower 3.30). |
| 130.75 | GBP/t | from 1 Apr 2026 | UK Landfill Tax standard rate | same | Lower rate 8.65. Current rate in Oct 2026. The page covers UK Landfill Tax (England and NI). Scotland and Wales levy their own devolved taxes, which were not checked. |

### C2. Spain: national tax under Ley 7/2022, art. 93 "Cuota íntegra"
- Source: Ley 7/2022, de 8 de abril, de residuos y suelos contaminados para una economía circular, Título VII Capítulo II. Consolidated text (last updated 02/04/2025): https://www.boe.es/buscar/act.php?id=BOE-A-2022-5809
- The rates are in **art. 93.1**, not art. 90 (art. 90 is "Devengo"). Art. 93.2 lets autonomous communities raise the rates. Catalonia has done so (C3).
- In force from 1 Jan 2023, per the ARC page in C3.

| value | unit | year | exact source title | URL | notes |
|---|---|---|---|---|---|
| 40 | EUR/t | 2023 onward (consolidated text 2025) | Ley 7/2022 art. 93.1.a) 1.º: landfill of non-hazardous waste, municipal waste | https://www.boe.es/buscar/act.php?id=BOE-A-2022-5809 | |
| 30 | EUR/t | same | art. 93.1.a) 2.º: non-hazardous landfill, rejects from municipal waste ("rechazos") | same | |
| 15 | EUR/t | same | art. 93.1.a) 3.º: non-hazardous landfill, other waste exempted from prior treatment under art. 7.2 RD 646/2020 | same | If inert content is over 75%: inert part 3 EUR/t, rest 15 |
| 10 | EUR/t | same | art. 93.1.a) 4.º: non-hazardous landfill, "otro tipo de residuos" (general) | same | If inert content is over 75%: inert part 1.5 EUR/t, rest 10. Applies to industrial/commercial non-hazardous waste that is not covered by 1.º to 3.º. |
| 20 / 15 / 7 | EUR/t | same | art. 93.1.d): incineration at municipal-waste plants, operation D10: municipal / municipal rejects / other waste | same | |
| 15 / 10 / 4 | EUR/t | same | art. 93.1.e): incineration at municipal-waste plants, operation R01 (energy recovery): municipal / rejects / other waste | same | For industrial waste to EfW (R01), the national rate is 4 EUR/t |
| 20 / 15 / 5 / 3 | EUR/t | same | art. 93.1.f): other incineration plants: municipal / rejects / waste not subjected to R02-R09, R12, D08, D09, D13, D14 / other waste | same | |
| 0 | EUR/t | same | art. 93.1.g): co-incineration | same | |
| 8 / 5 | EUR/t | same | art. 93.1.b): hazardous landfill: exempt from pre-treatment / other | same | |
| 3 / 1.5 | EUR/t | same | art. 93.1.c): inert landfill: exempt from pre-treatment / other | same | |

### C3. Catalonia: the same tax with Catalan rates (the former cànon is repealed)
- The Agència de Residus de Catalunya page (https://residus.gencat.cat/ca/consultes_i_tramits_-_nou/impost_cedit_residus/) lists the former cànons under "Cànons de residus DEROGATS". These were the cànons in force before the state tax started on **1 January 2023**. Catalonia now applies the ceded state tax at its own higher rates, set in the annex to Decret legislatiu 1/2024 (Codi tributari de Catalunya, llibre sisè). No separate "cànon sobre la deposició controlada de residus industrials" rate applies in 2025 or 2026.
- 2025 rates: Decret llei 5/2025, de 25 de març (DOGC núm. 9379, 26.3.2025, CVE-DOGC-A-25084080-2025). The rates apply from the first day of the calendar quarter after entry into force; ARC news says from 1 April 2025. PDF: https://residus.gencat.cat/web/.content/home/consultes_i_tramits_-_nou/impost_cedit_residus/decret_llei_5_2025.pdf
- 2026 to 2031 rates: Decret llei 3/2026, de 24 de març, art. 2 (DOGC núm. 9632, 25.3.2026, CVE-DOGC-A-26083049-2026). In force the day after publication, 26 March 2026. PDF: https://residus.gencat.cat/web/.content/home/consultes_i_tramits_-_nou/impost_cedit_residus/decret_llei_3_2026.pdf

| value | unit | year | exact source title | URL | notes |
|---|---|---|---|---|---|
| 25.00 | EUR/t | 2026 | DL 3/2026 annex A) 3 and A) 4: landfill of non-municipal non-hazardous waste (both "exempt from pre-treatment" and "other"), caràcter general | https://residus.gencat.cat/web/.content/home/consultes_i_tramits_-_nou/impost_cedit_residus/decret_llei_3_2026.pdf | **Industrial/commercial non-hazardous landfill rate in Catalonia.** Rises 5 EUR/t a year: 30 (2027), 35 (2028), 40 (2029), 45 (2030), 50 (from 2031). The inert-over-75% sub-cases are the same 25. |
| 20.00 | EUR/t | 2025 (from 1 Apr) | DL 5/2025 annex A) 3 and A) 4: same categories | https://residus.gencat.cat/web/.content/home/consultes_i_tramits_-_nou/impost_cedit_residus/decret_llei_5_2025.pdf | |
| 15.00 | EUR/t | 2025 and 2026 to 2031 | DL 5/2025 and DL 3/2026 annex D) 3: incineration at municipal-waste plants, D10, waste other than municipal or rejects | both PDFs above | Flat 15 through 2031 |
| 15.00 | EUR/t | 2025 and 2026 to 2031 | same, annex E) 3: incineration with energy recovery R01, waste other than municipal or rejects | both PDFs above | **Industrial waste to EfW (R01) in Catalonia.** Flat 15 through 2031. |
| 5.00 | EUR/t | 2025 and 2026 to 2031 | same, annex F) 3 and F) 4: other incineration plants, non-municipal waste | both PDFs above | |
| 0.00 | EUR/t | 2025 and 2026 | same, annex G): co-incineration | both PDFs above | |
| 75.00 / 70.00 | EUR/t | 2026 / 2025 | same, annex A) 1: landfill of municipal waste | both PDFs above | Rises to 100 from 2031 |
| 56.25 / 52.50 | EUR/t | 2026 / 2025 | same, annex A) 2: landfill of municipal-waste rejects | both PDFs above | Rises to 75 from 2031 |
| 37.50 / 35.00 | EUR/t | 2026 / 2025 | same, annex E) 1: R01 incineration of municipal waste | both PDFs above | R01 municipal rejects: 18.75 (2026) / 17.50 (2025). D10 municipal: 75 / 70. |
| 10.00 | EUR/t | 2025 and 2026 | same, annex B): hazardous landfill (both categories) | both PDFs above | |
| 3.50 / 3.25 | EUR/t | 2026 / 2025 | same, annex C): inert landfill | both PDFs above | |

### C4. Spain: public prices that work as gate-fee references (no national gate-fee survey was found)

| value | unit | year | exact source title | URL | notes |
|---|---|---|---|---|---|
| 220.00 | EUR/t | 2026 | Ajuntament de Barcelona, Preus públics dels serveis de recollida de residus comercials i industrials assimilables als municipals 2026, Epígraf 2n (punts verds de zona), "Altres residus (Resta)", rate for "petit industrial o comerciant" | https://ajuntament.barcelona.cat/hisenda/sites/default/files/normativa/2026-01/preus-publics-recollida-residus.pdf?profile=3 | BOPB 23-12-2025, CVE 202510200594. VAT excluded. A drop-off collection price at city punts verds, not a plant gate fee. |
| 105 | EUR/t | 2026 | same, "Fusta" | same | |
| 115 | EUR/t | 2026 | same, "Plàstic film" | same | "Plàstic dur" and "Porexpan net" are also 115 |
| 30.00 | EUR/t | 2026 | same, "Runa neta" | same | Clean rubble |
| 65.00 | EUR/t | 2026 | same, "Restes de poda i jardineria" | same | |
| 0 (Gratuït) | EUR/t | 2026 | same, "Paper i cartró", "Metalls diversos", "Ferralla domèstica" | same | Free for small businesses at punts verds |
| 143.36 | EUR/t | 2026 | same, Epígraf 6è (cleaning of plots and removing rubble), "Tractament dels residus" | same | Treatment charge inside that service |
| 114.95 | EUR/t | 2024 | Consell de Mallorca, Tarifes de tractament de residus: Residus sòlids urbans | https://www.conselldemallorca.es/carreteres/-/asset_publisher/3Yf9lfVGbrup/content/tarifes-de-tractament-de-residus | BOIB núm. 20, 10 Feb 2024. Excludes 10% VAT. The page does not name the treatment route. |
| 43.99 | EUR/t | 2024 | same, Residus de construcció i demolició (RCD) | same | A density/impurity correction applies to dirty loads |
| ~130 / ~65 | EUR/t | Dec 2025 | NacióDigital sponsored content "Nou model metropolità de tractament de residus", treatment cost per tonne of resta / well-separated orgànica (AMB area) | https://naciodigital.cat/patrocinat/nou-model-metropolita-de-tractament-de-residus-prevencio-organica-i-noves-plantes.html | **LOW CONFIDENCE**: sponsored article, figures unattributed, a cost and not a tariff. Use only as context. |

---

## D. Recovered material prices (rebates)

| value | unit | year | exact source title | URL | notes |
|---|---|---|---|---|---|
| 94 - 112 | GBP/t, ex works | Sep 2026 | letsrecycle.com, 2026 domestic mill price indicators, "OCC 1.05" | https://www.letsrecycle.com/prices/waste-paper/uk-domestic-mill-prices/2026-domestic-mill-prices/ | Jan 2026: 55-88. Updated around the 22nd of each month. Oct to Dec not yet published. |
| 80 - 94 | GBP/t, ex works | Sep 2026 | same, "OCC 1.04" | same | OCC 1.04 and 1.05 split out from "Old KLS" in Jan 2026, so the series is not like-for-like with 2025 |
| 40 - 60 | GBP/t, ex works | Sep 2026 | same, "Mixed papers" | same | |
| 71 | EUR/t | Q2 2026 | REPACAR (with Universidad Complutense de Madrid), Observatorio de precios históricos de venta en origen de papel y cartón recuperado, "1.04 Cartón supermercado" | https://www.repacar.org/wp-content/uploads/2026/07/ESTADISTICA-PRECIOS-2026_2T.pdf | **Spanish.** Average sale price at origin from Spanish recovered-paper merchants, for material cleaned, sorted and baled to UNE-EN 643. Q3 2025: 75. Q4 2025: 65. Q1 2026: 62. Grade 1.05 is not reported. |
| 46 | EUR/t | Q2 2026 | same, "1.01 Mezcla sin clasificar" | same | Q1 2026: 35 |
| 154 | EUR/t | 2025 (annual avg) | Eurostat Statistics Explained, "Recycling - secondary material price indicator" (data from March 2026), paper and cardboard | https://ec.europa.eu/eurostat/statistics-explained/SEPDF/cache/10844.pdf | EU average unit value from international trade statistics, all paper grades. About 2% below 2024. |
| 308 | EUR/t | 2025 (annual avg) | same, plastic | same | All plastic waste, not film-specific |
| 450 - 620 | GBP/t | Sep 2026 | letsrecycle.com, Plastic film 2026, "UK Clear - Natural" | https://www.letsrecycle.com/prices/plastics/plastic-film/plastic-film-2026/ | Closest UK domestic match to natural LDPE film. Basis (delivered/ex works) not stated. Updated on the last Friday of each month. |
| 440 - 560 | GBP/t | Sep 2026 | same, "Export 98:2" | same | 95:5: 320-425. 90:10: 160-270. 80:20: 30-80. "UK PE Printed": 270-370. |
| -75 to -25 | GBP/t | Sep 2026 | same, "MRF Film" | same | Negative = cost to the seller. Page note: MRF film may go to EfW. |
| 95 - 135 | GBP/t | Sep 2026 | letsrecycle.com, Ferrous scrap 2026, "No 1 old steel scrap" | https://www.letsrecycle.com/prices/metals/ferrous-metal-prices/ferrous-scrap-metal-prices-2026/ | UK grade. Mapping to HMS 1 is **our interpretation**, not stated by the source. Basis not stated. |
| 85 - 125 | GBP/t | Sep 2026 | same, "No 2 old steel scrap" | same | Closest to HMS 2 (our interpretation). Also "OA plate & girder" 120-150, "8B mixed steel cuttings" 100-120. |
| 375 | USD/t | 8 Aug 2026 | Arab Iron and Steel Union (AISU) weekly price statement: Scrap HMS 1&2 (80:20), ex-USA CFR Turkey | https://aisusteel.org/en/archives/39910 | The international HMS 1&2 benchmark. Not a European domestic price. |
| 249.7 | EUR/t | Aug 2026 | produktion.de article (12 Oct 2026) reproducing the BDSV (German steel recyclers' association) monthly price, "Sorte 1" | https://www.produktion.de/technik/schrottpreise-aktuell-lohnt-sich-der-verkauf-von-stahlschrott/1698237 | **Secondary citation.** The BDSV primary page was not retrieved. Sorte 2/8: 292.5. Sorte 3: 287.0. Sorte 4: 296.3. Sorte 5: 245.9. Mapping of Sorte 1 to HMS was not verified. |
| 0 to -60 | GBP/t | Sep 2026 | letsrecycle.com, Wood prices 2026, "High grade" | https://www.letsrecycle.com/prices/wood/wood-prices-2026/ | Negative = gate fee. Basis: £/t of mixed wood delivered to a wood recycler (https://www.letsrecycle.com/prices/wood/). The page calls high grade "clean and untreated" but does not equate it to Grade A. Jan 2026: 0 to -55. |
| -70 to -80 | GBP/t | Sep 2026 | same, "Low grade" | same | A gate fee |
| 0.84460 | GBP per EUR | 13 Oct 2026 | ECB euro reference exchange rate, GBP | https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-gbp.en.html | Use if GBP figures need converting to EUR. State the date if you do. |

---

## E. Bulk densities

Primary: US EPA, "Volume-to-Weight Conversion Factors", Office of Resource Conservation and Recovery, April 2016: https://www.epa.gov/sites/default/files/2016-04/documents/volume_to_weight_conversion_factors_memorandum_04192016_508fnl.pdf . Values are lb per cubic yard, converted with kg/m3 = lb/yd3 x 0.593276. The source number in each note refers to the memo's footnote list.

| value | unit | year | exact source title | URL | notes |
|---|---|---|---|---|---|
| 0.063 (62.9 kg/m3) | t/m3 | 2016 | EPA Volume-to-Weight, Paper: Old Corrugated Containers, Flattened = 106 lb/yd3 | https://www.epa.gov/sites/default/files/2016-04/documents/volume_to_weight_conversion_factors_memorandum_04192016_508fnl.pdf | Source 4 (Keep America Beautiful 2013). OCC and chipboard uncompacted = 74.54 lb/yd3 (0.044 t/m3). OCC baled = 700-1,100 lb/yd3 (0.415-0.653 t/m3). |
| 0.100 (100.3 kg/m3) | t/m3 | 2016 | same, C&D: Wood, "Clean Dimensional Lumber" = 169 lb/yd3 | same | Source 18 (CIWMB 2006). "Pallets and Crates" = 169 (0.100). "Clean Engineered Wood" = 268 (0.159). |
| 0.247 (247.4 kg/m3) | t/m3 | 2016 | same, C&D: Remainder/Composite, "Construction and Demolition" = 417 lb/yd3 | same | Source 18. "Construction & Demolition Bulk" = 484 lb/yd3 (0.287 t/m3), source 20 (Florida DEP). Concrete = 860 (0.510). |
| 0.133 (133.5 kg/m3) | t/m3 | 2016 | same, C&D: Metal, "Other Ferrous" = 225 lb/yd3 | same | Source 18. "Remainder/Composite Metal" = 143 (0.085). |
| 0.021 (20.8 kg/m3) | t/m3 | 2016 | same, Plastic: Film, "LDPE, loose" = 35 lb/yd3 | same | Source 13. "LDPE, compacted" = 150 (0.089). "LDPE, baled" = 1,100 lb per 30"x42"x48" bale (a per-bale weight, not converted). |
| 0.275 (274.7 kg/m3) | t/m3 | 2016 | same, Food: "Food Waste" = 463 lb/yd3 | same | Source 4. "Food Waste - restaurants" = 396 (0.235). "Organics - commercial" = 135 (0.080). "Source Separated Organics - commercial" = 1,000 (0.593). The spread is wide, so pick one line and show its label. |
| 0.112 (112 kg/m3) | t/m3 | 2010 | WRAP, Summary Report - Material Bulk Densities (Resource Futures, project ROT039, Jan 2010), "Mixed paper & card", 140 litre wheeled bin, field-work material bulk density, mean | https://www.wrap.ngo/sites/default/files/2021-02/WRAP-bulk-density-summary-report-Jan2010.pdf | n=84, range 16-550 (the report attributes the range to cardboard share). Rear End Loader compacted = 431. Household kerbside only. |
| 0.034 (34 kg/m3) | t/m3 | 2010 | same, "Mixed plastic (with film)", 1,100 litre wheeled bin (no compaction), mean | same | n=16, range 26-45. Film-only stream not reported. |
| 0.500 (500 kg/m3) | t/m3 | 2010 | same, "Food", 7.5-15t caged stillage (no compaction), mean | same | n=4. 23 litre kerbside caddy = 290 (n=141). |
| NOT FOUND | - | 2010 | WRAP 2010 has no lines for wood, mixed C&D or scrap metal | same | Use the EPA lines above |

---

## F. Transport: rigid HGV, DESNZ 2026

Source: DESNZ 2026 full set, sheet "Delivery vehicles" (Scope 1), table "HGV (non-refrigerated, all diesel)", unit km (vehicle-km), kg CO2e total. The sheet says the same factors apply in Scope 3 under "Freighting goods" or "Managed assets - vehicles" when the vehicle is not owned. The sheet assumes all HGVs are diesel. Unit: kg CO2e per vehicle-km.

| value | unit | year | exact source title | URL | notes |
|---|---|---|---|---|---|
| 0.99773 | kg CO2e/km | 2026 | DESNZ 2026 full set, Delivery vehicles, HGV (non-refrigerated, all diesel), Rigid (>17 tonnes), Average laden | https://assets.publishing.service.gov.uk/media/6a29392bade52dc0882218a8/ghg-conversion-factors-2026-full-set.xlsx | Likely class for hooklift/skip trucks (our assumption). 0% laden 0.77910. 50% laden 0.94775. |
| 1.11639 | kg CO2e/km | 2026 | same, Rigid (>17 tonnes), 100% Laden | same | |
| 0.84606 | kg CO2e/km | 2026 | same, Average non-refrigerated rigids, Average laden | same | 100% laden 0.94836 |
| 0.60985 | kg CO2e/km | 2026 | same, Rigid (>7.5 tonnes-17 tonnes), Average laden | same | 100% laden 0.72286 |
| 0.49944 | kg CO2e/km | 2026 | same, Rigid (>3.5 - 7.5 tonnes), Average laden | same | 100% laden 0.54675 |
| 0.23756 | kg CO2e/km | 2026 | same file, sheet "WTT- delivery vehs & freight", WTT- HGV (non-refrigerated, all diesel), Rigid (>17 tonnes), km, Average laden | same | Upstream well-to-tank, Scope 3, added on top if a full lifecycle is wanted. 100% laden 0.26149. |

Double-counting warning (see A): DESNZ waste-disposal factors already include default collection transport (Table 51 of the methodology). Add HGV km only for distance beyond that default, or do not add DESNZ transport to DESNZ waste factors at all. WARM factors include their own transport assumptions too.

---

## G. List of Waste codes (Commission Decision 2014/955/EU)

- Text verified on legislation.gov.uk's copy of the annex: https://www.legislation.gov.uk/eudn/2014/955/annex . That is the EU text as it stood on 31 Dec 2020, which the page says the UK has not amended since.
- Canonical EU source: https://eur-lex.europa.eu/eli/dec/2014/955/oj . EUR-Lex returned empty pages to the fetch tool, so the current EU consolidated text was **not** checked directly.
- Annex rule: any waste marked with an asterisk (*) is hazardous. **None of the 14 codes has an asterisk, so all are non-hazardous.**
- Mirror status. Two codes are explicit mirror entries: their wording excludes a named hazardous code. The rest have no such wording, but related hazardous entries exist for contaminated material. Whether the Commission's 2018 classification guidance (2018/C 124/01) treats those as formal mirror pairs was **not verified**.

| code | exact official description | hazardous (*)? | mirror / related hazardous entry | sub-chapter |
|---|---|---|---|---|
| 15 01 01 | paper and cardboard packaging | No | Related: 15 01 10* "packaging containing residues of or contaminated by hazardous substances" | 15 01 packaging (including separately collected municipal packaging waste) |
| 20 01 01 | paper and cardboard | No | none in wording | 20 01 separately collected fractions (except 15 01) |
| 15 01 03 | wooden packaging | No | Related: 15 01 10* | 15 01 |
| 17 02 01 | wood | No | Related: 17 02 04* "glass, plastic and wood containing or contaminated with hazardous substances" | 17 02 wood, glass and plastic |
| 03 01 05 | sawdust, shavings, cuttings, wood, particle board and veneer other than those mentioned in 03 01 04 | No | **Mirror** of 03 01 04* "sawdust, shavings, cuttings, wood, particle board and veneer containing hazardous substances" | 03 01 wastes from wood processing and the production of panels and furniture |
| 17 09 04 | mixed construction and demolition wastes other than those mentioned in 17 09 01, 17 09 02 and 17 09 03 | No | **Mirror** of 17 09 01* (C&D wastes containing mercury), 17 09 02* (C&D wastes containing PCB), 17 09 03* (other C&D wastes, including mixed wastes, containing hazardous substances) | 17 09 other construction and demolition wastes |
| 17 04 05 | iron and steel | No | Related: 17 04 09* "metal waste contaminated with hazardous substances" | 17 04 metals (including their alloys) |
| 17 04 07 | mixed metals | No | Related: 17 04 09* | 17 04 |
| 12 01 01 | ferrous metal filings and turnings | No | none in wording | 12 01 wastes from shaping and physical and mechanical surface treatment of metals and plastics |
| 15 01 02 | plastic packaging | No | Related: 15 01 10* | 15 01 |
| 20 01 39 | plastics | No | none in wording | 20 01 |
| 02 02 03 | materials unsuitable for consumption or processing | No | none in wording | 02 02 wastes from the preparation and processing of meat, fish and other foods of animal origin. **Note:** animal-origin food only. Code 02 03 04 has identical wording ("materials unsuitable for consumption or processing") in sub-chapter 02 03, which by its code is the non-animal food-processing sub-chapter. That heading was not checked. |
| 20 01 08 | biodegradable kitchen and canteen waste | No | none in wording | 20 01 |
| 20 02 01 | biodegradable waste | No | none in wording | 20 02 garden and park wastes (including cemetery waste). **Note:** garden/park waste, not food. |

Also relevant: 20 01 38 "wood other than that mentioned in 20 01 37" is the mirror of 20 01 37* "wood containing hazardous substances". It is the municipal-fraction wood code.

---

## H. Rules that restrict routes

| rule | year | exact source title | URL | notes |
|---|---|---|---|---|
| Waste hierarchy, in priority order: (a) prevention, (b) preparing for re-use, (c) recycling, (d) other recovery, e.g. energy recovery, (e) disposal | 2008 | Directive 2008/98/EC (Waste Framework Directive), Art. 4(1) | https://eur-lex.europa.eu/eli/dir/2008/98/oj (text verified at https://www.legislation.gov.uk/eudr/2008/98/article/4) | Art. 4(2) allows specific streams to depart from the hierarchy where life-cycle thinking justifies it |
| No landfilling of waste separately collected for preparing for re-use and recycling (Art. 11(1) and Art. 22 WFD), except residues of later treatment where landfill gives the best environmental outcome | 2018 | Directive (EU) 2018/850, Art. 1, adding point (f) to Art. 5(3) of Landfill Directive 1999/31/EC | https://eur-lex.europa.eu/eli/dir/2018/850/oj (text verified at https://www.legislation.gov.uk/eudr/2018/850/article/1) | |
| Member States shall endeavour to ensure that from 2030 all waste suitable for recycling or other recovery, in particular municipal waste, is not accepted in landfill (best-environmental-outcome exception) | 2018 | same, new Art. 5(3a) of 1999/31/EC | same | An "endeavour" obligation |
| By 2035, municipal waste landfilled must be 10% or less of municipal waste generated (by weight) | 2018 | same, new Art. 5(5) of 1999/31/EC | same | Municipal waste only, not C&I or C&D |
| Spanish hierarchy, same five levels: prevención, preparación para la reutilización, reciclado, otro tipo de valorización (incluida la energética), eliminación | 2022 | Ley 7/2022, art. 8.1 | https://www.boe.es/buscar/act.php?id=BOE-A-2022-5809 | |
| Ban on incineration (with or without energy recovery) and landfilling of waste collected separately for preparing for re-use and recycling | 2022 | Ley 7/2022, art. 25.1 | same | |
| Commercial waste not managed by the local authority, and industrial waste, must be separated at source and collected separately on the same deadlines as municipal fractions. Commercial and industrial **biowaste** producers must separate at source by 30 June 2022. | 2022 | Ley 7/2022, art. 25.3 | same | Municipal biowaste deadlines (art. 25.2.b): 30 June 2022 for municipalities over 5,000 inhabitants, 31 Dec 2023 for the rest |
| Waste must be pre-treated before landfilling | 2022 | Ley 7/2022, art. 27.2 | same | Also RD 646/2020 art. 7.1: only waste that has undergone some prior treatment may be landfilled. Exemptions under art. 7.2, which feed the tax categories in C2. |
| Municipal recycling and preparation-for-reuse targets: at least 55% (2025), 60% (2030), 65% (2035) by weight | 2022 | Ley 7/2022, art. 26.1 c) to e) | same | Art. 25.5: separately collected municipal waste at least 50% by weight by 2035 |
| Municipal waste landfilled at most 40% (1 Jan 2025), 20% (2030), 10% (1 Jan 2035) of municipal waste generated | 2020 | Real Decreto 646/2020, de 7 de julio, art. 8.1 | https://www.boe.es/diario_boe/txt.php?id=BOE-A-2020-7438 | Original BOE publication text, not the consolidated version. Spain's transposition of 2018/850. |

---

## Unresolved / NOT FOUND

1. **DESNZ re-use factors**: none exist in 2026. The sheet FAQ says re-use is out of scope.
2. **DESNZ "Average construction" landfill factor**: blank in the 2026 sheet. The closest published lines are Aggregates/Concrete/Asphalt/Bricks landfill (1.27043) and C&I waste landfill (520.58023). Any substitution is the app's choice and must be labelled.
3. **DESNZ open-loop factors** for paper/board, wood, and food waste: blank in 2026.
4. **WARM mixed C&D**: no such material in WARM v16. Only individual C&D materials (concrete, asphalt concrete, drywall, clay bricks, wood).
5. **WARM LDPE recycling**: NA in v16. Mixed Plastics recycling (-0.93 MTCO2E/short ton) is the only proxy.
6. **WRAP open windrow composting gate fee**: not in the 2025/26 or 2024/25 reports, which cover only IVC.
7. **WRAP EfW gate fee for post-2000 plants**: no age split in current editions. The categories are by material.
8. **Spanish national gate-fee survey** for landfill, EfW or composting: not found. Only local public tariffs were found (Barcelona punt verd 2026, Mallorca 2024) plus one low-confidence AMB cost figure.
9. **AMB (Barcelona metropolitan) per-tonne treatment tariff** for commercial/industrial waste: not found. AMB funds treatment through a per-premises fee (TMTR).
10. **Alt Empordà 2025 tariff PDF** (https://mediambient-altemporda.org/Documents/PDF/resumtarifesweb25def2.pdf): the server refused the connection. A search snippet suggested 89.25 EUR/t for landfilling non-bulky waste plus 7.04 EUR/t for emissions. This was **not verified**, so do not use it.
11. **Spanish or European LDPE film recovered price (EUR)**: not found. The only film prices are UK (letsrecycle) and the EU all-plastics average (Eurostat).
12. **European HMS 1&2 price in EUR from a primary source**: not found. We have AISU (USD, CFR Turkey) and BDSV only via a secondary article. The BDSV primary page was not retrieved.
13. **Grade A waste wood price**: not found as "Grade A". letsrecycle publishes only "High grade" and "Low grade". No European or Spanish wood price was found.
14. **OCC 1.05 Spain/EU**: REPACAR publishes only 1.04. The UK has both 1.04 and 1.05.
15. **WRAP 2010 bulk densities** for wood, mixed C&D, scrap metal and film-only streams: not in the report. Use the EPA 2016 lines.
16. **Current EU consolidated text of 2014/955/EU** on EUR-Lex: could not be fetched. Descriptions were verified on the legislation.gov.uk copy, which is the EU version as at 31 Dec 2020.
17. **Formal mirror-pair status** of 15 01 0x, 17 02 01 and 17 04 0x against the Commission's 2018 classification guidance: not verified.
18. **Scottish and Welsh landfill tax rates**: not checked. The UK figures are UK Landfill Tax (England and NI).
