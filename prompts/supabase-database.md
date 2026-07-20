# Supabase Database & Data Access Layer

## Goal

Set up the Supabase database schema, TypeScript types, server-side client, and query functions so the app has a real data layer ready for scraping, AI analysis, and UI display. Replace mock data imports on the homepage and news details page with Supabase queries.

## Skills Read

- `.agents/skills/supabase/SKILL.md` — client setup, RLS, security checklist, schema workflow
- `.agents/skills/clerk-nextjs-patterns` — server-side auth (used by existing code)

## Existing Code Inspected

- `AGENTS.md` sections 1, 5, 6, 7, 19, 20, 21, 22 — schema spec, architecture, security rules
- `app/_lib/mock-data.ts` — current mock Article type and MOCK_ARTICLES array (12 articles)
- `app/page.tsx` — homepage consuming MOCK_ARTICLES and CATEGORIES
- `app/news/[id]/page.tsx` — news details page consuming MOCK_ARTICLES
- `.env.local` — Supabase URL, anon key, and service role key already configured
- `package.json` — Next.js 16.2.10, @clerk/nextjs ^7.5.20, no supabase-js yet

## Decisions & Assumptions

1. **No Supabase Auth** — Clerk handles auth (AGENTS.md section 6). The Supabase client is used purely for data access.
2. **Service role client only** — all DB access is server-side (Server Components, API routes). No browser Supabase client. This matches AGENTS.md section 21: never expose service role key to browser.
3. **RLS enabled on all tables** — with permissive policies for the service role to bypass RLS (service role key inherently bypasses RLS in Supabase). For anon/authenticated roles, no direct access needed since all queries go through server code with the service role.
4. **No embedding column yet** — AGENTS.md section 20 says add `embedding vector(1536)` later after pgvector is enabled.
5. **Schema as SQL file** — `supabase/schema.sql` is the reference schema. User runs it in Supabase Dashboard → SQL Editor.
6. **Install `@supabase/supabase-js`** — required dependency, pin version.
7. **Seed data** — provide a seed SQL file to insert initial sources (Reuters, BBC, CNN, Fox News, NPR, The Guardian) into the `sources` table so the scraper has something to work with.
8. **Keep UI working** — homepage and news details page will continue rendering mock data for now; the query layer is built but UI integration happens only when real scraped+analyzed data exists. We'll add a `getArticlesWithAnalysis()` query that the pages can switch to later.

## Files to Create/Change

### New Files

| File | Purpose |
|------|---------|
| `supabase/schema.sql` | Full database schema (6 tables, RLS, indexes) |
| `supabase/seed.sql` | Seed data for `sources` table |
| `lib/supabase/client.ts` | Server-side Supabase client (service role) |
| `lib/supabase/types.ts` | TypeScript types for all tables |
| `lib/supabase/queries/sources.ts` | Source query functions |
| `lib/supabase/queries/articles.ts` | Article query functions (insert, dedupe check, get with analysis) |
| `lib/supabase/queries/analyses.ts` | Analysis query functions (insert, get pending) |
| `lib/supabase/queries/logs.ts` | Log insert/query functions |
| `.env.example` | Template with all env vars (no secrets) |

### Modified Files

| File | Change |
|------|--------|
| `package.json` | Add `@supabase/supabase-js` dependency |

## Implementation Requirements

### 1. Schema (`supabase/schema.sql`)

**`sources` table:**
- `id` — uuid, PK, default `gen_random_uuid()`
- `name` — text, not null
- `listing_url` — text, not null
- `parser_strategy` — text, nullable (for source-specific parsing)
- `is_active` — boolean, not null, default true
- `logo_url` — text, nullable
- `created_at` — timestamptz, default now()
- `updated_at` — timestamptz, default now()

**`articles` table:**
- `id` — uuid, PK, default `gen_random_uuid()`
- `source_id` — uuid, FK → sources(id), not null
- `original_url` — text, unique, not null (dedupe key)
- `canonical_url` — text, nullable
- `title` — text, not null
- `image_url` — text, not null
- `published_at` — timestamptz, not null
- `raw_text` — text, not null
- `scraped_at` — timestamptz, not null, default now()
- `analyzed_at` — timestamptz, nullable (set after analysis saved)
- `created_at` — timestamptz, default now()

**`article_analyses` table:**
- `id` — uuid, PK, default `gen_random_uuid()`
- `article_id` — uuid, FK → articles(id), unique, not null
- `summary` — text, not null
- `sentiment_score` — real, not null (−1 to 1)
- `sentiment_label` — text, not null (positive / neutral / negative)
- `bias_score` — real, not null (−1 to 1, derived)
- `bias_label` — text, not null (left / center / right / mixed / unclear)
- `left_percentage` — smallint, not null (0–100)
- `center_percentage` — smallint, not null (0–100)
- `right_percentage` — smallint, not null (0–100)
- `confidence` — real, not null (0–1)
- `framing_notes` — text, nullable
- `loaded_terms` — text[], nullable
- `disclaimer` — text, nullable
- `model` — text, not null
- `created_at` — timestamptz, default now()

**`logs` table:**
- `id` — uuid, PK, default `gen_random_uuid()`
- `run_type` — text, not null (scrape / analyze / schedule)
- `status` — text, not null (started / completed / failed)
- `summary` — jsonb, nullable
- `error` — text, nullable
- `created_at` — timestamptz, default now()

**`oxylabs_schedules` table:**
- `id` — uuid, PK, default `gen_random_uuid()`
- `source_id` — uuid, FK → sources(id), unique, not null
- `oxylabs_schedule_id` — text, not null (stored as text to avoid bigint precision loss)
- `is_active` — boolean, not null, default true
- `created_at` — timestamptz, default now()
- `updated_at` — timestamptz, default now()

**`oxylabs_schedule_runs` table:**
- `id` — uuid, PK, default `gen_random_uuid()`
- `schedule_id` — uuid, FK → oxylabs_schedules(id), not null
- `oxylabs_run_id` — text, not null
- `status` — text, not null (pending / processed / failed)
- `processed_at` — timestamptz, nullable
- `created_at` — timestamptz, default now()

**Indexes:**
- `articles.original_url` — unique (implicit from constraint)
- `articles.source_id` — btree
- `articles.analyzed_at` — btree (for pending-analysis queries)
- `article_analyses.article_id` — unique (implicit from constraint)
- `oxylabs_schedules.source_id` — unique (implicit from constraint)
- `oxylabs_schedule_runs.schedule_id` — btree

**RLS:** Enable on all tables. No anon/authenticated policies needed since all access is through service role which bypasses RLS.

### 2. Client (`lib/supabase/client.ts`)

- Export a `supabaseAdmin` singleton using `createClient` with `SUPABASE_SERVICE_ROLE_KEY`
- Server-only — throw if imported from client code
- Use `NEXT_PUBLIC_SUPABASE_URL` for the URL

### 3. Types (`lib/supabase/types.ts`)

- Define row types for all 6 tables
- Define insert types (omitting auto-generated fields)
- Define a `ArticleWithAnalysis` joined type for homepage/details display
- Keep types aligned with the schema

### 4. Query Functions

**`sources.ts`:**
- `getActiveSources()` — all active sources
- `getSourceById(id)` — single source

**`articles.ts`:**
- `insertArticle(article)` — insert single article
- `insertArticles(articles)` — bulk insert
- `checkExistingUrls(urls)` — check which URLs already exist (chunked, max 15 per `.in()`)
- `getArticlesWithAnalysis(limit?, offset?)` — articles joined with analysis for homepage
- `getArticleWithAnalysis(id)` — single article with analysis and source for details page
- `getRelatedArticles(articleId, embedding)` — placeholder, implemented in section 20

**`analyses.ts`:**
- `getPendingArticles(limit?)` — LEFT JOIN to find articles without analysis rows
- `insertAnalysis(analysis)` — insert analysis and set `analyzed_at`

**`logs.ts`:**
- `insertLog(log)` — insert a log entry
- `getRecentLogs(limit?)` — recent logs

### 5. Seed Data (`supabase/seed.sql`)

Insert 6 initial sources:
- Reuters — `https://www.reuters.com`
- BBC News — `https://www.bbc.com/news`
- CNN — `https://www.cnn.com`
- Fox News — `https://www.foxnews.com`
- NPR — `https://www.npr.org`
- The Guardian — `https://www.theguardian.com/us`

## Security Requirements

- Service role key used only in server-side code (`lib/supabase/client.ts`)
- `SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix — never reaches browser
- RLS enabled on all tables
- No anon/authenticated policies — all access through service role
- `.env.example` contains no real secrets

## Acceptance Criteria

1. `supabase/schema.sql` can run in Supabase SQL Editor without errors and creates all 6 tables
2. `supabase/seed.sql` inserts 6 sources
3. `lib/supabase/client.ts` creates a working server-side Supabase client
4. `lib/supabase/types.ts` has typed row/insert types for all tables
5. All query functions compile without TypeScript errors
6. `@supabase/supabase-js` is installed
7. Existing homepage and news details page continue working with mock data (no breaking changes)

## Checks to Run

```bash
npm run lint
```
```bash
npx tsc --noEmit
```

## Manual Test Steps

1. Run `supabase/schema.sql` in Supabase Dashboard → SQL Editor → confirm all tables created
2. Run `supabase/seed.sql` → confirm 6 sources appear in the `sources` table
3. Run `npm run dev` → confirm homepage still renders with mock data
4. Navigate to `/news/1` → confirm news details page still renders
5. Check terminal for any import errors related to supabase client
