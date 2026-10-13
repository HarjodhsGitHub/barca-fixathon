# sailsrep Configurator API

**v2** · catalog `wastequote-waste-collection-service-2610132242` @ version d94c7989eed1 · generated 2026-10-13

Build a product configurator on your own frontend. You send selections, we return
everything needed to draw the next screen: what exists, what is still selectable,
what has become impossible and why, and what it costs.

This page is everything you need to ship a working configurator. The reference
topics at the bottom are fetched when you need them, not read up front.

---

## Three rules

Everything here assumes these. Breaking them causes almost every integration
problem we see.

**1. Render from the document, never from knowledge of the catalog.**
Your code must still work when a module is added, renamed, reordered or removed.
Branch on `moduleType`. Never branch on a module id.

**2. The document is the whole truth.**
After every call, re-render from the response. Never merge it into state you
derived yourself, and never compute availability or price on the client. You
cannot: the rules that produce them are not in the document, by design.

**3. Ignore what you do not recognise.**
Fields and events may be added, and may appear when your sailsrep settings
change. Anything documented here is stable and will not disappear. Anything you
have not seen, skip.

---

## Base URL and authentication

Every path on this page is relative to:

```
https://prod-backend.sailsrep.ai/api/self-service/v2
```

So `POST /configurations` means `POST https://prod-backend.sailsrep.ai/api/self-service/v2/configurations`.

One key, created in the sailsrep portal under Settings, API. Send it as a bearer
token on every request, including the request for this page:

```
Authorization: Bearer ss_test_xxxxxxxx
```

A key can be locked to a list of domains, which is what makes it safe to use
from a browser. A key with no domains listed is not restricted.

---

## The loop

Four calls. Two of them are optional.

```
POST /configurations              start
PUT  /configurations/{id}         every time the customer changes something
POST /configurations/{id}/chat    the assistant, if you want one
POST /configurations/{id}/quote   finish
```

```js
const BASE = 'https://prod-backend.sailsrep.ai/api/self-service/v2';
const KEY  = 'ss_test_xxxxxxxx';

// start
const res = await fetch(`${BASE}/configurations`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
  body: '{}',
});
let config = await res.json();

// the customer picks something: send the complete set, always
async function select(moduleId, variantId) {
  const selections = config.modules
    .filter(m => m.selection)
    .map(m => ({ moduleId: m.id, variantId: m.selection.variantId }))
    .filter(s => s.moduleId !== moduleId)
    .concat({ moduleId, variantId });          // most recent last, see below

  const r = await fetch(`${BASE}/configurations/${config.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ selections }),
  });
  config = await r.json();                      // re-render from this, entirely
}
```

A configuration starts empty, because nothing has been decided yet. Every module
nobody has picked still tells you what it would get, so you can show a whole
product before the customer has chosen any of it: see `rendering`.

You send the **complete** set of selections every time, not a delta. The call is
idempotent, safe to retry, and there is no session to fall out of sync.

That is also how you clear. Leave a module out of the set and its selection is
cleared; send `"selections": []` and the configuration is empty again. There is
no delete call because there does not need to be one. To take back the last
change without working out what it was, `POST /configurations/{id}/undo`: see
`history`.

**Order is priority, most recent last.** The newest pick is the one the
customer just made, so it is the one that stays, and older picks give way to
it, oldest first.

A set that does not fit together is refused, and nothing is stored: the
document already says what is `blocked`, so this is not a click you let
through. To let the customer override, send the same set with `"force": true`;
what gave way comes back as `dropped`, with names and a sentence to show them.
See `errors` for the refusal.

Show that to the customer. It is the single most confusing moment in any
configurator, and it is the one place the API hands you the exact words.

---

## The document

```jsonc
{
  "id": "cfg_example",
  "status": "draft",
  "language": "en",
  "languages": [
    "en"
  ],
  "catalogVersion": "d94c7989eed1",
  "catalog": {
    "newer": false
  },
  "history": {
    "undo": 0,
    "redo": 0
  },
  "modules": [
    {
      "id": "feat-material",
      "name": "Waste stream",
      "moduleType": "feature",
      "question": "Which waste stream is it?",
      "description": "The material in the container. WasteQuote suggests it from a photo.",
      "longDescription": "## Waste stream\nThe vision step in WasteQuote suggests the stream from a photo; the salesperson confirms it.",
      "order": 5,
      "default": {
        "variantId": "feat-material-cardboard-paper"
      },
      "variants": [
        {
          "id": "feat-material-cardboard-paper",
          "name": "Cardboard & paper",
          "description": "For example boxes, flattened packaging, office paper. EWC 15 01 01, 20 01 01.",
          "longDescription": "## Cardboard & paper\nFor example boxes, flattened packaging, office paper.\n\n- EWC codes: 15 01 01, 20 01 01\n- Low contamination: Clean, dry boxes and paper; under 5% other material.\n- Medium contamination: Some tape, labels, film or damp patches; 5-15% other material.\n- High contamination: Wet, food-soiled or mixed with general waste; over 15% other material.",
          "status": "available",
          "default": true
        },
        {
          "id": "feat-material-clean-wood",
          "name": "Clean wood",
          "description": "For example pallets, untreated offcuts, crates. EWC 15 01 03, 17 02 01, 03 01 05.",
          "longDescription": "## Clean wood\nFor example pallets, untreated offcuts, crates.\n\n- EWC codes: 15 01 03, 17 02 01, 03 01 05\n- Low contamination: Untreated, unpainted solid wood and pallets; intact pieces.\n- Medium contamination: Nails, screws, some chipboard or broken pallets; little else.\n- High contamination: Painted, treated, laminated or mixed with other waste.",
          "status": "available"
        },
        {
          "id": "feat-material-mixed-cd",
          "name": "Mixed construction waste",
          "description": "For example rubble, timber, plasterboard, packaging from a site. EWC 17 09 04.",
          "longDescription": "## Mixed construction waste\nFor example rubble, timber, plasterboard, packaging from a site.\n\n- EWC codes: 17 09 04\n- Low contamination: Mostly inert (concrete, brick, tile) with some timber and metal.\n- Medium contamination: Inert plus plasterboard, plastics, insulation and packaging.\n- High contamination: Large share of general waste, insulation or suspect items needing checks.",
          "status": "available"
        }
      ]
    },
    {
      "id": "mod-route",
      "name": "Treatment route",
      "moduleType": "bom",
      "question": "Where should the waste go?",
      "description": "Reuse, recycling, recovery or landfill: the EU waste hierarchy, circular first.",
      "longDescription": "## Treatment route\nOnly routes allowed for the stream and its contamination are open. The rules come from the WasteQuote eligibility table, generated into this model.",
      "order": 8,
      "default": {
        "variantId": "mod-route-cardboard-paper-recycling"
      },
      "variants": [
        {
          "id": "mod-route-cardboard-paper-recycling",
          "name": "Cardboard & paper: recycling (baled to paper mill)",
          "description": "Recycling. Baled to paper mill, operation R3.",
          "longDescription": "## Recycling: Baled to paper mill\nThe material is reprocessed into new material: paper mill, steelworks, film regranulate, panel board, anaerobic digestion.\n\n- Waste hierarchy: Recycling (circular)\n- Operation code: R3\n- Allowed at contamination: low, medium\n- Gate fee: €0/t (indicative)\n- Material rebate: €71/t at clean grade\n\nPriced per tonne in WasteQuote from the estimated weight, so the list price here is 0.",
          "status": "available",
          "default": true
        },
        {
          "id": "mod-route-cardboard-paper-recovery",
          "name": "Cardboard & paper: recovery (energy from waste)",
          "description": "Other recovery, e.g. energy recovery. Energy from waste, operation R1.",
          "longDescription": "## Recovery: Energy from waste\nThe material is burned for energy (energy from waste, biomass, refuse-derived fuel). The material itself is lost.\n\n- Waste hierarchy: Other recovery, e.g. energy recovery\n- Operation code: R1\n- Allowed at contamination: medium, high\n- Gate fee: €152.7/t (indicative)\n- Incineration tax, R1 energy recovery (Catalonia): €15/t\n\nPriced per tonne in WasteQuote from the estimated weight, so the list price here is 0.",
          "status": "available"
        },
        {
          "id": "mod-route-cardboard-paper-landfill",
          "name": "Cardboard & paper: landfill (non-hazardous landfill)",
          "description": "Disposal. Non-hazardous landfill, operation D1.",
          "longDescription": "## Landfill: Non-hazardous landfill\nDeposit in a non-hazardous landfill. Lowest in the hierarchy and taxed.\n\n- Waste hierarchy: Disposal\n- Operation code: D1\n- Allowed at contamination: medium, high\n- Gate fee: €40.3/t (indicative)\n- Landfill tax (Catalonia 2026): €25/t\n\nPriced per tonne in WasteQuote from the estimated weight, so the list price here is 0.",
          "status": "available"
        }
      ]
    },
    {
      "id": "feat-contamination",
      "name": "Contamination",
      "moduleType": "feature",
      "question": "How clean is the stream?",
      "description": "How much other material is mixed in. Decides which routes are open.",
      "longDescription": "## Contamination\nGraded low, medium or high against the material's own definitions.",
      "order": 6,
      "default": {
        "variantId": "feat-contamination-low"
      },
      "variants": [
        {
          "id": "feat-contamination-low",
          "name": "Low",
          "description": "Clean and separated. Fits the material's best route.",
          "longDescription": "## Low contamination\nClean and separated. Fits the material's best route. Each material defines the level in its own terms.",
          "status": "available",
          "default": true
        },
        {
          "id": "feat-contamination-medium",
          "name": "Medium",
          "description": "Some other material mixed in. Recycling may carry a surcharge.",
          "longDescription": "## Medium contamination\nSome other material mixed in. Recycling may carry a surcharge. Each material defines the level in its own terms.",
          "status": "available"
        },
        {
          "id": "feat-contamination-high",
          "name": "High",
          "description": "Heavily mixed, wet or soiled. Some routes are closed.",
          "longDescription": "## High contamination\nHeavily mixed, wet or soiled. Some routes are closed. Each material defines the level in its own terms.",
          "status": "available"
        }
      ]
    },
    {
      "id": "mod-container",
      "name": "Container",
      "moduleType": "bom",
      "question": "Which container?",
      "description": "Rented per month. Only containers offered for the stream are open.",
      "longDescription": "## Container\nRent per month is the list price here. Lift fees and transport are priced per lift in WasteQuote.",
      "order": 10,
      "default": {
        "variantId": "mod-container-bin-240"
      },
      "variants": [
        {
          "id": "mod-container-bin-240",
          "name": "240 L wheelie bin",
          "description": "0.24 m³, rented per month. Lift fee €5 per emptying.",
          "longDescription": "## 240 L wheelie bin\n- Size: 0.24 m³\n- Max payload: 0.1 t per lift\n- Rent: €3 per month (indicative)\n- Lift fee: €5 per emptying (indicative)\n- Suits: cardboard & paper, plastic film, organic / food waste",
          "status": "available",
          "default": true
        },
        {
          "id": "mod-container-bin-1100",
          "name": "1,100 L wheelie bin",
          "description": "1.1 m³, rented per month. Lift fee €14 per emptying.",
          "longDescription": "## 1,100 L wheelie bin\n- Size: 1.1 m³\n- Max payload: 0.44 t per lift\n- Rent: €9 per month (indicative)\n- Lift fee: €14 per emptying (indicative)\n- Suits: cardboard & paper, plastic film, organic / food waste, clean wood",
          "status": "available"
        },
        {
          "id": "mod-container-skip-6",
          "name": "6 m³ open skip",
          "description": "6 m³, rented per month. Lift fee €95 per emptying.",
          "longDescription": "## 6 m³ open skip\n- Size: 6 m³\n- Max payload: 8 t per lift\n- Rent: €45 per month (indicative)\n- Lift fee: €95 per emptying (indicative)\n- Suits: clean wood, mixed construction waste, scrap metal",
          "status": "available"
        }
      ]
    }
  ],
  "bom": [
    {
      "moduleId": "mod-route",
      "moduleName": "Treatment route",
      "variantId": "mod-route-cardboard-paper-recycling",
      "variantName": "Cardboard & paper: recycling (baled to paper mill)",
      "filled": true
    },
    {
      "moduleId": "mod-container",
      "moduleName": "Container",
      "variantId": "mod-container-bin-240",
      "variantName": "240 L wheelie bin",
      "filled": true
    }
  ],
  "price": {
    "total": 3,
    "currency": "EUR"
  },
  "…": "abridged for this page: 1 more modules, 24 more variants. The API returns all of them."
}
```

`modules` is what the customer decides. `bom` is what they end up with. Render
any, all, or none of them. That is your design decision, not ours.

`price` is one number, `{ "total": 4820.00, "currency": "SEK" }`, what the
finished configuration costs, present only when your key has the price scope.
Read the pricing topic when you display it; until then it needs nothing from
you.

`language` is the code the document is written in, and `languages` is what
your tenant offers, the default first. Every other word your interface shows
comes from `GET /content/{language}` in the same language, so your frontend
holds no strings of its own. The languages topic has the rest.

`catalog.newer` is true when your tenant has edited the catalog since this
configuration was started on it. The configuration stays on its catalog until
you upgrade it: see `changes`. `history` counts the steps undo and redo can
take: see `history`.

---

## Modules

Your catalog uses these module types. Each one is a different thing to draw.

| `moduleType` | what it is | how to draw it |
|---|---|---|
| `feature` | a choice between variants | cards, a list, a dropdown, whatever fits |
| `bom` | a choice that also lands in the bill of materials | same as `feature` |

Nesting comes from `parent` plus `order`. There is one hierarchy, not two, and
the server has already ordered it. Render it as given, or ignore the ordering
entirely and lay the modules out however you like. Nothing breaks either way.

---

## Variants

| `status` | meaning | typical treatment |
|---|---|---|
| `selected` | the current choice | highlighted |
| `available` | selectable right now | normal |
| `blocked` | not possible with the current selections | red, with `reason` shown |

`blocked` is always reversible. Change what caused it and the variant returns.

`reason` names the cause. It comes from two places and reads differently
depending on which: the constraint engine writes terse phrases in the catalog's
own words, like "Selection Frame: Frame XL excludes this", while a dropped
selection gets a finished sentence. Both are safe to show. If your tone is more
polished than the catalog's, treat it as a quotable fragment and compose your
own sentence around it.

Variants that are impossible in this catalog under any combination are never
sent at all, so anything you receive is worth drawing.

---

## Selections

```jsonc
"selection": { "variantId": "xl", "source": "user" }
```

**Every module that has been decided carries `selection`, including numeric
ones.** A numeric module also carries `value` as a real number, because that is
what a slider wants, but `selection` is the same fact in the shape every other
module uses. That is what lets the loop above collect the complete set with one
filter instead of a special case.

Writing a number uses that same shape. A numeric module's `variantId` **is** its
value, and a real number is accepted as well as a string:

```jsonc
{ "selections": [ { "moduleId": "span", "variantId": 1600 } ] }
```

| `source` | what it means |
|---|---|
| `user` | the customer chose it, or you sent it in a `PUT` |
| `agent` | the assistant chose it during a chat turn |
| `auto` | the rules left one possibility and the engine took it, `reason` says which rule |
| `configurator-default` | the module was left open and a finalize committed the engine's default, priced like any other line |

An `auto` selection carries a `reason` and is worth surfacing. Customers find a
choice appearing on its own alarming unless it is explained. Its variant is
`selected` with `auto: true`, it counts like any other selection, and it goes
away by itself when the picks that forced it change unless the customer clicks
it, which makes it their own.

---

## What is deliberately not in the document

So you do not go looking:

- **The rules.** Dependencies, conditions and formulas stay on the server. You
  receive their outcome, per variant, with a reason.
- **Per-variant prices.** Price is a computed total. Nothing derives it client side.
- **Hidden modules** and **impossible variants.** Filtered before they reach you.
- **Anything your key is not scoped for.** Absent, not empty.

**Optional always means absent, never `null`.** If a field does not apply, its
key is not there. Test with `'field' in module`, not for a null value.

`status` is `draft` until the configuration is quoted, then `finalized`.

---

## Set in sailsrep, not here

The API renders a catalog. It does not author one. Everything below is your
team's to change in the sailsrep portal, and the next document reflects it.

| what | where |
|---|---|
| module and variant names, questions, descriptions, images, grouping, order, and what wakes a dormant module | [Product](https://prag.sailsrep.ai/config?customer=wastequote-waste-collection-service-2610132242) |
| the configuration logic: what excludes what, what a choice forces, what a formula computes, what is mandatory | [Product](https://prag.sailsrep.ai/config?customer=wastequote-waste-collection-service-2610132242) |
| product data and published specs | [PIM](https://prag.sailsrep.ai/pim?customer=wastequote-waste-collection-service-2610132242) |
| prices and pricing rules | [Price](https://prag.sailsrep.ai/price?customer=wastequote-waste-collection-service-2610132242) |
| how the assistant behaves, what it asks, what it is allowed to decide | [Personality](https://prag.sailsrep.ai/personality?customer=wastequote-waste-collection-service-2610132242) |
| currency and branding | [Settings](https://prag.sailsrep.ai/general-settings?customer=wastequote-waste-collection-service-2610132242) |
| your key's scopes and allowed domains | [API keys](https://prag.sailsrep.ai/api-keys?tab=configurator&customer=wastequote-waste-collection-service-2610132242) |

Each link opens that page on this catalog for whoever is signed in. After a
change there, fetch this page again: it is generated from the catalog as it is
now.

**Fix it there, not around it.** If the document offers something the customer
should not have, or withholds something they should, that is a catalog edit.
Filtering a variant out, hardcoding an exception or reproducing a rule in your
own code puts a second set of rules in the world, and the two disagree the first
time someone edits the catalog. Your frontend then contradicts the quote, the
assistant and the proposal, all of which read the engine.

---

## Reference topics

Fetch these when the situation calls for it. Each is complete on its own.

```
GET /docs/{topic}
```

| topic | read it when |
|---|---|
| `how-it-works` | Read this before you design anything. |
| `rendering` | Read this when building the UI that draws modules and variants. |
| `3d` | Read this when you want a 3D model. Not usually needed. |
| `solving` | Read this when statuses or number ranges arrive late, or the UI flickers. |
| `chat` | Read this when adding the assistant, or handling the questions it asks. |
| `quotes` | Read this when building a review screen, a finish button, or checkout. |
| `errors` | Read this before shipping, and whenever you get a 4xx. |
| `changes` | Read this when the catalog can change while a frontend is running. |
| `history` | Read this when building undo and redo buttons, or a record of what changed. |
| `languages` | Your tenant runs in one language, so this page is short: where the words come from, and that there is nothing to switch. |
| `pricing` | Read this when you display a price. |
| `media` | Read this when the customer sends a photo, a PDF or a recording, or the assistant cites or shows a document. |

---

## Your catalog at a glance

*Informational. Do not write code against this, see rule 1.*

| what | count |
|---|---|
| modules | 5 |
| `feature` modules | 2 |
| `bom` modules | 3 |
| variants | 40 |

---

## Available, not switched on

These exist and are not active for your tenant. Turn them on in the sailsrep
portal and the relevant fields, events and reference topics appear here.

| feature | what it adds | switch it on in |
|---|---|---|
| Approvals | the `selections.proposed` event, the `/proposals` call, and the `approvals` topic | sailsrep portal, Chat Customization |
| Follow up chips | `suggestions` on `message.complete` | sailsrep portal, Chat Customization |
| Support chat | the documentation assistant on `/chat`, and the `support` topic | sailsrep portal, Settings, Technical chat, then the support scope on the key under Settings, API |
