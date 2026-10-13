# Pricing

*Read this when you display a price.*

---

## What the number is

```jsonc
"price": { "total": 4820.00, "currency": "SEK" }
```

`total` is what the whole configuration costs once the engine fills in
everything the customer has not chosen yet, and it is the number a quote made
at this moment carries.

---

## What is in it

**Picks the rules forced are in it.** When a customer's choices leave one
possibility, the engine takes it and marks it `source: "auto"`, with the rule
that forced it in `reason`. Those are determined rather than guessed, so they
count as chosen.

**It is priced at your default price list**, which is not selectable. There is
no parameter for it.

**It carries no tax**, and no discount is applied. A discount, if there is one,
happens later on the quote and never touches this figure.

**There is no price per variant.** A variant's line price depends on the rest
of the configuration, since quantities and factors are formulas over other
choices, so a number next to a variant would be wrong the moment the customer
picked something else.

**It moves on choices that are not prices.** A wider frame changes a weight,
the weight changes a formula, the formula changes a line. The total moves on
picks that look unrelated to money.

**It never waits for the rest of the picture.** A price needs an assignment,
never statuses or ranges, so it is settled on every document you receive,
including one that carries `pending`.

---

## When it is not every choice

`total` is always for a configuration that can be built. If a customer's stored
choices have stopped fitting together, or one of them names a product the
catalog no longer offers, the engine sets aside as few as it can and prices
what is left. Both happen when the catalog changes under a configuration saved
earlier. Re-reading a configuration is what surfaces it: the document you get
back is what the configuration is now.

Write-time conflicts are separate and you already see those, in `dropped` on
the response that caused them.

---

## When there is no price

`price` is absent, not zero, when your key has no price scope, or when the
document arrived over the chat stream. Read the configuration once the turn
ends and the total is there.

An empty configuration still has a price, because the engine completes it before
pricing it. The `default` on each unpicked module is that completion, so the
configuration the figure is for is already in front of you.

Major units of `currency`, so `4820.00` is four thousand eight hundred and
twenty. Formatting is yours.

---

## Recommendations

Not contract. One running total, in one place, showing `total`, replaced
whenever a new document arrives.
