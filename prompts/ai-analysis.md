# AI Article Analysis Pipeline

## Goal

Implement `POST /api/analyze` — an AI analysis pipeline that fetches all pending articles (those with no `article_analyses` row), analyzes each with `gpt-4o` via the Vercel AI SDK using `generateText` + `Output.object()` for structured output, validates the result with Zod, and saves analysis + sets `analyzed_at`. This is AGENTS.md section 19.

## Skills Read

- `.agents/skills/ai-sdk/SKILL.md` — verified AI SDK v7.0.31 is installed; confirmed `generateText` + `Output.object()` pattern from bundled docs at `node_modules/ai/docs/03-ai-sdk-core/10-generating-structured-data.mdx` and `30-embeddings.mdx`
- `.agents/skills/supabase/SKILL.md` — security checklist, service role usage, RLS

## Existing Code Inspected

- `AGENTS.md` section 19 — analysis fields, bias label rules, framing output rules, pending-analysis check, batch loop requirements
- `lib/supabase/queries/analyses.ts` — `getPendingArticles()` (LEFT JOIN via JS), `insertAnalysis()` already built
- `lib/supabase/types.ts` — `ArticleAnalysisInsert`, `ArticleRow` types
- `package.json` — `ai@7.0.31` and `@ai-sdk/openai` now installed, `zod` installed
- `node_modules/ai/docs/03-ai-sdk-core/10-generating-structured-data.mdx` — `generateText` + `Output.object({ schema })` pattern confirmed
- `.env.local` — `OPENAI_API_KEY` env var slot present (must be filled by user)

## Decisions & Assumptions

1. **`generateText` + `Output.object()`** — This is the correct API for AI SDK v7.0.31 per bundled docs. Not the old `generateObject` pattern.
2. **Model: `gpt-4o`** — per AGENTS.md section 19 ("model name" stored in analysis row).
3. **OpenAI provider** — `import { openai } from '@ai-sdk/openai'` per installed package.
4. **Batch size** — configurable via `ANALYSIS_BATCH_SIZE` env var (default 5). Process in batches to avoid timeouts.
5. **Pending detection** — `getPendingArticles()` already uses LEFT JOIN via JS filter (AGENTS.md section 19 requirement). Loop until no pending remain.
6. **Retry once** — If Zod validation fails, retry the AI call once. If still invalid, mark article as failed (skip without saving).
7. **`analyzed_at`** — Set only after `insertAnalysis()` succeeds (already enforced by existing `insertAnalysis()` function).
8. **Text truncation** — Truncate `raw_text` to ~8000 characters before sending to avoid token limits. Include a clear message in the prompt that the text may be truncated.
9. **No embeddings yet** — AGENTS.md section 20 says embeddings are added after pgvector is enabled. Skip for now.
10. **Architecture** — Separate AI layer per section 5:
    - `lib/ai/analyze.ts` — AI analysis function (calls OpenAI, validates with Zod)
    - `lib/ai/pipeline.ts` — batch loop orchestration, logging
    - `app/api/analyze/route.ts` — thin POST route handler

## Files to Create

| File | Purpose |
|------|---------|
| `lib/ai/analyze.ts` | Single-article AI analysis using `generateText` + `Output.object()` |
| `lib/ai/pipeline.ts` | Batch analysis loop with logging |
| `app/api/analyze/route.ts` | `POST /api/analyze` route handler |

## Implementation Requirements

### 1. Analysis schema (Zod) — `lib/ai/analyze.ts`

Define a Zod schema matching AGENTS.md section 19 framing output rules:

```typescript
z.object({
  summary: z.string(),                    // neutral summary
  sentimentScore: z.number().min(-1).max(1),
  sentimentLabel: z.enum(['positive', 'neutral', 'negative']),
  leftPercentage: z.number().int().min(0).max(100),
  centerPercentage: z.number().int().min(0).max(100),
  rightPercentage: z.number().int().min(0).max(100),
  politicalFramingLabel: z.enum(['left', 'center', 'right', 'mixed', 'unclear']),
  confidence: z.number().min(0).max(1),
  framingNotes: z.string().nullable().optional(),
  loadedTerms: z.array(z.string()).optional(),
  disclaimer: z.string().nullable().optional(),
})
```

Add a `.refine()` check: `leftPercentage + centerPercentage + rightPercentage === 100`.

Derive `biasScore = (rightPercentage - leftPercentage) / 100` in code (not from AI).

### 2. AI analysis function — `lib/ai/analyze.ts`

`analyzeArticle(article: ArticleRow): Promise<ArticleAnalysisInsert | null>`

- Import `openai` from `@ai-sdk/openai` and `generateText`, `Output` from `ai`
- Truncate `raw_text` to 8000 chars with a note if truncated
- Call `generateText` with:
  - `model: openai('gpt-4o')`
  - `output: Output.object({ schema: analysisSchema })`
  - System prompt instructing neutral political analysis per AGENTS.md section 19 rules
  - User prompt with the article title + truncated text
- On success: map the output to `ArticleAnalysisInsert` (compute `bias_score`, use snake_case field names)
- On Zod/AI error: return `null` (caller handles retry)
- Log start, success, or failure for each article

### 3. Batch analysis pipeline — `lib/ai/pipeline.ts`

`runAnalysisPipeline(options: { limit?: number; articleIds?: string[] }): Promise<AnalysisResult>`

- Fetch pending articles via `getPendingArticles(batchSize)`
- For each article:
  - Call `analyzeArticle()` → if null, retry once → if still null, count as failed
  - If valid: call `insertAnalysis()` → count as analyzed
- Loop until no pending articles remain (or limit reached)
- Emit console logs throughout (start, per-article, per-batch summary, final summary)
- Insert a `logs` entry at the end

Return summary: `{ status, analyzed, skipped, failed, totalDurationMs }`

### 4. API route — `app/api/analyze/route.ts`

- `POST` only
- Require `x-biasly-admin-secret` header matching `BIASLY_ADMIN_SECRET`
- Accept optional JSON body: `{ limit?: number; articleIds?: string[] }`
- Call `runAnalysisPipeline()` and return summary JSON
- Return 401 for missing/invalid secret

### 5. System prompt content

The system prompt must instruct the model to:
- Write a concise, neutral summary of the article
- Estimate political framing as percentages (left/center/right, must sum to 100)
- Use article text as evidence only — do not infer from source name
- Choose `politicalFramingLabel` matching the dominant percentage (use `unclear` if confidence < 0.4 or percentages are within 15 points of each other)
- Use `unclear` and low confidence if evidence is weak
- Label sentiment as positive, neutral, or negative based on tone
- Note any loaded/charged language terms
- Output must be JSON matching the schema exactly

## Security Requirements

- `OPENAI_API_KEY` server-only — no `NEXT_PUBLIC_` prefix
- `BIASLY_ADMIN_SECRET` required for POST /api/analyze
- No AI calls from browser code

## Acceptance Criteria

1. `POST /api/analyze` with valid secret returns summary JSON
2. Each analyzed article gets a row in `article_analyses` with all required fields
3. `analyzed_at` is set on the article after successful analysis
4. Percentages sum to 100 (Zod refine validates this)
5. Failed articles are counted and skipped without crashing the batch
6. Console logs show per-article and per-batch progress
7. TypeScript compiles without errors

## Checks to Run

```bash
npx tsc --noEmit
npx eslint lib/ai/ app/api/analyze/
```

## Exact Manual Test Steps

1. Ensure the dev server is running: `npm run dev`
2. Ensure `OPENAI_API_KEY` is set in `.env.local`
3. Run a scrape first if `articles` table is empty:
   ```bash
   curl -X POST http://localhost:3000/api/scrape \
     -H "Content-Type: application/json" \
     -H "x-biasly-admin-secret: blablabla13245" \
     -d '{"perSourceLimit": 2}'
   ```
4. Then trigger analysis:
   ```bash
   curl -X POST http://localhost:3000/api/analyze \
     -H "Content-Type: application/json" \
     -H "x-biasly-admin-secret: blablabla13245" \
     -d '{}'
   ```
5. Watch server terminal for per-article analysis logs
6. Check JSON response summary for analyzed/failed counts
7. Check Supabase `article_analyses` table for rows
8. Refresh the homepage — analyzed articles now appear with bias bars and sentiment labels
