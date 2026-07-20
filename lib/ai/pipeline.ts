/**
 * AI analysis batch pipeline (AGENTS.md section 19).
 * Fetches pending articles, analyzes them in batches, retries once on failure.
 */

import { analyzeArticle } from "@/lib/ai/analyze";
import { getPendingArticles, insertAnalysis } from "@/lib/supabase/queries/analyses";
import { insertLog } from "@/lib/supabase/queries/logs";
import type { ArticleRow } from "@/lib/supabase/types";

/* ─── Types ──────────────────────────────────────────────── */

export interface AnalysisPipelineOptions {
  /** Max total articles to analyze in this run. Default: all pending. */
  limit?: number;
  /** Analyze only these article IDs (skips pending detection). */
  articleIds?: string[];
}

export interface AnalysisPipelineResult {
  status: "completed" | "failed";
  analyzed: number;
  skipped: number;
  failed: number;
  totalDurationMs: number;
}

/* ─── Batch size ─────────────────────────────────────────── */

function getBatchSize(): number {
  const env = process.env.ANALYSIS_BATCH_SIZE;
  const parsed = env ? parseInt(env, 10) : NaN;
  return isNaN(parsed) || parsed < 1 ? 5 : parsed;
}

/* ─── Single-article processing with retry ──────────────── */

async function processArticle(
  article: ArticleRow
): Promise<"analyzed" | "failed"> {
  console.log(`  [pipeline] Analyzing: "${article.title.slice(0, 70)}..."`);

  // First attempt
  let analysisData = await analyzeArticle(article);

  // Retry once on failure per AGENTS.md section 19
  if (!analysisData) {
    console.log(`  [pipeline] Retrying: "${article.title.slice(0, 60)}..."`);
    analysisData = await analyzeArticle(article);
  }

  if (!analysisData) {
    console.error(`  [pipeline] FAILED (both attempts): "${article.title.slice(0, 60)}"`);
    return "failed";
  }

  try {
    await insertAnalysis(analysisData);
    console.log(
      `  [pipeline] ✓ Analyzed [${analysisData.bias_label}/${analysisData.sentiment_label}]: "${article.title.slice(0, 60)}"`
    );
    return "analyzed";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  [pipeline] Insert failed: ${msg}`);
    return "failed";
  }
}

/* ─── Main pipeline ──────────────────────────────────────── */

export async function runAnalysisPipeline(
  options: AnalysisPipelineOptions = {}
): Promise<AnalysisPipelineResult> {
  const start = Date.now();
  const batchSize = getBatchSize();
  const maxTotal = options.limit ?? Infinity;

  console.log("\n═══════════════════════════════════════════════");
  console.log("  ANALYSIS PIPELINE STARTED");
  console.log(`  Batch size: ${batchSize}`);
  if (options.limit) console.log(`  Limit: ${options.limit}`);
  console.log("═══════════════════════════════════════════════\n");

  const result: AnalysisPipelineResult = {
    status: "completed",
    analyzed: 0,
    skipped: 0,
    failed: 0,
    totalDurationMs: 0,
  };

  let totalProcessed = 0;

  // If specific article IDs were given, build a one-off batch from them
  // Otherwise loop fetching pending articles until none remain
  try {
    while (totalProcessed < maxTotal) {
      const remaining = Math.min(batchSize, maxTotal - totalProcessed);
      
      // Fetch the next batch of pending articles
      let batch: ArticleRow[];
      try {
        batch = await getPendingArticles(remaining);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  [pipeline] Failed to fetch pending articles: ${msg}`);
        result.status = "failed";
        break;
      }

      if (batch.length === 0) {
        console.log("  [pipeline] No more pending articles — done.");
        break;
      }

      console.log(
        `\n  [pipeline] Processing batch of ${batch.length} article(s)...`
      );

      // Analyze each article in the batch sequentially
      for (const article of batch) {
        const outcome = await processArticle(article);
        if (outcome === "analyzed") result.analyzed++;
        else result.failed++;
        totalProcessed++;
      }

      console.log(
        `  [pipeline] Batch complete — analyzed: ${result.analyzed}, failed: ${result.failed}`
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  [pipeline] Unhandled error: ${msg}`);
    result.status = "failed";
  }

  result.totalDurationMs = Date.now() - start;

  console.log("\n═══════════════════════════════════════════════");
  console.log("  ANALYSIS PIPELINE COMPLETED");
  console.log(JSON.stringify(result, null, 2));
  console.log("═══════════════════════════════════════════════\n");

  // Log to Supabase
  try {
    await insertLog({
      run_type: "analyze",
      status: result.status,
      summary: result as unknown as Record<string, unknown>,
    });
  } catch (err) {
    console.error("  [pipeline] Failed to insert log:", err);
  }

  return result;
}
