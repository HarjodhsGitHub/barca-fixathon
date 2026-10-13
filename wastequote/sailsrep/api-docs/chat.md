# Chat

*Read this when adding the assistant, or handling the questions it asks.*

---

## The call

```
POST /configurations/{id}/chat
{ "message": "I need something for outdoor use" }
```

The response is an SSE stream, one `data:` line per event holding a JSON
object, no `event:` or `id:` fields; it ends when the turn is over. A turn
refused before it starts is a plain JSON 4xx; a failure after the first event
is the `error` event below.

To answer a question the assistant asked, write the pick with `PUT` and send
its name as the next message; see the `question` event below.

---

## The events

```
message.delta          message.complete       question
configuration.updated  selections.proposed    configuration.ready
error                  activity (ignorable)
```

A client that handles only `message.delta` and `configuration.updated` already
works. Everything else makes it better.

The customer can send photos, PDFs and recordings, and the assistant can cite
or show documents: see `media`.

### `message.delta`

```jsonc
{ "type": "message.delta", "text": "Sure, for outdoor use you'll want" }
```

Append it. Many of these per turn.

### `message.complete`

```jsonc
{ "type": "message.complete", "text": "…the full reply…",
  "suggestions": ["What about winter?", "Show me the price"] }
```

The finished text, so you can replace your accumulated buffer if you prefer.
`suggestions` are ready made replies to offer as chips. Present only if your
tenant has follow up chips enabled.

### `question`

The assistant is asking the customer something and expects an answer.

```jsonc
{ "type": "question", "id": "q_8f3a", "kind": "variant",
  "question": "Which frame suits your span?",
  "moduleId": "frame",
  "variants": [ { "id": "xl", "name": "Frame XL", "status": "available",
                  "image": "…", "description": "Heavy duty" } ],
  "presentation": "hero" }
```

Four kinds:

| `kind` | carries | the customer answers by |
|---|---|---|
| `variant` | `moduleId`, `variants` ordered selectable first | picking one |
| `text` | `options`, an array of suggested strings | typing, or picking a suggestion |
| `input` | `moduleId`, `bounds` with `min` and `max` | entering a number |
| `multi` | `groups`, two to five related modules | answering them as one grid |

**Answering.** A picked option is a selection: write it with
`PUT /configurations/{id}`, then send its name as the next message. A `multi`
grid is one `PUT` with every pick, an `input` a `PUT` with the number, a `text`
answer only the message. The name alone, without the `PUT`, also works, less
deterministically.

`question` can be an empty string: the assistant asked in the message text just
before the event, and only the options need rendering, under that message.

**Presentation hints.** `presentation` is `minimal`, `default` or `hero`, and it
is the assistant saying how much emphasis this question deserves. `stack: true`
means the options are long enough that a vertical layout reads better than
inline pills. Both are hints. Honour them for a richer feel, or ignore them
entirely and render every question the same way. Nothing breaks.

### `configuration.updated`

```jsonc
{ "type": "configuration.updated", "configuration": { …the whole document… } }
```

The assistant changed something. The complete document, exactly as `PUT` and
`GET` return it, except that it carries no `price`: a running total on this
stream comes from reading the configuration once the turn ends. Re-render from
it. You may receive several in one turn, and it may carry `pending`, see
`solving`.

### `selections.proposed`

Only when your tenant has approvals enabled. See `approvals`.

### `configuration.ready`

```jsonc
{ "type": "configuration.ready", "quoteId": null }
```

The assistant considers the configuration complete and is handing back to you.
**No quote has been created.** This is the moment to show your review screen, or
your finish button, and to call `POST /quote` when the customer is ready. See
`quotes`.

If a quote already exists for this configuration, because the customer came back
to one, `quoteId` and `proposalUrl` carry it. Otherwise `quoteId` is `null`,
the one field in this API that is null rather than absent.

### `activity`

```jsonc
{ "type": "activity", "label": "Prepared your quote" }
```

A human readable note about what the assistant is doing, for a progress line if
you want one. **Entirely ignorable.** It carries no state, it is not part of the
conversation, and dropping every one of these leaves a correct integration.

### `error`

```jsonc
{ "type": "error", "error": { "code": "…", "kind": "…", "message": "…" } }
```

The same shape as every REST error. See `errors`.

---

## What the stream does not send

Model reasoning, debug frames, tool names and arguments, and anything else the
assistant used to reach its answer. You get what it said, what it asked, what it
changed, and an ignorable one-line note about what it is doing.

---

## Turning the assistant off

Do not call `/chat`. There is nothing to disable, no flag to set, and the rest
of the API behaves identically. A configurator with no AI in it is a supported
design, not a degraded one.

---

## While a turn is running

The assistant may change selections at any point during a turn. If your own
controls are live at the same time, a `PUT` built from a document you received
before the turn started will overwrite what the assistant just did.

Disable your controls for the duration of the turn, or rebuild your selection
set from the most recent `configuration.updated` before you send.

---

## Reading the conversation back

```
GET /configurations/{id}/chat
```

```jsonc
{ "messages": [
    { "role": "user", "text": "Is this the right bracket?",
      "attachments": [ { "kind": "image" }, { "name": "spec-sheet.pdf", "kind": "pdf" } ],
      "at": "2026-09-28T09:15:00.000Z" },
    { "role": "assistant", "text": "Yes, that is the M12 bracket.", "at": "…" } ] }
```

The stored transcript, oldest first; empty before the first turn. Files are
listed by name and kind, never linked.

---

## Tips

- **Markdown.** The assistant writes Markdown; render it wherever its words appear.
- **Streaming.** Paint `message.delta` once a frame, not once an event, and
  keep the reply and the configuration in separate state.
- **What to draw.** Streaming prose, `activity` as a status line, `question` as
  options under the message, and the assistant's own picks (`source: "agent"`,
  each with a `reason`) as one collapsed line under its reply.
- **Coming back.** Keep the configuration id. On the next visit, offer to resume
  (`GET` the configuration and its `/chat`) or start over (a new `POST`).
