# Media

*Read this when the customer sends a photo, a PDF or a recording, or the assistant cites or shows a document.*

---

## Photos and PDFs from the customer

```jsonc
POST /configurations/{id}/chat
{ "message": "Is this the right bracket?",
  "attachments": [
    { "name": "bracket.jpg",    "data": "data:image/jpeg;base64,…" },
    { "name": "spec-sheet.pdf", "data": "data:application/pdf;base64,…" } ] }
```

`data` is a base64 data URI of `image/png`, `image/jpeg`, `image/gif`,
`image/webp` or `application/pdf`; `name` is optional. Up to 20 images and
20 MB per turn, and `message` may be left out. A file is read on the turn it
arrives and the assistant can look back at it later.

A refusal is `invalid_request` with `field: "attachments"`, the entry's `index`
and a `reason`: `not_a_data_uri`, `unsupported_type`, `too_large` or
`too_many_images`.

## Voice

```
POST /transcriptions
Content-Type: multipart/form-data

file       the recording, up to 25 MB: webm, ogg, mp3, mp4 or m4a, wav, flac, aac
language   optional; a code such as "da". Left out, the tenant's language is the hint
           when it is not English, else the model detects it. A hint is not a translation.
```

```js
const form = new FormData();
form.append('file', blob, 'take.webm');
if (config.language) form.append('language', config.language);
const { text } = await (await fetch(`${BASE}/transcriptions`, {
  method: 'POST', headers: { Authorization: `Bearer ${KEY}` }, body: form,
})).json();
```

Send `text` as `message` to `/chat`; it is empty when nothing was heard.
Refusals: `invalid_request` with `field: "file"` (missing, over 25 MB, or
`reason: "not_audio"`) or with `field: "language"`.

## `sources` on `message.complete`

```jsonc
{ "type": "message.complete", "text": "…",
  "sources": [ { "documentId": "…", "title": "Service manual UNI-Q 200.pdf",
                 "format": "pdf", "url": "https://…" } ] }
```

The documents the answer leaned on. `format` (`pdf` or `docx`) says which call
below fetches it; `url` is the library's own link when it has one. Absent when
nothing was cited.

## `show`

```jsonc
{ "type": "show", "kind": "document", "documentId": "…", "title": "Wiring diagram.pdf",
  "format": "pdf", "page": 12, "quote": "Connect X2 to the relay", "caption": "…" }
```

The assistant is putting something in front of the customer. Ignorable, like
`activity`. Branch on `kind` and skip the kinds you do not know; today it is
always `document`. `page` for a PDF, `quote` for a Word document.

## Fetching a document

```
GET /documents/{documentId}/file              the PDF bytes
GET /documents/{documentId}/excerpt?quote=…   { "title", "html", "found" }, the Word document around the quote
```

Same bearer key; today these need the `support` scope, see `support`.
Refusals: `document_not_found`, or `invalid_request` with `documentId` and
`format` when the call does not match the format.
