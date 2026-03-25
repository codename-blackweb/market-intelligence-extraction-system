# Market Intelligence Engine

Lean Next.js MVP for turning a seed query into a structured market-intelligence report.

## What it does

- Pulls Google demand signals through SerpAPI.
- Mines Reddit threads and comments for voice-of-customer language.
- Derives competitor messaging blocks from search results.
- Scrapes supplied landing pages for conversion structure.
- Accepts uploaded review data from JSON or CSV.
- Synthesizes everything into a report with problems, language, keywords, gaps, and strategy.
- Supports browser print-to-PDF and `html2canvas` / `jsPDF` export.

## Stack

- Next.js App Router
- TypeScript
- OpenAI Responses API
- SerpAPI
- Cheerio
- html2canvas
- jsPDF

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

## Input notes

- `Competitor brands`: one per line or comma-separated.
- `Landing page URLs`: one per line or comma-separated.
- `Subreddits`: one per line or comma-separated.
- Reviews upload accepts:
  - `.json`: array of `{ source, rating, title?, body }`
  - `.csv`: columns `source,rating,title,body`

## Current MVP limitations

- Reports are stored in browser local storage, not a database.
- Competitor intelligence is derived from search-result messaging rather than direct ad-library integrations.
- External page fetches can fail on aggressive anti-bot setups.
- Live analysis requires valid OpenAI and SerpAPI keys.
