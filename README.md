# Skew News : AI-Powered News Analysis

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

Skew collects real news articles from major outlets, analyzes them with AI for political framing and sentiment, and displays the results in a clean, reader-friendly interface.

Built with Next.js 16, Clerk, Supabase, Oxylabs Web Scraper API, and the Vercel AI SDK.

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Pipeline Overview](#pipeline-overview)
- [Deployment](#deployment)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Architecture

```
                        ┌─────────────────────┐
                        │   Oxylabs Scheduler  │  (hourly homepage scrape)
                        │  (runs at 6:00 AM)  │
                        └────────┬────────────┘
                                 │ completed jobs
                                 ▼
  ┌──────────────────────────────────────────────────┐
  │          Vercel Cron (6:15 AM daily)             │
  │  ┌─────────────────────┐  ┌───────────────────┐  │
  │  │ Process Scheduler   │  │  AI Analysis      │  │
  │  │ Results             │  │  Pipeline          │  │
  │  │ → scrape-to-insert  │  │ → sentiment +     │  │
  │  │ → validation/dedupe │  │   framing analysis │  │
  │  └─────────┬───────────┘  └─────────┬─────────┘  │
  │            │                        │            │
  └────────────┼────────────────────────┼────────────┘
               ▼                        ▼
        ┌──────────────────────────────────────┐
        │            Supabase                   │
        │  sources | articles | article_analyses│
        │  logs | oxylabs_schedules | runs      │
        └──────────────────┬───────────────────┘
                           │ query
                           ▼
              ┌───────────────────────┐
              │   Next.js App Router  │
              │   Home + Details UI   │
              └───────────────────────┘
```

## Features

- **Automated Scraping** : Oxylabs Scheduler scrapes 6 news source homepages daily (Reuters, BBC, CNN, Fox News, NPR, The Guardian)
- **Article Extraction** : Validates and cleans article content, rejects non-article pages (categories, podcasts, live feeds, etc.)
- **Deduplication** : Prevents duplicate articles via original URL and canonical URL checks
- **AI Analysis** : Vercel AI SDK + Groq evaluates each article for political framing (left/center/right percentages) and sentiment (positive/neutral/negative)
- **Manual Controls** : Trigger scraping and analysis on demand via protected API endpoints
- **Auth** : Clerk authentication with sign-in/sign-up pages
- **Responsive UI** : Tailwind CSS with shadcn/ui components

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Clerk](https://clerk.com) application
- An [Oxylabs](https://oxylabs.io) account with Web Scraper API + Scheduler enabled
- A [Groq](https://groq.com) API key (for AI analysis)
- A [Vercel](https://vercel.com) account (for cron deployment)

## Environment Variables


| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `OXY_WSA_USERNAME` | Oxylabs Web Scraper API username |
| `OXY_WSA_PASSWORD` | Oxylabs Web Scraper API password |
| `GROQ_API_KEY` | Groq API key for AI analysis |
| `BIASLY_ADMIN_SECRET` | Secret for protected admin API routes |
| `ANALYSIS_BATCH_SIZE` | Articles per analysis batch (default: 5) |


## Database Setup

1. Enable pgvector in Supabase Dashboard → Database → Extensions
2. Run `supabase/schema.sql` in Supabase Dashboard → SQL Editor
3. Run `supabase/seed.sql` to insert the 6 news sources

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Endpoints

### Manual Scraping

```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "x-biasly-admin-secret: YOUR_SECRET"
```

Optionally limit sources and articles per source:

```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "x-biasly-admin-secret: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"sourceIds": ["source-uuid-1", "source-uuid-2"], "perSourceLimit": 3}'
```

### Manual AI Analysis

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "x-biasly-admin-secret: YOUR_SECRET"
```

### Scheduler Sync

Creates Oxylabs schedules for all active sources (runs daily at 6:00 AM):

```bash
curl -X POST http://localhost:3000/api/oxylabs/schedules \
  -H "x-biasly-admin-secret: YOUR_SECRET"
```

### List Schedules

```bash
curl http://localhost:3000/api/oxylabs/schedules
```

### Process Scheduled Results (Manual)

```bash
curl -X POST http://localhost:3000/api/oxylabs/scheduled-results/process \
  -H "x-biasly-admin-secret: YOUR_SECRET"
```

### Test Cron Pipeline (Dev, no auth)

```bash
curl http://localhost:3000/api/cron/pipeline
```

## Pipeline Overview

### Scrape-to-Insert

1. Load active sources from Supabase
2. Fetch each source's homepage via Oxylabs (or use prefetched HTML from scheduler)
3. Extract candidate article links from visible story cards
4. Filter out non-article URLs (categories, podcasts, games, etc.)
5. Deduplicate against existing articles in Supabase
6. Scrape each article detail page
7. Validate: must have meaningful body, image, published date
8. Clean `raw_text`: remove scripts, ads, navigation, related content
9. Insert valid articles

### AI Analysis

1. Detect pending articles via LEFT JOIN (not `analyzed_at IS NULL`)
2. Process in configurable batches
3. For each article: call Groq via Vercel AI SDK
4. Validate structured output with Zod
5. Save to `article_analyses` and set `analyzed_at`
6. Retry once on failure

### Automatic Pipeline

Runs daily at 6:15 AM via Vercel Cron:

1. **Step 1**: Process scheduled results : fetch completed Oxylabs jobs, extract article links, validate, insert
2. **Step 2**: Run AI analysis on all pending articles
3. Step 2 runs even if Step 1 fails

## Deployment

Deploy to Vercel:

```bash
npm run build
vercel --prod
```

The `vercel.json` registers a daily cron job (`15 6 * * *`) that triggers `/api/cron/pipeline`.

Make sure all [environment variables](#environment-variables) are set in your Vercel project settings before deploying.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Auth**: [Clerk](https://clerk.com) (Core 3)
- **Database**: [Supabase](https://supabase.com) (PostgreSQL + pgvector)
- **Scraping**: [Oxylabs Web Scraper API](https://oxylabs.io/products/web-scraper-api) + Scheduler
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai) + [Groq](https://groq.com)
- **UI**: [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Cron**: [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- **Language**: TypeScript

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── analyze/route.ts          # POST : manual AI analysis
│   │   ├── cron/pipeline/route.ts    # GET : Vercel Cron trigger
│   │   ├── oxylabs/
│   │   │   ├── schedules/route.ts    # GET + POST : schedule management
│   │   │   └── scheduled-results/process/route.ts  # POST : manual process
│   │   └── scrape/route.ts           # POST : manual scraping
│   ├── news/[id]/page.tsx            # News details page
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   └── page.tsx                      # Homepage with article cards
├── lib/
│   ├── ai/
│   │   ├── analyze.ts                # Single article AI analysis
│   │   └── pipeline.ts               # Batch analysis pipeline
│   ├── scraping/
│   │   ├── article-parser.ts         # Detail page validation & cleanup
│   │   ├── link-extractor.ts         # Homepage link extraction
│   │   ├── oxylabs.ts                # Oxylabs realtime API wrapper
│   │   ├── pipeline.ts               # Scrape-to-insert orchestration
│   │   └── scheduler.ts              # Oxylabs Scheduler API client
│   └── supabase/
│       ├── client.ts                 # Service-role Supabase client
│       ├── types.ts                  # Row & insert TypeScript types
│       └── queries/
│           ├── analyses.ts           # Analysis CRUD + pending detection
│           ├── articles.ts           # Article CRUD + dedupe + joins
│           ├── logs.ts               # Log insert + fetch
│           ├── schedules.ts          # Schedule + schedule runs CRUD
│           └── sources.ts            # Source CRUD
├── supabase/
│   ├── schema.sql                    # Full database schema
│   └── seed.sql                      # 6 news sources
├── prompts/                          # Implementation prompt files
├── .env.example
├── proxy.ts                          # Clerk auth middleware
└── vercel.json                       # Cron job configuration
```

## Troubleshooting

| Issue | Likely cause |
|---|---|
| Cron endpoint returns 401 | `CRON_SECRET` mismatch : Vercel injects this automatically, don't set it manually |
| No articles inserted after scrape | Check `logs` table in Supabase for validation failures; source homepage markup may have changed |
| Analysis stuck at "pending" | Confirm `GROQ_API_KEY` is valid and `ANALYSIS_BATCH_SIZE` isn't set to `0` |
| Duplicate articles appearing | Verify canonical URL extraction is working for that source in `article-parser.ts` |

## Roadmap

- [ ] Add more news sources
- [ ] Historical bias trends per outlet
- [ ] Public API for third-party access

## Contributing

Issues and pull requests are welcome. For larger changes, please open an issue first to discuss what you'd like to change.

## License

[MIT](./LICENSE)