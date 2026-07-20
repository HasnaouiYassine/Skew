# Oxylabs Manual Scraping Pipeline

## Goal

Implement the manual scraping pipeline (`POST /api/scrape`) that fetches source homepages through Oxylabs, extracts article links, scrapes detail pages, validates articles, and inserts them into Supabase. This is AGENTS.md section 16 — manual scraping using the scrape-to-insert pipeline from section 9.

## Skills Read

- `.agents/skills/oxylabs-web-scraper/SKILL.md` — Oxylabs Web Scraper API, `universal` source, realtime endpoint, auth
- `.agents/skills/supabase/SKILL.md` — client patterns, RLS, security checklist

## Existing Code Inspected

- `AGENTS.md` sections 8–17 — scraping model, link extraction, candidate filtering, validation, API methods, admin secret, manual scraping, testing
- `lib/supabase/client.ts` — server-side Supabase client (service role)
- `lib/supabase/types.ts` — ArticleInsert, ArticleRow, SourceRow types
- `lib/supabase/queries/articles.ts` — insertArticle(), checkExistingUrls() already built
- `lib/supabase/queries/sources.ts` — getActiveSources() already built
- `lib/supabase/queries/logs.ts` — insertLog() already built
- `.env.local` — OXY_WSA_USERNAME/PASSWORD set, admin secret is `X-SKEW-admin-secret=blablabla13245`

## Decisions & Assumptions

1. **Admin secret env var** — `.env.local` has `X-SKEW-admin-secret` but AGENTS.md says `BIASLY_ADMIN_SECRET`. I'll add `BIASLY_ADMIN_SECRET=blablabla13245` to `.env.local` and use that variable name in code per AGENTS.md section 15. The user can update the value later.
2. **Oxylabs `universal` source** — all news sites use `source: "universal"` since they're not in Oxylabs' structured targets list.
3. **Cheerio for HTML parsing** — needs to be installed. Used to extract links from homepage HTML and parse article detail pages for title, image, date, and body text.
4. **Per-source article limit** — default 5 valid articles per source (AGENTS.md section 16).
5. **Source-specific URL patterns** — implement article URL validators for Reuters, BBC, CNN, Fox News, NPR, The Guardian to filter candidate links (AGENTS.md sections 11–12).
6. **Architecture** — keep layers separate per AGENTS.md section 5:
   - `lib/scraping/oxylabs.ts` — Oxylabs API call wrapper
   - `lib/scraping/link-extractor.ts` — homepage HTML → candidate article URLs
   - `lib/scraping/article-parser.ts` — detail page HTML → validated article data
   - `lib/scraping/pipeline.ts` — orchestrates the full scrape-to-insert flow
   - `app/api/scrape/route.ts` — thin API route handler

## Files to Create/Change

### New Files

| File | Purpose |
|------|---------|
| `lib/scraping/oxylabs.ts` | Oxylabs API wrapper (scrape URL → HTML) |
| `lib/scraping/link-extractor.ts` | Extract candidate article links from homepage HTML |
| `lib/scraping/article-parser.ts` | Parse article detail page → title, image, date, body, validate |
| `lib/scraping/pipeline.ts` | Full scrape-to-insert pipeline orchestration |
| `app/api/scrape/route.ts` | `POST /api/scrape` route handler |

### Modified Files

| File | Change |
|------|--------|
| `.env.local` | Add `BIASLY_ADMIN_SECRET=blablabla13245` |
| `package.json` | Add `cheerio` dependency |

## Implementation Requirements

### 1. Oxylabs wrapper (`lib/scraping/oxylabs.ts`)
- `scrapeUrl(url: string): Promise<string>` — POST to `https://realtime.oxylabs.io/v1/queries` with `source: "universal"`, return `results[0].content` (HTML string)
- Use Basic Auth with `OXY_WSA_USERNAME` / `OXY_WSA_PASSWORD`
- Throw on non-200 or missing content
- Log the URL being scraped

### 2. Link extractor (`lib/scraping/link-extractor.ts`)
- `extractArticleLinks(html: string, source: SourceRow): string[]`
- Use Cheerio to find `<a>` tags with href
- Normalize URLs (resolve relative, remove fragments/tracking params)
- Apply source-specific article URL pattern checks:
  - **Reuters**: keep `/world/*/`, `/business/*/`, `/markets/*/`, `/technology/*/` with slug/ID patterns; reject short category paths like `/world/africa`
  - **BBC**: keep `/news/articles/*` or `/news/*/`  with ID patterns; reject `/news/live/`, `/sport/`, `/sounds/`
  - **CNN**: keep paths with date patterns `/YYYY/MM/DD/` or `/article/`; reject `/videos/`, `/live-news/`
  - **Fox News**: keep paths with long slugs under news sections; reject `/shows/`, `/games/`, `/live/`, `/person/`
  - **NPR**: keep `/YYYY/MM/DD/` date-based paths; reject `/sections/`, `/podcasts/`, `/programs/`
  - **The Guardian**: keep paths with date `/YYYY/mon/DD/` patterns; reject section-only paths like `/us/environment`
- Apply the non-article reject list (section 9) as a generic fallback
- Deduplicate results

### 3. Article parser (`lib/scraping/article-parser.ts`)
- `parseArticlePage(html: string, url: string): ParsedArticle | null`
- Use Cheerio to extract:
  - `title` — from `<title>`, `og:title`, or `<h1>`
  - `imageUrl` — from `og:image` or first large article image
  - `publishedAt` — from `article:published_time`, `datePublished`, `time[datetime]`, or date meta tags
  - `rawText` — article body paragraphs from `<article>`, `[data-testid="article-body"]`, `.article-body`, `.story-body`, or generic `<p>` tags within content areas
  - `canonicalUrl` — from `<link rel="canonical">`
- Clean raw_text per section 13: remove scripts, styles, ads, navigation, newsletter blocks, CSS dumps
- Validate per section 13: require title, image, date, and meaningful body (≥3 paragraphs OR ≥900 chars)
- Return null with rejection reason if validation fails

### 4. Pipeline (`lib/scraping/pipeline.ts`)
- `runScrapePipeline(options: { sourceIds?: string[]; perSourceLimit?: number }): Promise<ScrapeResult>`
- Flow per section 9:
  1. Load active sources from Supabase (or filter by sourceIds)
  2. For each source: scrape homepage via Oxylabs
  3. Extract candidate links
  4. Reject non-article URLs
  5. Check existing URLs in Supabase (chunked, max 15 per .in())
  6. Scrape remaining detail pages via Oxylabs
  7. Parse and validate each detail page
  8. Insert valid articles into Supabase
  9. Log everything per run logging rules
- Return summary object per section 9
- Insert log entry into `logs` table
- Console logging throughout per run logging rules

### 5. API route (`app/api/scrape/route.ts`)
- `POST` only
- Require `x-biasly-admin-secret` header matching `BIASLY_ADMIN_SECRET` env var
- Accept optional JSON body: `{ sourceIds?: string[], perSourceLimit?: number }`
- Call `runScrapePipeline()` and return the summary JSON
- Return 401 for missing/invalid secret

## Security Requirements

- `BIASLY_ADMIN_SECRET` header required for POST /api/scrape (section 15)
- Oxylabs credentials server-only (no NEXT_PUBLIC_ prefix)
- No scraping from browser code (section 21)

## Acceptance Criteria

1. `POST /api/scrape` with valid admin secret returns a summary JSON with articles inserted
2. Source-specific URL filtering rejects category/section/listing pages
3. Article validation rejects pages missing title, image, date, or meaningful body
4. URL deduplication prevents re-scraping already-stored articles
5. Console logs show scrape progress per run logging rules
6. Inserted articles appear in Supabase `articles` table
7. `logs` table gets a scrape run entry
8. TypeScript compiles without errors

## Checks to Run

```bash
npx tsc --noEmit
npx eslint lib/scraping/ app/api/scrape/
```

## Exact Manual Test Steps

1. Make sure the dev server is running: `npm run dev`
2. Watch the terminal for scrape logs
3. Run:

```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -H "x-biasly-admin-secret: blablabla13245" \
  -d '{"perSourceLimit": 3}'
```

4. Check terminal for per-source scrape progress logs
5. Check the JSON response for the summary object
6. Check Supabase Dashboard → `articles` table for newly inserted articles
7. Check Supabase Dashboard → `logs` table for the scrape run entry
8. Refresh the homepage — articles won't appear yet since they need AI analysis first
