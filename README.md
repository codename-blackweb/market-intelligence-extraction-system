# Market Intelligence Engine

Lean Next.js MVP for turning a single market query into a classified market breakdown and strategy report.

## What it does

- Pulls Google autocomplete, People Also Ask, and related searches through SerpAPI.
- Normalizes those signals into one flat string array.
- Runs an analysis pass with `OPENAI_ANALYSIS_MODEL`.
- Runs a synthesis pass with `OPENAI_SYNTHESIS_MODEL`.
- Renders a simple report with classification, pains, objections, acquisition angle, and messaging direction.
- Exports the report to PDF with `html2pdf.js`.

## Stack

- Next.js App Router
- TypeScript
- OpenAI Responses API
- SerpAPI
- OpenAI Node SDK
- html2pdf.js

## Environment

Copy `.env.example` to `.env.local` and set:

```bash
OPENAI_API_KEY=...
SERPAPI_KEY=...
OPENAI_ANALYSIS_MODEL=gpt-5-mini
OPENAI_SYNTHESIS_MODEL=gpt-5
```

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Netlify

This project is deployable on Netlify as a Next.js app.

- Base directory: leave blank
- Build command: `npm run build`
- Publish directory: `.next`
- Production branch: `main`

Set runtime environment variables in the Netlify UI:

- `OPENAI_API_KEY`
- `SERPAPI_KEY`
- `OPENAI_ANALYSIS_MODEL`
- `OPENAI_SYNTHESIS_MODEL`

If your site uses variable scopes, make sure the API keys include the `Functions` scope because the analysis runs in a server-side route handler.

## API flow

1. `POST /api/serp` with `{ query }`
2. Receive `{ query, serpData }`
3. `POST /api/analyze` with `{ query, serpData }`
4. Receive classification + strategy JSON

## Current MVP limitations

- Reports are stored in browser local storage, not a database.
- The active deploy path is intentionally narrow: one query, SERP normalization, analysis pass, synthesis pass.
- Live analysis requires valid OpenAI and SerpAPI keys plus both model env vars.
