# How it works

*Read this before you design anything.*

This topic is not instructions. It describes how the system actually behaves, so
you can decide what to build rather than copy what someone else built.

---

## Two channels, one document

```
       you drive                            the customer drives
  +--------------------+              +--------------------------+
  |   configuration    |              |          chat            |
  |  PUT selections    |              |   SSE, the assistant acts |
  +---------+----------+              +------------+-------------+
            |                                      |
            +------------->  one document  <-------+
```

A configuration is a single server-side document. Two things can change it: your
`PUT`, and the assistant during a chat turn. Both produce a complete new
document, and you re-render from whatever you last received.

**Either channel is optional.** That is not three features we built. It falls out
of there being exactly one piece of state:

- **Configuration only.** A classic configurator with no AI anywhere. Never call
  `/chat` and the assistant does not exist as far as your frontend is concerned.
- **Chat only.** A conversational product finder with no visible controls. The
  customer talks, the assistant selects, you render the resulting document however
  you like, or not at all until the end.
- **Both.** Chat on one side, controls on the other. The customer can talk or
  click, and the two never disagree, because there is nothing to reconcile.

There is no merge step, and no client-side state to keep in sync. That is the
whole reason this composes.

One caveat: while a chat turn is in flight, the assistant may be about to change
the document. Sending a `PUT` built from a document you received before the turn
started will overwrite what the assistant just did. Disable your controls during
a turn, or wait for the turn to finish. See `solving` for the flags that tell you
when the picture is settled.

---

## There are no steps, and no required order

The engine has no notion of a wizard, a page, or a required sequence. Every
decision is available at any time. Modules carry `parent` and `order` because the
catalog author grouped them that way, and it is usually a sensible order to
present, but it is a suggestion, not a constraint.

You may ask for decisions in any order, on one page or twenty, and skip forward
and backward freely. The only thing that constrains the customer is the product
rules, and those reach you as variant statuses, never as an ordering requirement.

---

## What the document lets you build

Everything below is already in the response. None of it requires another call.

| what you receive | what it lets you build |
|---|---|
| modules with `parent` and `order` | steps, tabs, an accordion, one long page, one decision at a time |
| `moduleType` | choice cards, sliders, read-only readouts, section headings |
| variant images | galleries, swatches, comparison rows, a hero image per choice |
| `status` and `reason` | greying out, tooltips, a "why not?" popover, an explain panel |
| attributes | spec tables, filters, side by side comparison of two variants |
| `bom` | a summary panel, a spec sheet, something printable |
| `price` | a running total, a price that animates as choices change |
| `dropped` | "we changed your voltage because you chose Frame XL", after an override |
| `pending` | a shimmer, a disabled state, or nothing at all |
| chat events | bubbles, inline question cards, an approval sheet, a hand off to quote |

Some shapes people build with exactly this, as illustrations rather than
templates: a one decision at a time wizard, a dense single page grid, tabs by
group, chat with a live summary panel beside it, chat only with a quote at the
end, a catalog browse that hands off into configuration, and an assistant
embedded on an existing product page that drives a configurator the customer
never sees.

---

## What you cannot do

Stating the boundary saves you an afternoon.

- **You cannot compute availability.** The dependency and condition rules are not
  in the document and will not be. Send selections, read statuses.
- **You cannot price a variant client side.** Price arrives as a computed total.
  There is no per variant price to add up.
- **You cannot cache a document across catalog versions.** The tenant can change
  their catalog at any time. See `changes`.
- **You cannot trust an id you did not receive from us.** Configuration ids are
  server minted and scoped to your tenant: any of your keys can read them, no
  other tenant's can.

---

## Where the pieces live

| you want | you call |
|---|---|
| a new configuration | `POST /configurations` |
| to apply the customer's choices | `PUT /configurations/{id}` |
| to read it again later | `GET /configurations/{id}` |
| the assistant | `POST /configurations/{id}/chat` |
| options for a module with thousands of variants | `GET /configurations/{id}/modules/{moduleId}/variants` |
| a real quote, emailed to the customer | `POST /configurations/{id}/quote` |

Four of those return the identical document. Learn one shape and you know the
API.
