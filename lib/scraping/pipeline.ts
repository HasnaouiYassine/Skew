/**
 * Scrape-to-insert pipeline orchestration (AGENTS.md section 9).
 * Reusable by both manual scraping (section 16) and scheduler processing (section 18).
 */

import { scrapeUrl } from "@/lib/scraping/oxylabs";
import { extractArticleLinks } from "@/lib/scraping/link-extractor";
import { parseArticlePage } from "@/lib/scraping/article-parser";
import { getActiveSources } from "@/lib/supabase/queries/sources";
import {
  checkExistingUrls,
  insertArticle,
} from "@/lib/supabase/queries/articles";
import { insertLog } from "@/lib/supabase/queries/logs";
import type { SourceRow } from "@/lib/supabase/types";

/* ─── Types ──────────────────────────────────────────────── */

export interface ScrapePipelineOptions {
  /** Specific source IDs to scrape. Defaults to all active sources. */
  sourceIds?: string[];
  /** Max valid articles to insert per source. Default: 5. */
  perSourceLimit?: number;
  /**
   * Optional: pre-fetched homepage HTML keyed by source ID.
   * Used by scheduler processing (section 18) where HTML comes
   * from completed Oxylabs job results instead of live fetches.
   */
  prefetchedHtml?: Record<string, string>;
}

export interface ScrapeResult {
  status: "completed" | "failed";
  sourcesChecked: number;
  candidatesFound: number;
  candidatesRejected: number;
  duplicatesSkipped: number;
  detailPagesScraped: number;
  articlesInserted: number;
  articlesRejected: number;
  articlesFailed: number;
  totalDurationMs: number;
  rejectionReasons: Record<string, number>;
  perSource: Record<string, { candidates: number; inserted: number; errors: string[] }>;
}

/* ─── Pipeline ───────────────────────────────────────────── */

export async function runScrapePipeline(
  options: ScrapePipelineOptions = {}
): Promise<ScrapeResult> {
  const start = Date.now();
  const perSourceLimit = options.perSourceLimit ?? 5;

  console.log("\n═══════════════════════════════════════════════");
  console.log("  SCRAPE PIPELINE STARTED");
  console.log("═══════════════════════════════════════════════\n");

  const result: ScrapeResult = {
    status: "completed",
    sourcesChecked: 0,
    candidatesFound: 0,
    candidatesRejected: 0,
    duplicatesSkipped: 0,
    detailPagesScraped: 0,
    articlesInserted: 0,
    articlesRejected: 0,
    articlesFailed: 0,
    totalDurationMs: 0,
    rejectionReasons: {},
    perSource: {},
  };

  // 1. Load sources
  let sources: SourceRow[];
  try {
    const allSources = await getActiveSources();
    if (options.sourceIds && options.sourceIds.length > 0) {
      sources = allSources.filter((s) => options.sourceIds!.includes(s.id));
    } else {
      sources = allSources;
    }
  } catch (err) {
    console.error("  [pipeline] Failed to load sources:", err);
    result.status = "failed";
    result.totalDurationMs = Date.now() - start;
    await logRun(result);
    return result;
  }

  result.sourcesChecked = sources.length;
  console.log(`  [pipeline] Selected ${sources.length} source(s):`);
  sources.forEach((s) => console.log(`    - ${s.name} (${s.listing_url})`));

  // 2. Process each source
  for (const source of sources) {
    const sourceResult = { candidates: 0, inserted: 0, errors: [] as string[] };
    result.perSource[source.name] = sourceResult;

    console.log(`\n  ── ${source.name} ──────────────────────────────`);

    try {
      // 2a. Get homepage HTML
      let homepageHtml: string;
      if (options.prefetchedHtml?.[source.id]) {
        homepageHtml = options.prefetchedHtml[source.id];
        console.log(`  [${source.name}] Using prefetched homepage HTML`);
      } else {
        homepageHtml = await scrapeUrl(source.listing_url);
        console.log(`  [${source.name}] Homepage fetched (${homepageHtml.length} chars)`);
      }

      // 2b. Extract candidate links
      const candidateLinks = extractArticleLinks(homepageHtml, source);
      sourceResult.candidates = candidateLinks.length;
      result.candidatesFound += candidateLinks.length;
      console.log(`  [${source.name}] Candidate links found: ${candidateLinks.length}`);

      if (candidateLinks.length === 0) {
        console.log(`  [${source.name}] No candidates — skipping`);
        continue;
      }

      // 2c. Check which URLs already exist in Supabase
      const existingUrls = await checkExistingUrls(candidateLinks);
      const newLinks = candidateLinks.filter((url) => !existingUrls.has(url));
      const dupes = candidateLinks.length - newLinks.length;
      result.duplicatesSkipped += dupes;
      console.log(`  [${source.name}] Duplicates skipped: ${dupes}`);
      console.log(`  [${source.name}] New candidates to scrape: ${newLinks.length}`);

      if (newLinks.length === 0) {
        console.log(`  [${source.name}] All candidates already exist — skipping`);
        continue;
      }

      // 2d. Scrape detail pages and validate
      let insertedForSource = 0;

      for (const articleUrl of newLinks) {
        // Stop if we've hit the per-source limit
        if (insertedForSource >= perSourceLimit) {
          console.log(`  [${source.name}] Per-source limit reached (${perSourceLimit})`);
          break;
        }

        try {
          result.detailPagesScraped++;
          const detailHtml = await scrapeUrl(articleUrl);

          // 2e. Parse and validate
          const { article: parsed, rejectionReason } = parseArticlePage(
            detailHtml,
            articleUrl
          );

          if (!parsed) {
            result.articlesRejected++;
            result.rejectionReasons[rejectionReason!] =
              (result.rejectionReasons[rejectionReason!] ?? 0) + 1;
            console.log(`  [${source.name}] REJECTED: ${articleUrl} — ${rejectionReason}`);
            continue;
          }

          // 2f. Insert into Supabase
          await insertArticle({
            source_id: source.id,
            original_url: articleUrl,
            canonical_url: parsed.canonicalUrl,
            title: parsed.title,
            image_url: parsed.imageUrl,
            published_at: parsed.publishedAt,
            raw_text: parsed.rawText,
          });

          insertedForSource++;
          result.articlesInserted++;
          console.log(`  [${source.name}] ✓ INSERTED: ${parsed.title.slice(0, 70)}...`);
        } catch (err) {
          result.articlesFailed++;
          const errMsg = err instanceof Error ? err.message : String(err);
          sourceResult.errors.push(`${articleUrl}: ${errMsg}`);
          console.error(`  [${source.name}] FAILED: ${articleUrl} — ${errMsg}`);
        }
      }

      sourceResult.inserted = insertedForSource;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      sourceResult.errors.push(errMsg);
      console.error(`  [${source.name}] SOURCE-LEVEL ERROR: ${errMsg}`);
    }
  }

  result.totalDurationMs = Date.now() - start;
  result.candidatesRejected = result.articlesRejected;

  console.log("\n═══════════════════════════════════════════════");
  console.log("  SCRAPE PIPELINE COMPLETED");
  console.log("═══════════════════════════════════════════════");
  console.log(JSON.stringify(result, null, 2));

  // Log to Supabase
  await logRun(result);

  return result;
}

/* ─── Log helper ─────────────────────────────────────────── */

async function logRun(result: ScrapeResult): Promise<void> {
  try {
    await insertLog({
      run_type: "scrape",
      status: result.status,
      summary: result as unknown as Record<string, unknown>,
    });
  } catch (err) {
    console.error("  [pipeline] Failed to insert log:", err);
  }
}
