# Selinsight

CPQ for waste with AI vision (formerly WasteQuote; the code lives in `wastequote/`). A salesperson at a waste-management company photographs a customer's waste stream. Selinsight turns the photo into a configured, priced quote that shows every treatment route side by side (reuse, recycling, recovery, landfill) with its cost and CO₂e, so the circular option is the easiest one to accept.

Hackathon prototype, Norrsken Fixathon Barcelona, October 2026. See [DEMO.md](DEMO.md) for the 60-second click-through and [STATUS.md](STATUS.md) for what is real, sample or faked.

## Run it (one command)

```bash
cd wastequote && npm run start:demo
```

Then open http://127.0.0.1:3456. Needs Node 20 or newer. `start:demo` installs dependencies and starts the dev server on localhost only. Use `npm run dev:lan` to reach it from a phone on the same network (for the camera button). Anyone on that network can then use the app and its Sailsrep key, so only do that on a network you trust.

Nothing else is required: without any keys the app runs end to end on the local rules and the recorded demo classifications.

### Keys (optional)

| What | How | Without it |
| --- | --- | --- |
| Sailsrep Configurator API | `SAILSREP_API_KEY=ss_test_…` in `wastequote/.env.local`, or the key file `sailsrep/keys/<tenant>.key` (gitignored, on Edvin's machine) | Rules come from the local copy in `/data`; vision uses Claude or the stub; no chat |
| Claude (Anthropic) | `ANTHROPIC_API_KEY=…` in `wastequote/.env.local` | Not needed when Sailsrep is configured |

Vision provider order: `WASTEQUOTE_VISION=stub|claude|sailsrep` if set, else Sailsrep, else Claude, else the stub.

## How it works

```
photo ──► vision (Sailsrep assistant, or Claude) ──► salesperson confirms fields under 70% confidence
      ──► Sailsrep CPQ decides which routes / containers are open (rules generated from /data)
      ──► Selinsight engine prices every open route per tonne + CO₂e (arithmetic on /data, with citations)
      ──► accept ──► Sailsrep validates the full configuration ──► quote PDF + draft waste transfer note
```

- **The LLM classifies and writes text. It never prices and never decides a route.** Route eligibility is the rules table `data/eligibility.json`, exported into the Sailsrep tenant by `npm run sailsrep:export`. Prices and CO₂e are deterministic code (`lib/engine/index.ts`) over the JSON tables in `/data`. Every number in the UI opens to its formula and the data row it came from.
- **Sailsrep CPQ is the configuration engine.** The model lives in the demo tenant `wastequote-waste-collection-service-2610132242` (see `sailsrep/tenant.json`). The app reads route and container availability from the Configurator API, classifies the photo through the Sailsrep assistant (photo as a chat attachment), lets the salesperson ask follow-ups on the same configuration ("Ask Sailsrep"), and validates the accepted configuration before saving. API docs fetched from the API are in `sailsrep/api-docs/`.
- **What the salesperson sees.**
  - While the AI reads the photo, a live feed shows it filling in the configuration.
  - Fields under 70% confidence must be confirmed.
  - When contamination closes every circular route, the compare step works out what separating at source would unlock, prices it, and re-quotes in one click.
  - The UI is white-labelled: it says "Selinsight AI" and "CPQ engine", never Sailsrep.
- **Every price and factor has a source.** Each row in `/data` carries `source` and `is_sample`. Sample values show a striped "Sample data" badge everywhere they are used. The research behind the sourced values is in `data/SOURCES.md`; the full list is on the Price book page (`/pricebook`).

## Layout

| Path | What |
| --- | --- |
| `app/quote/new` | the quote wizard (photo, classify, configure, compare and accept) |
| `app/quotes/[id]` | an accepted quote, its PDF and draft waste transfer note |
| `app/pricebook` | every data table with sources and sample markers |
| `app/api/vision` | vision step (Sailsrep, Claude or stub) |
| `app/api/sailsrep/*` | availability and chat proxy to the Sailsrep Configurator API (the key stays server-side) |
| `app/api/quotes` | accept (recomputes, validates in Sailsrep, stores), PDFs |
| `lib/engine` | route eligibility, capacity, pricing, CO₂e |
| `lib/sailsrep.ts`, `lib/sailsrep-ids.ts` | Sailsrep client and the id mapping shared with the exporter |
| `lib/vision` | vision schema, Claude call, stub, provider choice |
| `lib/pdf` | quote PDF and draft waste transfer note (pdf-lib) |
| `data/*.json` | the editable tables: materials, EWC codes, routes, treatments, eligibility rules, containers, transport, pricing, taxes, emission factors |
| `demo/` | test photos (CC BY-SA, see `demo/CREDITS.md`) and the recorded classifications the stub returns |
| `sailsrep/` | generated Sailsrep import JSON, test cases, tenant id, API docs; `keys/` is gitignored |
| `.data/` | accepted quotes and their photos (gitignored) |

## Scripts

```bash
npm run dev              # localhost:3456
npm test                 # engine sanity checks over every material × contamination
npm run typecheck
npm run lint
npm run sailsrep:export  # regenerate sailsrep/wastequote-sailsrep.json + testfall.json from /data
```

After changing `data/eligibility.json`, `containers.json` or `materials.json`, run `npm run sailsrep:export` and upload the JSON to the tenant (Sailsrep Admin `upload_catalog`), or the app will show "Sailsrep and the local rules disagree" on the affected routes.

Stack: Next.js 16, React 19, TypeScript, Tailwind 4, zod, pdf-lib, `@anthropic-ai/sdk` (optional path). Same stack as the team's `web/` app.
