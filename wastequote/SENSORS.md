# Physical AI for material tracking and waste prevention

The aim is to understand which materials enter the site, how they are used, where they become waste, and whether changes reduce that waste. Use that evidence to prevent losses and find a suitable buyer or treatment route for the material that remains. Better collection quotes and material sale opportunities are outputs of the same records. The photo wizard stays as it is.

The primary interface is a physical observation station at the point where materials become waste: a camera, weighing input, bin identity and an operator feedback screen. It records individual material movements, uses AI to interpret visible material and condition, and helps the operator respond. Collection records reconcile what leaves the site. Buyer matching uses the resulting material evidence downstream.

**Confirmed first-demo scope: camera only; simulate weight and fill readings.** Use live camera frames for perception, a controllable simulator for mass and fill, and a screen for operator feedback. A connected scale and fill sensor are later additions. This document is the implementation plan; the station integration is not implemented or validated by these specifications. Keep live, manual and simulated inputs distinguished per field.

## The physical AI system

The first version is an assisted physical workflow: **sense a material movement → interpret it → give a local instruction → observe or confirm the response → update the material record**. The human moves the material. Automated gates or robotic sorting are a later integration with dedicated equipment controls; a model response is not a machine-control command.

There is an established hardware pattern to learn from: [Winnow VisionAI](https://www.winnowsolutions.com/solutions) combines a camera and connected scale for food-waste identification and tracking. Industrial material identification may need specialised sensors: [TOMRA AUTOSORT FLAKE](https://www.tomra.com/waste-metal-recycling/products/machines/autosort-flake) combines near-infrared, colour and metal sensing. These are references for the approach, not integrations or accuracy guarantees for our materials.

### Put sensing where the material changes state

- **Receiving / unpacking:** scan an incoming material or packaging ID; link it to a delivery, supplier and measured quantity where available.
- **Use / processing:** associate the workstation with its process and current job, and import or enter material issued and useful output. These records explain material use; a waste-bin image cannot reconstruct it.
- **Discard / offcut station — first pilot:** capture each addition before it disappears into a mixed collection, with simulated weight initially and scale measurements later. Attach area/process context, material candidates and a discard reason when confirmed.
- **Collection / dispatch:** record the net outgoing weight and destination, then reconcile with the source observations and remaining stock. This is the existing lift-log adapter's role.

Begin with one source station handling cardboard and plastic film, plus `mixed` and `unknown` outcomes. Inspecting both at the source gives a way to identify separation opportunities before the downstream buyer workflow. An initial pilot must establish whether these classes are distinguishable under the actual lighting, packaging and occlusion conditions.

### Hardware and what each input contributes

| Input | First implementation | Contribution and limits |
| --- | --- | --- |
| Fixed RGB camera and consistent lighting | Required for live perception | Images around each deposit; AI proposes visible material and condition. Do not infer exact polymer, alloy, hidden contents or quantitative moisture from RGB alone. |
| Weight input; later platform scale / load cells | Simulated for the first demo; scale required for live mass | Simulate stable before/after weights and net change. Later choose scale capacity, resolution and tare procedure for the physical station. The AI does not invent kilograms from the image. |
| Bin and station identity | QR/barcode first; RFID optional | Identifies the physical container and its assigned process. Scan a job/material ID for stronger attribution; location alone is contextual evidence. |
| Fill input; later depth/ToF or ultrasonic sensor | Simulated for the first demo; physical sensor optional later | Simulate occupied fraction. Hardware later reports distance/occupancy for capacity planning after bin-geometry calibration. Irregular surfaces and occlusion need validation; fill is not material identity. |
| Local gateway | Laptop for the pilot; deployed gateway later | Reads devices, timestamps events, buffers evidence and retries uploads. Device selection follows the actual camera/scale interfaces. |
| Feedback screen; optional indicator light | Screen first | Shows pending/review status, material suggestion, measured kg and a sorting instruction. Records correction or confirmation. |

Add spectral or other specialist material sensors only when a target buyer specification requires them and they can be evaluated against reference samples. The camera-only first version demonstrates perception and the operator feedback loop; measured-mass accuracy awaits a connected scale.

### From sensor readings to one trustworthy event

1. For the first demo, use an operator “Capture deposit” action to snapshot the live camera and associate the simulator's before/after weight and fill values with that event. Manual triggering does not claim automatic deposit detection. Later, keep a short local camera buffer and monitor the scale: a stable change above a calibrated noise threshold starts a candidate event, with motion/manual capture as alternatives. Record stable readings before and after, with the tare/calibration version. Configure stability windows and thresholds from the station's measured noise and response time.
2. Join images and weight by station identity and overlapping event times. Use device sequence numbers plus event IDs for retries, and retain both capture and server receipt times. Blurred/occluded imagery, excessive clock skew, unstable weight and overlapping deposits create reviewable events rather than invented precise measurements.
3. Derive net mass from stable before/after readings, retaining their simulated status in the first demo and using real scale readings later. Positive changes can be deposits; negative changes can be removal, emptying or a bin change and need an event type. Do not auto-tare on every negative reading. Replacing a bin requires its identity and tare to be re-established.
4. Run perception on the selected event images. Return material candidates, visible condition/foreign-object flags, model version and confidence where available. Unknown or mixed deposits remain unknown/mixed; assigning the whole measured mass to one material requires supporting evidence or operator confirmation. A deposit prediction does not establish the grade of the whole bin.
5. Combine perception with the bin's intended material and process/job context using explicit rules. For an unexpected plastic-film deposit into a cardboard bin, show “Possible plastic film in the cardboard bin — review separation.” If detected after disposal, record the event and prompt a corrective action; do not claim the contamination was prevented.
6. Record the operator response and any observed correction. Acknowledging a prompt is not proof of moving material. Link a removal/redeposit to its original event so an internal transfer does not become a second quantity of generated waste. Unlinked movements stay unreconciled.
7. Update current stock, source-waste metrics and investigation evidence from accepted events. Revise affected buyer readiness when condition changes. Create a separate collection record only when an actual emptying/dispatch is observed and confirmed.

### Event contract and application integration

Add an observation layer before the existing single-stream lift contract. A proposed event includes:

```ts
{
  schemaVersion: 1,
  eventId: "station-01-boot-07-0042",
  siteId: "acme-zona-franca",
  stationId: "unpacking-01",
  binId: "cardboard-pilot-01",
  eventType: "deposit", // also removal, transfer, emptying, bin_change, observation
  capturedAt: "2026-10-14T09:15:00Z",
  mass: {
    beforeKg: 2.4, afterKg: 3.2, deltaKg: 0.8,
    method: "simulated_scale_delta", mode: "simulated",
    deviceId: "demo-simulator", calibrationId: null, stable: true
  },
  fill: { pct: 35, method: "demo_input", mode: "simulated" },
  evidence: [{ id: "frame-0042", kind: "image", mode: "live" }],
  context: { processId: "unpacking", jobId: null, reason: "unknown" },
  perception: null, // asynchronous, versioned AI result attached later
  reviewStatus: "pending"
}
```

The numbers above illustrate the camera-plus-simulator contract; they are not readings from connected scales or fill sensors. In the stored form, preserve each source reading's timestamp and unit alongside the derived event. Set mass to `null` when absent; `mode` is `live`, `manual` or `simulated` on every supplied measurement/evidence item. A live image does not make its associated simulated weight live. Store corrections as revisions with their author and time. Keep the raw event immutable, with schema validation and idempotent ingestion.

- **Station UI → `app/api/sensors/events/route.ts` (proposed):** for this demo, browser camera capture plus labelled mass/fill simulator inputs. Handle camera permission/unavailability explicitly; use a fixture only with a visible recorded-image label. Store events under a demo site so simulated quantities cannot enter real tracking totals. Later a gateway uses the same contract for hardware readings, with authenticated device-to-site mapping, validation, durable storage, acknowledgement, local buffering and retry deduplication.
- **Perception worker → existing `lib/vision` provider interface:** add an event-specific schema for candidates, visible conditions and evidence quality. Process asynchronously; the existing photo workflow and its volume estimates remain separate. Reuse provider access, not an assumption that photo-quote outputs are suitable sensor measurements. Inspect the actual interface when implementing this adapter.
- **Local feedback:** show “Weight: 0.8 kg — simulated”, the simulated fill and “Analysing” while classification is pending. Separately identify live AI inference versus recorded/stub predictions; a live camera frame does not make a stub prediction live. The current cloud vision path may be slow; measure capture-to-feedback latency. Prompt before-disposal sorting only in a workflow that waits for the result. Low-latency edge inference is a later option after model and hardware evaluation; no real-time claim until measured.
- **Event aggregation → tracking and `lib/sensors.ts`:** keep deposits, internal movements and collections distinct. The existing quote adapter receives only validated collection records; it must never count a deposit as a truck lift. Pricing and route rules remain deterministic.
- **Review and learning:** operator corrections become labelled examples for evaluation. Evaluate model versions on held-out events from different days; deploying a new version requires measured improvement. Do not claim that recording a correction automatically retrains the model.

Keep camera framing on the material/scale area. Retain the event evidence needed for review with a configured retention period; continuous video is not required for this pilot.

### First physical demo and acceptance checks

Use a small pilot bin with its own identity and explicit demo configuration; it is not the fixture's 20 m³ roll-off. The agreed setup is **one live camera, simulated weight/fill and the feedback screen**. Simulator controls enter a nonnegative deposit mass and a fill percentage in 0–100; derive cumulative demo weight from movements and label all resulting totals simulated. Fill is independently supplied by the simulator, not inferred from camera accuracy or assumed to rise in a fixed proportion to mass.

The demonstration is: select/scan the bin and process → show cardboard and capture a deposit → attach a simulated 0.8 kg increment and fill reading → review/confirm the AI material suggestion → show plastic film and capture a second event → see an unexpected-material prompt → record a correction → inspect the evidence trail and simulated stock. Use a fresh event image for each deposit. A source station can show this after its first event; the quote engine still needs sufficient collection history. The correction demonstrates separation, not a reduction in kilograms generated.

For this demo, evaluate material classification against independently labelled camera samples, capture-to-feedback latency and correction handling. Include unknown/mixed cases and report sample counts and model/camera configuration. Simulator arithmetic tests are software checks, not evidence of physical weighing accuracy. Once scales and automatic triggers are added, measure event detection precision/recall against a manually counted deposit log and mass error against independently weighed test objects. Set acceptable thresholds before evaluating the selected configuration; no unsupported percentage-accuracy promise.

Before declaring the camera demo functional, check repeated uploads produce one event; one capture creates one deposit regardless of image count; a simulated 0.8 kg addition records one simulated 0.8 kg movement; no mass/fill is claimed measured; unknown imagery stays reviewable; and a linked simulated transfer is counted once across the site. Later hardware checks include network buffering, unstable readings, bin changes/emptying and people leaning on the bin. The station may require operator confirmation to resolve ambiguous load changes.

## Questions the system should answer

- **What materials are used?** Track purchased or received materials separately from materials observed in waste, with explicit links where known. Cardboard in a bin might be incoming packaging, outgoing packaging offcuts or a discarded product; its material label alone does not tell us its use.
- **How are they used and lost?** Connect material records to a work area, process, product or job, and a confirmed discard reason where available. Show unknown origin instead of assigning waste to a process from collection time alone.
- **Where can we prevent waste?** Find repeated, attributable losses such as packaging discarded during unpacking, cutting offcuts, damaged stock or over-ordering. Suggest a specific investigation or trial and measure its result.
- **How reliable is the tracking?** Show measured mass, estimated mass, material identification evidence, missing periods and reconciliation differences. Improve these against independent checks rather than claiming accuracy from more readings alone.

This combines records, operational observations and waste composition checks, consistent with the [EPA's waste assessment approach](https://www.epa.gov/smm/instructions-conducting-waste-assessments). The thresholds and data contracts below are our prototype choices, not standards from that guidance.

## Product reference: ScrapAd

ScrapAd's public site describes a marketplace for scrap and recyclable metals. Its [service workflow](https://scrapad.com/en/our-service/) includes verified companies, buy/sell advertisements, price negotiation, payments, logistics and transaction tracking. Use that workflow as a product reference for Selinsight. This review covers its public pages; the authenticated marketplace was not inspected. These are ScrapAd's stated services, not capabilities already present in our app.

Our proposed workflow is **track materials → investigate avoidable waste → prepare available material → compare buyers and treatment routes → arrange collection → reconcile the outcome**. Sensors and operational records supply the evidence behind the material offer. Keep prevention opportunities visible even when the material has a resale value.

Start with the existing salesperson at the waste-management company managing opportunities for a customer site. Each lot must name its material owner and the party authorised to arrange its sale. A general public marketplace can follow once the workflow works with a small buyer catalogue.

### What to adapt

1. **Material lots.** Create a draft from a confirmed observation or stock record: material, grade/specification, condition/contamination, available quantity and measurement basis, photos/evidence, location, packaging, owner and collection window. Allow one-off lots and separately labelled recurring supply forecasts. Historical collections establish trends but are already removed stock; they cannot become available inventory. Reserve quantities against lots to prevent offering the same material twice.
2. **Buyer requirements.** Store the material/specification a buyer accepts, contamination limits, minimum quantity, packaging, collection area, availability and stated price basis. Match against explicit requirements and show why a buyer matches or what is missing. Our broad `scrap_metal` category is insufficient for an alloy-specific request; unknown grade requires confirmation. General route eligibility does not establish a particular buyer's acceptance.
3. **Comparable offers.** Show buyer payment, preparation/sorting, loading, transport and transaction costs on the same quantity, currency and tax basis. `Net proceeds = buyer payment − seller-borne costs`; negative proceeds mean a net cost. Show offer validity and whether each amount is indicative, sample or confirmed. Compare against a treatment quote for the same material and service scope; do not compare a single-lot sale directly with a monthly service price. Do not add a buyer payment on top of an engine rebate for the same material.
4. **Collection and reconciliation.** Track draft, offered, agreed, collected, received and settled states, plus cancellation or dispute. Retain agreed quantity/grade, actual dispatch and received weights, deductions and actual payment. A draft offer is not a completed sale; collection alone is not proof of recycling or reuse. Link the collection to existing tracking records so it is counted once.
5. **Company and evidence status.** Show whether buyer/company details and material evidence have been reviewed, with the basis and date. Sample companies remain labelled sample. Payment protection, counterparty verification and managed logistics need real services and operational processes before the product promises them.

### First demo of the buyer workflow

Keep the first version within the site workflow: a material summary, a lot detail view and a buyer/route comparison. Use a small `demo/buyers.json` catalogue with explicit acceptance conditions and sample offers. Drafts stay inside the demo; this stage does not contact buyers, publish listings, move money or book collections.

Add a separate sample lot of **1,000 kg of currently available, dry, low-contamination cardboard**, with its own stock timestamp and sample weight evidence. This lot is additional to the historical lift fixture, not recovered from its 7,560 kg of already collected waste. Include one compatible sample buyer, one with a 2,000 kg minimum and one that does not accept cardboard. Only the first matches, with reasons shown for the others. Historical high-contamination lifts must not be relabelled clean to satisfy a buyer; a cleaner future lot remains hypothetical until observed and confirmed.

For a simple sample offer, show €100 gross payment less €30 seller-paid transport and €10 preparation: **€60 indicative net proceeds**, excluding VAT, with all other seller-borne charges explicitly set to zero for this fixture. If a charge is unknown, mark the net result incomplete. Keep this lot calculation separate from the current monthly engine until a comparison over an equivalent quantity and service scope is implemented. An action labelled “Create draft offer” creates an internal draft, and the demo stops before external publication or commitment.

The longer-term marketplace can add buyer requests, competing offers, negotiation and service integrations. The immediate product value is turning a site's measured material into an evidenced opportunity with a clear next action.

## Data needed beyond the collection log

Keep these records separate and link them by site, material, physical bin, time interval and explicit job/batch references when available. A collection may combine several processes; it must not inherit a single origin without evidence.

| Record | Minimum useful information | What it supports |
| --- | --- | --- |
| Bin assignment | Physical bin ID, area, process, intended material, assignment start/end | Locating waste without attributing past events to a bin's current location |
| Material receipt/use | Material or SKU, quantity and unit, supplier, date, job/process if known, stock movements | Understanding inputs and intended use; receipts alone are not consumption |
| Source waste observation | Time or accumulation interval, bin, material candidates, measured mass if available, process/job link, discard reason, evidence | Identifying where material becomes waste before it is mixed or collected |
| Activity | Period, process, output quantity and unit, product mix or relevant workload | Comparing waste per unit produced, delivery handled or other appropriate activity |
| Collection | The lift record below, linked scale ticket and destination evidence if available | Tracking material leaving the site and reconciling onsite observations |
| Intervention | Target material/process, action, owner, start date, baseline and follow-up periods, cost | Checking whether a prevention trial improves results |
| Available material lot | Owner, current quantity, material/specification, condition, evidence, location, availability and reserved quantity | Creating an offer from material actually available for sale |
| Buyer requirement / offer | Buyer, acceptance criteria, quantity, price basis, seller-borne costs, validity and status | Matching a lot and comparing indicative or confirmed net proceeds |

For example, an operator can scan a job or material barcode and choose “cutting offcuts” when weighing a source bin. A camera can propose material and discard condition for confirmation. A fill reading supplies occupied volume; the plan must not treat it as material identity, exact mass, supplier identity or proof of how the material was used. Unknown and mixed classifications remain visible for review. A visual composition estimate must not be presented as a measured mass fraction.

Start with area/process assignments and a short operator reason list (`packaging`, `offcuts`, `damaged`, `expired`, `over-ordering`, `unknown`), plus a weekly activity entry. Purchasing and production imports can follow. Missing context reduces the claims we can make; it does not erase valid waste measurements.

## What a sensor row is

One row per completed collection, for one physical bin and one material stream. Fill is measured immediately before emptying; weight is net waste weight, excluding the container and vehicle. The demo assumes each collection empties the bin fully.

```ts
{
  id: "acme-cardboard-2026-08-07",
  siteId: "acme-zona-franca",
  streamId: "cardboard",
  binId: "cardboard-01",      // physical bin identity
  at: "2026-08-07T06:40:00Z", // when the truck emptied it
  containerId: "roro_20",     // container type in the price book
  fillPct: 60,                // measured fill, 0–100
  kg: 756,                   // measured net waste weight
  material: "cardboard_paper",
  contamination: "high"      // camera-classified or operator-confirmed grade
}
```

This is the validated single-stream input for the quote adapter. Preserve raw readings and uncertain/mixed material observations separately; require review before mapping them to this contract. A mismatch with the intended stream is a tracking finding, not a reason to delete the observation.

Validate timestamps, known container/material IDs, contamination labels, finite fill in 0–100 and finite nonnegative kilograms. Deduplicate identical records by `id`; conflicting records with the same ID are an error. Scope records by site and stream, and reject a material that differs from the stream's configured material from the quote adapter. Do not silently discard invalid records and report complete coverage.

`fillScale` is a positive calibration factor, default `1`, configured for this site's stream and sensor setup. Corrected fill is `fillPct / 100 × fillScale`; values above `1` require a calibration correction before quoting. The demo uses one bin type and no compactor.

## More accurate waste tracking

For every quantity and classification, retain its source record/device, event time, unit, measurement or estimation method, quality status, and any calibration or operator correction. Keep raw values and version corrections; record classification confidence where provided and whether a person confirmed it. Confidence is not evidence of measured accuracy.

- Prefer a valid, collection-linked net scale weight for collected-mass reporting. Show fill × reference density as an estimate when weight is absent or invalid, and label the estimated share. Missing measurements stay missing rather than becoming zero. Do not use a truck's combined weight as an exact allocation to each site or material.
- Count each physical movement once. Source-bin deposits, internal transfers, truck lifts and facility receipts are different views or stages of the same material flow, not quantities to add together. Link them and reconcile at the appropriate boundary.
- Separate **waste generated** from **waste collected**. For a complete site boundary, generated waste = external collections + closing onsite waste stock − opening onsite waste stock, adjusted for documented other inflows/outflows. Without stock coverage, report collected waste and label any generation estimate and its assumptions.
- Preserve units and material scope. A mixed load has a measured total weight but needs weighed separation or an explicitly estimated allocation before reporting kilograms by material. Leave any unallocated mass visible.
- Check scale zero/tare and calibration records, sensor gaps and impossible jumps. Compare matched bin/load measurements against independent scale tickets and material predictions against manually sorted and weighed samples. Report mismatch rates, sample counts and periods; set acceptable tolerances for the selected equipment and workflow before claiming an accuracy improvement.
- Show quality measures alongside totals: percentage of collections with valid measured weight, percentage of reported mass estimated, complete weeks / expected weeks, unclassified or unallocated mass, and unmatched collection/ticket counts. Do not invent a single “accuracy percentage”.

Tracking totals use actual period sums. The quote adapter below uses a median representative week and currently estimates tonnes from volume and density. Label these separately: a representative monthly quote is not an actual monthly waste report. Using measured mass directly in pricing would require an explicit engine/type change and is a later step.

## Turning observations into waste reduction

For each material and process with sufficient coverage, show absolute waste and waste intensity: `attributedWasteKg / activityUnits` over the same period and boundary. Only calculate a material loss rate (`attributedWasteKg / materialConsumedKg`) when consumption and waste refer to the same material and process, with inventory and transfers accounted for. Do not divide this month's waste by this month's purchases and call it a yield. Missing or zero denominators produce “not available”.

Each opportunity should contain the observed evidence and coverage, a possible explanation, a proposed action, the metric to watch and what remains unconfirmed. For example: repeated weighed packaging waste at an unpacking station, confirmed as incoming cartons, can prompt a trial of returnable packaging with that supplier. A Friday collection pattern alone cannot identify that supplier or justify the same claim.

Record a baseline, action date and follow-up period. Compare like-for-like processes, workload and product mix; show both kg and kg per activity unit. Where comparable, estimate avoided waste as `baselineKgPerUnit × followUpUnits − followUpWasteKg`, preserving negative results as increases. Label this as a baseline comparison, not proven causation. Do not claim savings when coverage is insufficient or the process/product mix changed materially.

Keep prevention, reuse, recycling and collection optimisation distinct. A cleaner stream can unlock recycling without reducing kilograms generated. Fewer truck collections can reduce collection costs without reducing material waste. Show avoided purchasing costs only when an actual reduction in material consumption and a supported unit cost are available; keep them separate from disposal savings and subtract intervention costs when presenting a net saving. The existing treatment CO₂e factors do not establish the upstream benefit of avoiding material purchases.

## The quote analysis

New file `lib/sensors.ts`. Inputs are validated lifts for one site's material stream, its baseline `StreamInput`, `fillScale`, timezone, observation window and coverage metadata. Output includes `ready`, reasons, weekly totals, contamination counts, warnings and an optional derived `StreamInput`. The aggregation is deterministic; any camera classification happens upstream.

**Window and coverage.** Use an explicit start-inclusive, end-exclusive observation window in the site's timezone (`Europe/Madrid` for this demo). Group by local ISO week, including the ISO week-year. Coverage metadata lists the Monday dates of weeks whose collection log is known to be complete; absence of records alone does not prove zero collections. Use only full Monday-to-Monday weeks inside the window that are marked complete. Exclude partial and incomplete weeks, report the exclusions, and include a complete week with no lifts as zero volume. Show the period used. Collected volume is a proxy for generation, assuming no material change in waste stored at the site's window boundaries.

**Ready.** Require at least 8 unique valid lifts across at least 3 complete weeks, and a positive median weekly volume. Otherwise return `ready: false` with the reason and use the baseline quote. Count only lifts in the included weeks. Readiness does not guarantee enough evidence for a weekday pattern.

**Volume.** Each lift is `fillPct / 100 × fillScale × container.size_m3 × container.compaction_ratio` loose cubic metres, matching `StreamInput.volumePerWeekM3`. Sum each included week and take the median, averaging the middle two values for an even number of weeks. Do not apply the engine's service fill factor to these measurements; it is a separate capacity-planning assumption. Compaction ratios come from the price book and remain assumptions, not sensor measurements.

**Weight check.** Over exactly the same included lifts, calculate `expectedKg = totalLooseVolumeM3 × material.bulk_density_t_per_m3 × 1000`, then `mismatch = abs(totalMeasuredKg - expectedKg) / expectedKg`. Warn only when mismatch exceeds `0.30`: “Measured weight and fill-based weight estimate differ; check fill calibration, density and weight records.” If both totals are zero, there is no mismatch; positive weight with zero expected weight gets a warning without dividing by zero. Use total lift volume here, not median weekly volume. Quoting still derives tonnes from fill-based volume and the reference density; measured kilograms are a cross-check, not a pricing input.

**Contamination.** Show the count and percentage of lifts in each grade. For the demo's quoting policy, choose `high` if at least 25% of lifts are high; otherwise choose `medium` if at least 25% are medium or high; otherwise choose `low`. This is a conservative, count-based quoting grade, not a measured contamination percentage for the combined waste. It gives small and large loads equal weight. A single high lift cannot set the grade to high once ready; a Friday-only pattern in five equally frequent weekdays is 20% and does not meet the high threshold.

**Collection-day pattern.** Group included lifts by local weekday. Flag a weekday only if it has at least 3 high lifts across at least 3 distinct weeks, at least 60% of its lifts are high, and the other weekdays together have at least 3 lifts across at least 3 distinct weeks with at most 25% high. Report observed counts and days, for example: “Friday: 5/5 lifts high; Monday: 0/5 high. Investigate waste accumulated before Friday collections.” Do not make claims about unobserved weekdays or infer when contamination occurred. If evidence is insufficient, say so instead of emitting a pattern.

**Baseline and service configuration.** Preserve the configured material and EWC code from the baseline; the lifts do not establish an EWC code. Once ready, replace only its weekly volume and quoting contamination grade. For the standalone sample page, keep an explicit sample baseline and `ServiceConfig` alongside the lift fixture. The baseline represents a photo estimate; it is not read from an unrelated wizard session. Keep container count, frequency and route distances fixed between the baseline, derived and cleaner scenarios so the comparison isolates the stream changes.

## What the engine already does with it

Call `evaluate(derivedStream, config)` from `lib/engine/index.ts`. Capacity warnings already say the container is undersized or oversized. `UnlockStrip` in `components/wizard/CompareStep.tsx` already searches successively cleaner grades for one that opens a recommended circular route and shows the euros and CO₂e. It can require more than one grade of improvement.

Use that same search for the site's hypothetical cleaner scenario, keeping volume and service configuration fixed. Label the results “Quote from collection history” and “What if contamination improves to [grade]”. The weekday pattern motivates investigation; it does not prove that an intervention will achieve the cleaner grade. The comparison excludes intervention costs. If no cleaner grade opens a circular route, say so. Extract shared comparison rendering as needed: `UnlockStrip` is currently private and the wizard UI expects callbacks, so it is not a drop-in server-page component.

## The screen

A site page, `app/sites/page.tsx`, for the sample customer already in `data/company.json` (Acme Fabrication, Zona Franca), with a client-side station panel for camera access and operator interaction. Put station observations and material tracking first, then investigations, buyer opportunities and quote comparisons.

- The station panel shows camera preview/capture, bin/process selection, simulated mass/fill controls, inference/review status, a sorting prompt and confirm/correct actions. Show separate labels for live camera, AI provider/stub, simulated weight and simulated fill. The event list links each result to its image and revisions.
- Always show available tracking evidence independently of quote readiness: period, collected kg by material, measured/estimated status, source areas and unknown origins, coverage and reconciliation gaps. Do not hide valid observations just because there are fewer than 8 lifts.
- Show waste intensity when matched activity exists, then evidence-backed prevention opportunities or the missing context needed to investigate. Keep hypothetical actions separate from measured intervention results.
- For confirmed available lots, show “Find buyers”, acceptance criteria, sample/confirmed offer status and net proceeds. Provide “Create draft offer” for a compatible sample buyer. Keep prevention, buyer offers and treatment quotes individually identifiable.
- Before ready: show both lift and complete-week counts, any exclusions or validation errors, and “The quote still uses the sample photo estimate.” Give a separate reason for a zero-volume period.
- Once ready: median loose m³/week, the contamination mix and derived quoting grade, the weekday finding or insufficient-evidence message, and any weight warning. Then show the route comparison for collection history against the hypothetical cleaner scenario.
- Sample-data badge, same as the price book. No chart library. A list of weeks is enough.

## Demo fixture

`demo/lifts.json` contains the site/stream settings, baseline, service settings, coverage and 10 lifts over five complete weeks. The observation window is `2026-08-03T00:00:00+02:00` to `2026-09-07T00:00:00+02:00`; mark all five weeks complete. Each listed collection is at `06:40:00Z`, uses `roro_20`, `fillScale: 1`, and the same physical bin. Use the site and stream IDs shown above and a unique ID per lift.

| Monday / Friday dates (2026) | Monday fill / grade | Friday fill / grade | Loose m³ that week |
| --- | --- | --- | --- |
| Aug 03 / Aug 07 | 40% / low | 60% / high | 20 |
| Aug 10 / Aug 14 | 45% / medium | 65% / high | 22 |
| Aug 17 / Aug 21 | 50% / low | 70% / high | 24 |
| Aug 24 / Aug 28 | 55% / medium | 75% / high | 26 |
| Aug 31 / Sep 04 | 60% / low | 80% / high | 28 |

Set each lift's sample weight to its loose m³ × 63 kg/m³, matching the current cardboard reference density of `0.063 t/m³`. These synthetic weights intentionally agree with the model; they do not validate the density or sensor accuracy.

The sample baseline is `{ material: "cardboard_paper", contamination: "medium", ewc: "15 01 01", volumePerWeekM3: 12 }`. The service uses `{ containerId: "roro_20", containerCount: 1, frequencyId: "twice_weekly" }` and `distanceKm: defaultDistances("cardboard_paper")` from the engine. This matches the fixture's two collections per week.

Expected results: ready, **24 m³/week**, 3 low / 2 medium / 5 high lifts, quoting grade **high**, Friday 5/5 high versus Monday 0/5, and no weight warning. Total volume is 120 m³ and total weight is 7,560 kg. The page opens already past the readiness threshold.

Add `demo/material-context.json` for the same site and weeks. Include the bin's area assignment and sample site activity of 1,000 / 1,100 / 1,200 / 1,300 / 1,400 units produced per week. Use an explicit `units_produced` denominator and mark all activity values as sample data. Weekly collected weights are 1,260 / 1,386 / 1,512 / 1,638 / 1,764 kg, so collected-waste intensity stays at **1.26 kg per unit** despite rising weekly volume. This is a site-level comparison; without source observations it does not attribute the cardboard to a production step or establish waste generated.

The demo should therefore say “Collected waste rose with activity; kg per unit stayed constant”, retain the Friday contamination investigation, and request source/process evidence before proposing a specific prevention action. No observed waste reduction or improved sensor accuracy is claimed from these synthetic fixtures. A later intervention example must add an explicit action and comparable follow-up data.

## Checks

Add event-ingestion and perception contract checks alongside the existing engine checks. Keep physical-device evaluation separate from deterministic software tests:

- One capture with multiple images and repeated ingestion retries → one movement; identical images alone are not an event identity because separate deposits can look alike
- Live camera + simulated mass/fill → mixed provenance shown correctly; no simulated quantity enters real measured totals
- Missing/unstable weight → unmeasured; an unknown or mixed AI result retains measured/simulated total mass without inventing per-material allocation
- Operator correction preserves original prediction/model evidence and updates the affected record without duplicating mass
- Review/feedback works from the first source event; no deposit is counted as a collection lift

Existing quote/tracking/buyer checks:

- 7 lifts → not ready
- 8 lifts in fewer than 3 complete weeks → not ready
- 10-lift fixture → the exact results above, with baseline material and EWC preserved
- Partial/incomplete weeks are excluded; confirmed complete zero-lift weeks remain in the median; an even week count averages its middle values
- A timestamp near a UTC/local week boundary is grouped by `Europe/Madrid`, with distinct ISO years kept separate
- A 40% weight mismatch warns; exactly 30% does not; zero expected weight is handled without division by zero
- A compactor lift uses its compaction ratio to produce loose volume
- 2 high + 6 low lifts → high at the 25% boundary; 1 high + 7 low → low
- Fewer than 3 distinct weeks of high Fridays, or insufficient observations on other days → no weekday finding
- Duplicate IDs cannot inflate readiness; conflicting IDs, invalid measurements and mixed-material input are rejected
- Matched source observations and collection tickets are not double-counted; corrections preserve the raw record
- Missing weight uses a labelled estimate, not zero; mixed-load mass is not silently assigned to one material
- Activity fixture → constant 1.26 collected kg/unit despite increasing weekly totals; missing/zero activity → no intensity
- Unknown process or discard reason → no asserted cause or process-specific prevention saving
- Cleaner contamination alone → no claim of reduced waste generation; incomplete follow-up → no claimed intervention saving
- The separate 1,000 kg available cardboard lot matches only the compatible sample buyer; material, quantity or grade mismatches explain exclusion
- Already collected or reserved material cannot inflate available lot quantity; missing buyer-required specifications cannot produce a confirmed match
- Sample offer → €60 indicative net proceeds; unknown charges → incomplete total; no duplicate engine rebate
- Creating a draft does not mark the material sold, collected or recycled, and does not change measured waste totals

## Order

1. Implement the observation contract, idempotent event/evidence storage and a camera station panel with mass/fill simulator. Make provenance visible from the first event.
2. Adapt the vision provider for event classification; add asynchronous status, unknown/mixed handling, sorting feedback and operator corrections. Validate the live-camera demo before extending the marketplace.
3. Add `lib/sensors.ts`, `demo/lifts.json` and `demo/material-context.json` for historical collection analysis, source-event reconciliation and activity-normalised waste. Keep the quote adapter separate from event and actual-period summaries.
4. Show the station and tracking on the site page, with investigations and `evaluate` on the derived collection stream. Add the home-page link and intervention baseline/follow-up records.
5. Connect a real scale through a gateway and independently validate mass/event detection; optionally add a fill sensor. Import purchasing/production data when available, and only calculate consumption/yield metrics with supported inputs.
6. Add available lots and `demo/buyers.json`, acceptance matching, net proceeds and internal draft offers. Real buyer transactions and services follow when partners are connected.

## Later: scale and fill hardware integration

A live integration can feed the same validated quote contract, but a `POST` endpoint alone is not the integration. It needs authenticated site/device mapping, stable event and collection IDs for retry deduplication, durable storage, timestamp and unit validation, and coverage tracking for missing data. Fill, net weight and contamination may arrive from different systems and must be joined to the same collection before quoting. Retain source waste observations at their own event times for process analysis; do not replace them with truck collection times. Purchasing and production records join through explicit material/process references and matching periods. The quote engine can remain unchanged for the first stage; the broader tracking and prevention analysis uses the additional records described above.
