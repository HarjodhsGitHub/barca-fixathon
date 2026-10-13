# Errors

*Read this before shipping, and whenever you get a 4xx.*

---

## One shape, everywhere

The same object comes back from every endpoint, and rides inside the `error`
event on the chat stream.

```jsonc
{ "error": {
    "code": "value_out_of_range",
    "kind": "user",
    "message": "Span must be between 800 and 2400. Received 3000.",
    "details": { "moduleId": "span", "min": 800, "max": 2400, "value": 3000 },
    "docs": "https://…/docs/errors#value_out_of_range"
} }
```

| field | use it for |
|---|---|
| `code` | branching. A stable string, never a number, never reworded |
| `kind` | deciding what to do, see below |
| `message` | showing a person, when `kind` is `user` |
| `details` | highlighting the offending module without parsing prose |
| `docs` | the section of this page that explains the fix |

---

## `kind` tells you what to do

This is the field most worth wiring up, because it removes the two most common
mistakes: showing an internal error to a customer, and quietly swallowing a real
one.

| `kind` | meaning | do |
|---|---|---|
| `user` | the customer did something not allowed | show `message` to them |
| `integration` | the request is wrong | log it and fix your code. Never show a customer |
| `transient` | temporarily unavailable | retry with backoff, then show a generic failure |

`transient` errors also carry `retriable: true` and, where we know it,
`retryAfter` in seconds.

```js
if (err.kind === 'user')        showToCustomer(err.message);
else if (err.kind === 'transient') retryAfter(err.retryAfter ?? 2);
else                            reportToYourLogging(err);
```

---

## HTTP status carries the class only

| status | class |
|---|---|
| 400 | integration, malformed request |
| 401 / 403 | authentication or scope |
| 404 | not found, or not yours |
| 409 | state conflict |
| 422 | the customer's input was not acceptable |
| 423 | a step outside sailsrep has not answered yet |
| 429 | rate limited |
| 5xx | transient |

Branch on `code`, not on status. Status is for your monitoring.

---

## Every code

### Authentication

#### `invalid_key`

`401` · `integration`
The key is unknown, revoked, or malformed.
*Fix:* check the `Authorization` header reached us intact. Create a new key in
the portal if it was revoked.

#### `origin_not_allowed`

`403` · `integration`
The request came from a domain not on the key's allowed list.
*Fix:* add the domain in the portal, under the key's settings. Include every
environment, not just production.

#### `scope_required`

`403` · `integration`
The key is not scoped for this, for example asking for price on a key without it.
*Fix:* enable the scope on the key in the portal.

### Not found

#### `configuration_not_found`

`404` · `integration`
No configuration with that id, or it belongs to a different tenant. Both cases
return 404 deliberately, so ids cannot be probed.
*Fix:* use an id returned by `POST /configurations`. Do not construct ids.

#### `module_not_found` / `variant_not_found`

`404` · `integration`
The id is not in this catalog. Usually a hardcoded id after the catalog changed.
*Avoid:* never write catalog ids into your code. See `rendering`.

#### `topic_not_found`

`404` · `integration`
No documentation topic by that name, or your tenant is not entitled to it.
*Fix:* the index page lists the topics you have. Topics appear and disappear
with your settings, so read the list rather than assuming.

#### `project_not_found`

`404` · `integration`
A name in `projects` is not a project this tenant's configurations may compose with.
*Fix:* use a `name` or `displayName` from `GET /projects`, which lists exactly the projects `projects` accepts.

#### `item_not_found`

`404` · `integration`
No item with that id in your PIM, on the layer your key reads.
*Fix:* use an `id` from `GET /pim/items`, or from a reference field. See `pim`.

#### `document_not_found`

`404` · `integration`
No document with that id in this tenant's library.
*Fix:* use ids from `sources` or `show`. See `media`.

### The request

#### `invalid_request`

`400` · `integration`
Malformed body, wrong types, missing required field. `details` names the field.

#### `value_out_of_range`

`422` · `user`
A number outside the currently feasible range. `details` carries `min`, `max` and
`value`.
*Avoid:* clamp inputs to the module's `min` and `max` from the latest document,
and do not use bounds carried over while `pending.ranges` is true. See `solving`.

#### `selections_conflict`

`422` · `user`
The set does not fit together, and nothing was stored. `details.dropped` lists
the picks that would have to go, with names and a reason each, in the same
shape a forced write reports under `dropped`.
*Fix:* if the customer chose to override, send the same set again with
`"force": true`. The listed picks are dropped and the write goes through.
*Avoid:* only offer variants whose `status` is `available`. A catalog that has
changed under a saved configuration can produce this without a click; see
`changes`.

### State

#### `catalog_changed`

`409` · `user`
An upgrade found that the projects this configuration combines no longer fit
together. Nothing was changed.
*Fix:* create a fresh configuration. Tell the customer the product range was
updated. See `changes`.

#### `catalog_empty`

`409` · `integration`
The key is valid, and the tenant it belongs to has no published catalog. There
is nothing to configure yet.
*Fix:* not a code change. Publish a catalog for this tenant in the sailsrep
portal. Retrying will not help, so do not put this behind a retry.

#### `session_held`

`423` · `transient`
A pre-configuration step of this project has not answered, so the configuration
session did not open and nothing was created. Which step it was is deliberately
not in the answer: the step is the project's own business and this API is the
customer's. The portal's Workflows page names it, under Call log.
*Fix:* not a code change on your side. Retry with backoff. If it persists, the
project's own system is down or the hook needs releasing in the sailsrep portal,
under Workflows.

#### `language_fixed`

`409` · `integration`
A `PUT` asked to switch the language of a configuration that combines several
projects. It keeps the language it was created in, and nothing was changed.
`details` carries `language`, the one it is in, and `requested`.
*Fix:* create a new configuration with the `language` you want.
*Avoid:* offer no language picker on a configuration whose modules carry
`origin`. See `languages`.

#### `nothing_to_undo` / `nothing_to_redo`

`409` · `user`
There is no change left to undo, or nothing undone to redo. Nothing was
changed.
*Fix:* show the message.
*Avoid:* disable the button while `history.undo` or `history.redo` is `0`. See
`history`.

#### `support_not_enabled`

`409` · `integration`
The key has the support scope and the tenant has switched the support chat off.
*Fix:* switch it on in the sailsrep portal under Settings, Technical chat, or
mint a key without the scope. See `support`.

### Quotes

#### `email_required`

`422` · `user`
No email address, or one we cannot deliver to.
*Fix:* validate on your side before calling.

#### `quote_failed`

`500` · `transient`
The quote pipeline did not complete. The configuration is unaffected.
*Fix:* retry once. If it persists, the tenant's quote configuration needs
attention in the portal.

### Limits and infrastructure

#### `rate_limited`

`429` · `transient`
Too many requests. Honour the `Retry-After` header rather than retrying
immediately.

A 429 is produced by the limiter ahead of this API, and carries the same JSON
error shape as everything else.

Limits currently apply per client address rather than per key, so a browser
integration shares its budget with everyone behind the same address. Back off on
429 and do not treat it as an error worth showing a customer.

#### `solver_unavailable`

`503` · `transient`
The constraint engine did not answer in time. Usually brief.
*Fix:* retry with backoff. The configuration is unchanged.

#### `internal_error`

`500` · `transient`
Something went wrong on our side. Retry once, then report it with the `id` from
the response if one is present.

---

## Errors you should never see in production

`invalid_key`, `origin_not_allowed`, `scope_required`, `invalid_request`,
`module_not_found`, `variant_not_found`, `project_not_found`, `item_not_found`, `document_not_found`, `language_fixed` and
`support_not_enabled` are all integration errors. If any of
them reach a customer's screen, something is wrong with the build rather than
with what the customer did. Worth alerting on.
