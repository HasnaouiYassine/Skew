import { supabaseAdmin } from "@/lib/supabase/client";
import type {
  ArticleAnalysisInsert,
  ArticleAnalysisRow,
  ArticleRow,
} from "@/lib/supabase/types";

/**
 * Find articles that are pending analysis.
 *
 * Uses a LEFT JOIN from articles to article_analyses and returns
 * only rows where no analysis row exists — per AGENTS.md section 19
 * (pending-analysis check). Never relies on `analyzed_at IS NULL` alone.
 */
export async function getPendingArticles(
  limit = 50
): Promise<ArticleRow[]> {
  // Supabase-js doesn't support a direct "WHERE joined_table IS NULL"
  // filter. We fetch articles with the join and filter in JS.
  // This is consistent with AGENTS.md section 665 (joined table filter gotcha).
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select(
      `
      *,
      analysis:article_analyses!article_analyses_article_id_fkey ( id )
    `
    )
    .order("scraped_at", { ascending: false })
    .limit(limit * 2); // over-fetch to account for already-analyzed articles

  if (error) {
    throw new Error(`getPendingArticles failed: ${error.message}`);
  }

  // Filter to articles with no analysis row
  const pending = (data ?? [])
    .filter((row) => {
      const analysis = Array.isArray(row.analysis)
        ? row.analysis[0]
        : row.analysis;
      return !analysis;
    })
    .slice(0, limit);

  // Strip the joined `analysis` field to return clean ArticleRow objects
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return pending.map(({ analysis: _a, ...article }) => article);
}

/**
 * Insert an article analysis and set `analyzed_at` on the article.
 * Both operations happen sequentially — if the analysis insert fails,
 * `analyzed_at` is NOT set (AGENTS.md section 19, requirement 6).
 */
export async function insertAnalysis(
  analysisData: ArticleAnalysisInsert
): Promise<ArticleAnalysisRow> {
  // 1. Insert the analysis row
  const { data: analysis, error: analysisError } = await supabaseAdmin
    .from("article_analyses")
    .insert(analysisData)
    .select()
    .single();

  if (analysisError) {
    throw new Error(`insertAnalysis failed: ${analysisError.message}`);
  }

  // 2. Set analyzed_at on the article (only after successful insert)
  const { error: updateError } = await supabaseAdmin
    .from("articles")
    .update({ analyzed_at: new Date().toISOString() })
    .eq("id", analysisData.article_id);

  if (updateError) {
    throw new Error(
      `insertAnalysis: failed to set analyzed_at: ${updateError.message}`
    );
  }

  return analysis;
}
