# Quotes

*Read this when building a review screen, a finish button, or checkout.*

---

## There is no preview endpoint, and you do not need one

Everything a review screen needs is already in the document you are holding:

- `modules` with their `selection`, for "here is what you chose"
- `bom`, for "here is what you get"
- `price`, for the total

So the summary page, the edit before you finish flow, the printable spec sheet
and the confirm button are all yours to build, entirely client side, with no
further calls. Design it however you like. We deliberately do not prescribe a
checkout.

---

## Getting a real quote

```
POST /configurations/{id}/quote
{ "email": "buyer@example.com" }
```

**Email is required.** A sailsrep quote is a document that gets delivered to a
person, so there is always a recipient. If you want a summary with no email
address involved, that is the review screen above, and it costs you nothing.
A configuration with no selections at all is refused with `invalid_request`:
pick at least one thing, even if it is the default.

**Response**

```jsonc
{ "quoteId": 41,
  "proposalUrl": "https://…",
  "configuration": { "…": "the document, now finalized" } }
```

What happens as a result:

- The quote is generated and stored.
- It is emailed to the address you supplied, from the tenant's branding.
- It appears in the tenant's own sailsrep portal, so their sales team sees it.
- `proposalUrl` is a hosted page the customer can open, share or come back to.

You may show `proposalUrl` in your own interface, link to it, or ignore it and
rely on the email.

---

## After a quote

`status` becomes `finalized`, which tells you a quote exists. It does **not**
lock anything: the customer can keep configuring, and quoting again produces a
new quote.

That is safe because the quote itself is the snapshot. It stores its own
content, its own bill of materials and its own price at the moment it was sent,
and the proposal page renders from those. Nothing the customer does afterwards
can change what landed in their inbox.

You may keep editing the same configuration, which is usually what a customer
who changed their mind expects. If you would rather each quote have its own
clean record, start a fresh configuration from the previous selection set:

```jsonc
POST /configurations
{ "selections": [ { "moduleId": "frame", "variantId": "xl" } ] }
```

One call, and it is a deliberate design rather than a limitation: a quote is a
record of what was agreed, so it does not move underneath itself.

---

## Before you call it

The engine fills in anything the customer left unset, choosing values that keep
the configuration valid. This means a quote can include modules the customer
never touched. That is normal and correct; the filled values show in `bom`
and as `default` on the modules, not as selections.

If you want the customer to see and confirm those first, read the `bom` on the
document before quoting. It already reflects what would be included.

---

## Two things to check on your side

**Validate the email before sending it.** A bad address comes back as
`email_required` or a delivery failure, and neither is a good moment to discover
a typo.

**Show the customer that something was sent.** The quote arrives by email, which
means it lands somewhere your interface cannot see. A confirmation screen naming
the address you sent it to prevents most of the support questions that follow.
