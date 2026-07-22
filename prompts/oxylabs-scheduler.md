# Oxylabs Scheduler + Vercel Cron — Implementation Prompt

## Goal

Implement the Oxylabs Scheduler to automatically scrape active news source homepages hourly, process the completed results through the existing scrape-to-insert pipeline, and chain AI analysis. The pipeline is triggered by Vercel Cron at `:15 past every hour`.

---

## Skills Read

- `AGENTS.md` — full read (sections 9, 14, 15, 18) ✅
- `.agents/skills/oxylabs-web-scraper/SKILL.md` — Oxylabs Realtime API, auth, universal source ✅
- `.agents/skills/supabase/SKILL.md` — Supabase client, service role, query patterns ✅
- Oxylabs Scheduler API docs (fetched from `https://developers.oxylabs.io/products/web-scraper-api/features/scheduler`) — endpoint paths, payload format, `/runs` vs `/jobs`, deactivation ✅

---

## Existing Code Inspected

| File | Status |
|---|---|
| `lib/scraping/pipeline.ts` | `runScrapePipeline()` accepts `prefetchedHtml` for scheduler (already designed for this) |
| `lib/scraping/oxylabs.ts` | `scrapeUrl()` — Oxylabs realtime wrapper (not used by scheduler; scheduler fetches results from Oxylabs) |
| `lib/ai/pipeline.ts` | `runAnalysisPipeline()` — batch analysis, pending detection via LEFT JOIN |
| `lib/supabase/client.ts` | `supabaseAdmin` service-role client |
| `lib/supabase/types.ts` | `OxylabsScheduleRow`, `OxylabsScheduleRunRow`, `SourceRow` types exist |
| `lib/supabase/queries/sources.ts` | `getActiveSources()` |
| `lib/supabase/queries/logs.ts` | `insertLog()` |
| `app/api/scrape/route.ts` | POST with `x-biasly-admin-secret` pattern |
| `app/api/analyze/route.ts` | POST with `x-biasly-admin-secret` pattern |
| `supabase/schema.sql` | `oxylabs_schedules` and `oxylabs_schedule_runs` tables already defined |
| `supabase/seed.sql` | 6 active sources (Reuters, BBC, CNN, Fox, NPR, Guardian) |
| `.env.local` | Has `OXY_WSA_USERNAME`, `OXY_WSA_PASSWORD`, Supabase keys, `BIASLY_ADMIN_SECRET` |
| `package.json` | All deps installed — no new packages needed |

---

## Decisions & Assumptions

1. **Cron expression**: `15 * * * *` — fires at `:15` past every hour, giving Oxylabs 15 minutes to complete the scheduled jobs that run at the top of the hour.
2. **Schedule creation**: One schedule per active source, each with a single `universal` job item for the source's `listing_url`. Schedules are set to repeat hourly with a far-future `end_time` (2035-12-31).
3. **Large integer IDs**: `schedule_id` and job `id` from Oxylabs are 64-bit integers exceeding `Number.MAX_SAFE_INTEGER`. Extract them as strings from the raw HTTP response text before any `JSON.parse`.
4. **Use `/runs` for processing**: `/runs` endpoint provides `result_status` per job. Filter to `result_status === 'done'`. Do NOT use `/jobs` (no status info).
5. **Fetch completed job content**: For each "done" job, fetch its result content from Oxylabs using the job ID. The result HTML is the source homepage HTML.
6. **Pass HTML to pipeline**: Collected job HTML keyed by source ID → pass as `prefetchedHtml` to `runScrapePipeline()`.
7. **Orphan deactivation**: After creating new schedules, call `GET /v1/schedules` to list all Oxylabs schedule IDs, compare against DB, deactivate any not in DB.
8. **Cron route protection**: `CRON_SECRET` (injected by Vercel). In dev, skip check so route can be tested manually. Do NOT add `CRON_SECRET` to `.env.local`.
9. **Admin routes**: `POST /api/oxylabs/schedules` and `POST /api/oxylabs/scheduled-results/process` require `x-biasly-admin-secret`. `GET` list routes do not require secret.
10. **Pipeline chaining**: The cron pipeline runs scheduler processing first, then AI analysis — even if the first step fails (there may be pre-existing unanalyzed articles).

---

## Files to Create / Modify

| File | Action |
|---|---|
| `lib/scraping/scheduler.ts` | **NEW** — Oxylabs Scheduler API client |
| `lib/supabase/queries/schedules.ts` | **NEW** — DB queries for schedules + schedule_runs |
| `app/api/oxylabs/schedules/route.ts` | **NEW** — `GET` (list) + `POST` (sync) |
| `app/api/oxylabs/scheduled-results/process/route.ts` | **NEW** — `POST` manual process |
| `app/api/cron/pipeline/route.ts` | **NEW** — `GET` Vercel Cron trigger |
| `vercel.json` | **NEW** — Cron schedule config |
| `.env.example` | **MODIFY** — Add `CRON_SECRET` comment line |

---

## Implementation Requirements

### 1. `lib/scraping/scheduler.ts` — Oxylabs Scheduler API Client

Server-only module. Functions:

**`oxyApiFetch(method, path, body?)`** — shared helper for all Oxylabs Scheduler API calls.
- Base URL: `https://data.oxylabs.io/v1`
- Basic Auth from `OXY_WSA_USERNAME` / `OXY_WSA_PASSWORD`
- Returns the raw response text (NOT parsed JSON) so the caller can extract large integers safely.

**`createSchedule(sourceUrl: string): Promise<{ scheduleId: string }>`**
- `POST /v1/schedules`
- Body: `{ cron: "15 * * * *", items: [{ source: "universal", url: sourceUrl }], end_time: "2035-12-31 23:59:59" }`
- Extract `schedule_id` from raw response text using regex: `/"schedule_id"\s*:\s*(\d+)/`
- Return `{ scheduleId: matchedString }`

**`listSchedules(): Promise<string[]>`**
- `GET /v1/schedules`
- Extract all schedule IDs from raw response text using regex: `/(\d+)/g` on the `"schedules"` array part
- Return string array.

**`getScheduleRuns(scheduleId: string): Promise<OxylabsRun[]>`**
- `GET /v1/schedules/{scheduleId}/runs`
- Extract runs data — BUT need to handle large integers in job IDs.
- Parse JSON (after extracting IDs as strings) or use a reviver function.
- Return runs, including job IDs as strings.

**`getJobResult(jobId: string): Promise<string>`**
- `GET https://data.oxylabs.io/v1/queries/{jobId}` — Push-Pull result fetch
- Returns the HTML content string.

**`deactivateSchedule(scheduleId: string): Promise<void>`**
- `PUT /v1/schedules/{scheduleId}/state`
- Body: `{ active: false }`

**Types:**
```typescript
interface OxylabsJobInfo {
  id: string;        // stored as string to preserve bigint precision
  result_status: "done" | "failed" | "pending";
}

interface OxylabsRun {
  run_id: string;
  jobs: OxylabsJobInfo[];
  success_rate: number;
}
```

### 2. `lib/supabase/queries/schedules.ts` — Schedule DB Queries

Functions:

**`getAllSchedules(): Promise<OxylabsScheduleRow[]>`** — all rows from `oxylabs_schedules`.

**`insertSchedule(sourceId: string, oxylabsScheduleId: string): Promise<void>`**
- INSERT into `oxylabs_schedules`.
- Handle conflict (source_id unique).

**`getSchedulesWithSources(): Promise<Array>`** — join `oxylabs_schedules` with `sources` to get schedule + source info.

**`insertScheduleRun(scheduleId: string, oxylabsRunId: string): Promise<void>`**
- INSERT into `oxylabs_schedule_runs`.

**`markRunProcessed(runId: string): Promise<void>`**
- UPDATE `oxylabs_schedule_runs` SET `status = 'processed'`, `processed_at = now()`.

### 3. `app/api/oxylabs/schedules/route.ts` — Schedules API

**`GET`** — List all stored schedules with source info.
- No auth required (read-only).
- Join `oxylabs_schedules` with `sources`, return JSON array.

**`POST`** — Sync schedules.
- Requires `x-biasly-admin-secret`.
- Steps:
  1. Fetch all active sources from Supabase.
  2. For each active source, check if a schedule row already exists.
  3. If not, call `createSchedule(source.listing_url)` and `insertSchedule(source.id, scheduleId)`.
  4. After all new schedules created, call `listSchedules()` to get all Oxylabs IDs.
  5. Compare against DB `oxylabs_schedule_id` values.
  6. Deactivate any Oxylabs schedule not present in DB.
- Return summary: `{ created: number, deactivated: number, total: number }`.

### 4. `app/api/oxylabs/scheduled-results/process/route.ts` — Manual Process

**`POST`** — Process completed scheduled results.
- Requires `x-biasly-admin-secret`.
- Steps:
  1. Fetch all active schedules with source info from DB.
  2. For each schedule, call `getScheduleRuns(oxylabsScheduleId)`.
  3. Get the latest run with `result_status === 'done'`.
  4. Check if this run has already been processed (check `oxylabs_schedule_runs`).
  5. For each done job in the unprocessed run:
     - Call `getJobResult(jobId)` to get the homepage HTML.
     - Collect HTML keyed by source ID.
  6. Record the run in `oxylabs_schedule_runs`.
  7. Pass collected HTML as `prefetchedHtml` to `runScrapePipeline()`.
  8. Mark runs as processed.
- Return pipeline results + run summary.

### 5. `app/api/cron/pipeline/route.ts` — Vercel Cron Pipeline

**`GET`** — Automatic pipeline trigger.
- Protected by `CRON_SECRET`:
  - In production: reject requests without the `CRON_SECRET` header or with wrong value (401).
  - In development: skip the check so the route can be tested manually.
- Steps:
  1. **Step 1**: Process scheduled results (call `POST /api/oxylabs/scheduled-results/process` logic directly — don't make an HTTP call to self).
  2. **Step 2**: Run AI analysis on all pending articles (call `runAnalysisPipeline()`).
  3. Step 2 runs even if step 1 fails.
- Return combined summary: `{ schedulerProcessing: {...}, analysis: {...} }`.

### 6. `vercel.json` — Vercel Cron Config

```json
{
  "crons": [
    {
      "path": "/api/cron/pipeline",
      "schedule": "15 * * * *"
    }
  ]
}
```

### 7. `.env.example` — Update

Add comment about CRON_SECRET near the bottom:

```
# CRON_SECRET is injected by Vercel automatically for cron job authentication.
# Do NOT add CRON_SECRET to .env.local.
```

---

## Security Requirements

- `SUPABASE_SERVICE_ROLE_KEY`, `OXY_WSA_USERNAME`, `OXY_WSA_PASSWORD` — server-only env vars
- `x-biasly-admin-secret` header required on `POST /api/oxylabs/schedules` and `POST /api/oxylabs/scheduled-results/process`
- `CRON_SECRET` protects `GET /api/cron/pipeline` — injected by Vercel, not in `.env.local`
- All scheduler API calls are server-only — never in browser code
- Large integer IDs handled as strings to prevent silent corruption

---

## Acceptance Criteria

- [ ] `POST /api/oxylabs/schedules` creates Oxylabs schedules for active sources and deactivates orphans
- [ ] `GET /api/oxylabs/schedules` returns stored schedule rows with source info
- [ ] `POST /api/oxylabs/scheduled-results/process` fetches completed jobs, runs scrape pipeline with prefetched HTML
- [ ] `GET /api/cron/pipeline` chains scheduler processing then AI analysis
- [ ] Cron route returns 401 in production without valid `CRON_SECRET`
- [ ] Cron route works in dev without `CRON_SECRET`
- [ ] `vercel.json` configured with `15 * * * *`
- [ ] `npm run lint` — no errors
- [ ] `npm run build` — succeeds

---

## Checks to Run

```
npm run lint
npm run build
```

---

## Manual Test Steps After Implementation

1. Run `npm run dev`
2. **Sync schedules** — `curl -X POST http://localhost:3000/api/oxylabs/schedules -H "x-biasly-admin-secret: blablabla13245"`
3. **List schedules** — `curl http://localhost:3000/api/oxylabs/schedules`
4. **Manual process** — `curl -X POST http://localhost:3000/api/oxylabs/scheduled-results/process -H "x-biasly-admin-secret: blablabla13245"`
5. **Cron pipeline** (dev, no secret) — `curl http://localhost:3000/api/cron/pipeline`
6. Verify: terminal shows scrape + analysis progress logs
7. Build succeeds with `npm run build`
