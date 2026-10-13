# Rendering

*Read this when building the UI that draws modules and variants.*

---

## The seven module types

Not every catalog uses all of them. The index page lists the ones yours has.

| `moduleType` | what it is | how to draw it |
|---|---|---|
| `feature` | a choice between variants | cards, a list, a dropdown, whatever fits |
| `bom` | a choice that also lands in the bill of materials | same as `feature` |
| `scenario` | a choice between whole scenarios | same as `feature`, often larger cards |
| `classification` | a categorising choice | same as `feature`, often a dropdown |
| `input` | a number the customer enters | a slider or a number field, honour `min` and `max` |
| `function` | a number derived from other choices | display only, never editable |
| `group` | a container for other modules | a section heading, a tab, a step |

The four choice types (`feature`, `bom`, `scenario`, `classification`) all carry
`variants` and behave identically. If you write one renderer for "has variants"
and one each for `input`, `function` and `group`, you have covered everything,
today and after the catalog changes.

```js
function renderModule(m) {
  if (m.moduleType === 'input')    return <NumberModule module={m} />;
  if (m.moduleType === 'function') return <DerivedValue module={m} />;
  if (m.moduleType === 'group')    return <Section module={m} />;
  if (m.variantCount !== undefined) return <SearchableChoice module={m} />;
  if (m.variants)                  return <ChoiceModule module={m} />;
  return null;                       // rule 3: ignore what you do not recognise
}
```

Order matters there. A module with thousands of options carries `variantCount`
and **no `variants` array**, because sending them all would be a payload nobody
can render. Check `variantCount` before `variants`, or such a module falls
through and draws nothing.

Fetch those on demand:

```
GET /configurations/{id}/modules/{moduleId}/variants?q=frame&limit=50&cursor=50
```

| parameter | |
|---|---|
| `q` | filters by name, case insensitive. Omit it to page the whole list |
| `limit` | 1 to 200, default 50 |
| `cursor` | pass back the `next` you were given. Omit for the first page |

```jsonc
{ "moduleId": "hook-block",
  "variants": [ { "id": "hb-12", "name": "HB 12", "status": "available" } ],
  "total": 412,
  "next": "50" }
```

`next` is absent on the last page, which is how you know to stop. `total` counts
what is actually offerable, so it is a number the customer can reach. Variants
are labelled exactly as they are in the document, and impossible ones are
omitted here too.

---

## Choice modules

```jsonc
{
  "id": "frame", "name": "Frame", "question": "Which frame?",
  "moduleType": "feature", "parent": "structure", "order": 1,
  "selection": { "variantId": "xl", "source": "user" },
  "variants": [
    { "id": "l",  "name": "Frame L",  "status": "available",
      "image": "https://…/frame-l.jpg", "description": "Standard duty" },
    { "id": "xl", "name": "Frame XL", "status": "selected",
      "image": "https://…/frame-xl.jpg" }
  ]
}
```

`name` is the label, `question` is the prompt to show the customer if you want
one. `selection` is absent when nothing is chosen yet. A selection the catalog
no longer allows carries `blocked: true` and a `reason`: see `changes`.

Variants carry `name`, `description`, `longDescription`, `image` and
`smallImage`. All of them are optional, so write your card to survive any of them
being missing. A catalog that has no images today may have them next month.

---

## Number modules

```jsonc
{ "id": "span", "name": "Span", "moduleType": "input",
  "inputType": "number", "unit": "mm",
  "min": 800, "max": 2400, "value": 1600, "source": "user" }
```

`min` and `max` are the range that is feasible **right now**, given everything
else the customer has chosen. They narrow as the configuration takes shape. Do
not cache them, and do not fall back to a range you saw earlier. See `solving`
for why they sometimes arrive a moment after the rest.

`unit` is present when the catalog author defined one. Render `1600 mm`. When it
is absent, render the bare number.

Let the control move locally and write when the customer stops. Every write is a
solve, and the values a slider passes through on the way are not ones anybody
asked to price.

---

## Derived values

```jsonc
{ "id": "load", "name": "Total load", "moduleType": "function",
  "value": 41.2, "unit": "kN" }
```

The customer never sets these. They are computed from the other choices, and they
change when those change. They are usually worth showing, because they are the
numbers the customer actually cares about.

---

## Defaults

Every module the customer has not picked tells you what it would get if they
stopped there.

```jsonc
{ "id": "voltage", "name": "Voltage", "moduleType": "feature",
  "default": { "variantId": "400v" },
  "variants": [
    { "id": "230v", "name": "230 V", "status": "available" },
    { "id": "400v", "name": "400 V", "status": "available", "default": true }
  ] }
```

It moves as the customer chooses, and it is the same configuration
`price.total` is the price of. A module with a selection has no default. An
input module's default is its value, spelled both ways like its selection:
`"default": { "variantId": "1600", "value": 1600 }`.

A default is not a choice the customer made. Sending one back in `selections`
makes it one, so draw it differently from a selection and let a click make it
real.

A pick the rules made arrives as a selection with `source: "auto"`, its variant
`selected` with `auto: true`. It is still a card the customer can click, which
makes it their own; left alone, it goes away when the picks that forced it
change.

---

## Statuses

| `status` | meaning | reversible |
|---|---|---|
| `selected` | the current choice | n/a |
| `available` | selectable right now | n/a |
| `blocked` | impossible given the current selections | yes, always |

`blocked` variants carry a `reason`. Show it, or compose your own copy around
it: see the index page on its two registers. A greyed out option with no
explanation is the most common complaint about configurators, and you have the
cause right there.

A blocked variant is not selectable, and the statuses are there so you can say
so before anything is sent: a write that conflicts is refused. If you want to
let the customer override, make it clear that it is an override, show them what
it would cost from the refusal, and only then send the same set with `force`.
See the index page.

Variants that could never be selected in any configuration are removed before the
document reaches you. Everything you receive is worth drawing.

---

---

## The bill of materials

`bom` is a flat top-level array, separate from `modules`, listing what the
customer actually ends up with.

```jsonc
"bom": [
  { "moduleId": "frame", "moduleName": "Frame",
    "variantId": "xl", "variantName": "Frame XL",
    "image": "https://…/frame-xl.jpg" },
  { "moduleId": "fixings", "moduleName": "Fixings",
    "variantId": "bolts", "variantName": "Bolt set", "filled": true }
]
```

`modules` is what the customer decides. `bom` is what they end up with, and the
two are not the same list. A line is here because the catalog marks its variant
as a part, which is not the same as being on the grid: a part can sit in a
module the customer never configures and is still on the bill, and a choice that
changes nothing physical, a finish or a service level, can be on the grid and
not here.

`filled` marks a line the engine chose rather than the customer. `bom` is the
bill for the configuration `price.total` is the total of, so the two always
describe one product, and a line can belong to a module the grid still shows
as `active: false`.

Names are resolved for you, so a printable spec sheet needs no lookup back into
`modules`. There are no line prices: price is a computed total, not a sum you
assemble. See `quotes` for building a review screen from this.

---

## Groups and ordering

`parent` names the containing module, `order` is the position within it. Modules
with no `parent` are top level. The server has already sorted them.

You are free to ignore this entirely and lay everything out your own way. Nothing
in the engine depends on presentation order. See `how-it-works`.

---

---

## Rules that keep this working

**Never branch on a module id or a variant id.** Branch on `moduleType`, on
whether `variants` is present, on `status`. A catalog is edited by the tenant, not
by you, and every hardcoded id is a future outage.

**Never assume a module exists.** No count, no ordering, no "the third step is
always colour".

**Never assume a field is present.** `image`, `description`, `unit`, `question`,
`attributes` and `selection` are all optional.

**Render unknown values as nothing, not as an error.** A new `moduleType` or a new
`status` should degrade quietly.

The one reasonable exception: a deliberate design flourish for a specific module,
for example rendering your flagship model picker as a full width hero. Keep it to
a single explicit branch with a sane default for everything else, so the day that
module is renamed you lose a flourish, not a page.

---

## Common mistakes

| mistake | what happens |
|---|---|
| Hardcoding a module id | the page breaks silently when the tenant renames it |
| Computing availability client side | your answer disagrees with the engine, and the engine is right |
| Caching the document across sessions | the customer sees a catalog that no longer exists |
| Rendering only the modules you know about | new modules never appear, and the customer cannot finish |
| Treating `blocked` as permanent | the customer is told no when the answer is "change something else" |
| Ignoring `dropped` | selections vanish with no explanation |

---

## Tips

- **A steady grid.** Give every card the same footprint with or without a
  `reason` (reserve the line, or show it on hover), so the grid never jumps
  when a pick blocks something.
