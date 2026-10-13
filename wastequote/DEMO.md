# Selinsight: 60-second demo

**Photo to use:** `demo/02-mixed-construction.jpg`, the yellow builders' skip ("Builders' skip, mixed site waste" in the app's demo row). It is the photo that shows everything: a flagged field, a hazard check, a contamination call that changes the route, and three routes open side by side.

## Before you go on

1. `cd wastequote && npm run start:demo`, then open http://127.0.0.1:3456/quote/new in a full-width window.
2. Check the badge top right of the photo step:
   - **"Vision: Selinsight AI"**: live. The assistant needs about 30-40 s to read the photo. The script below fills that time with the problem statement.
   - **"Vision stub · recorded demo results only"**: no Sailsrep key on this machine. The result comes back in under a second; skip the waiting line.
3. Optional safety net: `WASTEQUOTE_VISION=stub npm run dev` gives the recorded classification instantly. Use it if the venue wifi is bad.

## The script

| Time | Click | Say |
| --- | --- | --- |
| 0:00 | Click the **builders' skip** photo. | "A waste company's salesperson is at a building site. Today a quote like this takes days: someone visits, guesses the material, phones three plants for prices, and the customer gets one price for one route, usually the cheapest, usually landfill." |
| 0:10 | (The AI is reading the photo.) | "We take a photo. Selinsight AI reads it and fills in the CPQ configuration: material, contamination, volume, EWC code. The AI only classifies. It never sets a price." |
| ~0:35 | Classify step appears. Point at the **orange flag** on the field under 70% (usually volume). | "Every field has a confidence score. Under 70% the salesperson must check it before going on." Click **Confirm** on it. |
| 0:40 | Point at the red **Check before collection** box, then the green **Circular opportunity** box. | "It flags possible asbestos in the old plaster, and tells you what to separate to unlock recycling." |
| 0:45 | If contamination says **High**: click **Medium** and watch the price in the right rail. If it already says Medium, click High and back to show it. | "The site manager says the bags are packaging. Medium. Recycling opens, and the monthly price drops by about a third." (Live run on 14 Oct: Recovery €2,526/month became Recycling €1,571/month.) |
| 0:50 | **Configure service** → **Compare routes**. | "Containers the rules don't allow for this stream are greyed out with the reason. Those rules live in the CPQ engine." |
| 0:55 | Compare step: point at the green strip and the **Recommended · circular** card. Click one price line, e.g. **Treatment gate fee**. | "Every route side by side, cost and CO₂e. Recycling instead of landfill saves money and avoids tonnes of CO₂e a year. Every number opens to its formula and its source, and anything we don't have a real source for is marked sample data." |
| 1:00 | **Accept route & generate quote** → **Quote PDF**. | "One click: a one-page quote and a draft waste transfer note, validated by the CPQ engine." |

## If you have more time

- **Ask Selinsight** (bottom right, from the classify step on): "Why are some routes not allowed for this stream?" It answers from the rules and the photo it has already seen. If it changes a selection, the quote re-prices and shows what changed.
- **Specs**: on the Configure and Compare steps, open **Specs** on a container or **Specs** on a route card.
- **The law, not just prices**: run the cardboard photo (`01-cardboard.jpg`). At low contamination, landfill and energy from waste are both closed. The rules cite the EU Landfill Directive and Spain's Ley 7/2022 art. 25.1, so recycling is the only route on offer.
- **Waste transfer note**: on the quote page, **Waste transfer note (draft)** is pre-filled with the EWC code, container, quantities, transferor, transferee and destination operation code.
- **Price book** (top nav): every table, every source, every sample marker.

## Other test photos

| File | Shows | What to point at |
| --- | --- | --- |
| `demo/01-cardboard.jpg` | Roll-off of cardboard with some bubble wrap | Low contamination flagged; landfill and EfW closed by law; the €71/t rebate is a real Spanish price (REPACAR Q2 2026) |
| `demo/02-mixed-construction.jpg` | Builders' skip, mixed renovation waste | The main script above |
| `demo/03-wood.jpg` | Pile of broken pallets | Medium contamination keeps reuse closed; set Low (intact pallets sorted out) and reuse opens with a rebate |
| `demo/04-scrap-metal.jpg` | Mixed scrap in a roll-off | Recovery is never offered for metal (it does not burn); the appliance is flagged as WEEE |

Photos: Wikimedia Commons, CC BY-SA, credits in `demo/CREDITS.md`.

## Don't

- Don't type a real customer's email anywhere. Selinsight never calls Sailsrep's `/quote` (which emails), but keep the habit.
- Don't present the gate fees, container prices or transport costs as real. They are sample values and the UI says so. The taxes, the cardboard rebate, the densities and the emission factors are sourced.
