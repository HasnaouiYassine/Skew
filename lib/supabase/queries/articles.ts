import { supabaseAdmin } from "@/lib/supabase/client";
import type {
  ArticleInsert,
  ArticleRow,
  ArticleWithAnalysis,
} from "@/lib/supabase/types";

/* ─── Helpers ────────────────────────────────────────────── */

/** Max URLs per Supabase `.in()` filter (AGENTS.md section 9). */
const URL_CHUNK_SIZE = 15;

/** Split an array into chunks of the given size. */
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/* ─── Insert ─────────────────────────────────────────────── */

/** Insert a single article. Returns the inserted row. */
export async function insertArticle(
  article: ArticleInsert
): Promise<ArticleRow> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .insert(article)
    .select()
    .single();

  if (error) throw new Error(`insertArticle failed: ${error.message}`);
  return data;
}

/** Bulk-insert articles. Returns inserted rows. */
export async function insertArticles(
  articles: ArticleInsert[]
): Promise<ArticleRow[]> {
  if (articles.length === 0) return [];

  const { data, error } = await supabaseAdmin
    .from("articles")
    .insert(articles)
    .select();

  if (error) throw new Error(`insertArticles failed: ${error.message}`);
  return data ?? [];
}

/* ─── Dedupe ─────────────────────────────────────────────── */

/**
 * Check which of the given URLs already exist in Supabase.
 * Queries in chunks of 15 to avoid oversized `.in()` filters
 * (AGENTS.md section 9 — URL existence check).
 *
 * Returns the Set of URLs that already exist.
 */
export async function checkExistingUrls(
  urls: string[]
): Promise<Set<string>> {
  if (urls.length === 0) return new Set();

  const existing = new Set<string>();
  const chunks = chunk(urls, URL_CHUNK_SIZE);

  for (const batch of chunks) {
    const { data, error } = await supabaseAdmin
      .from("articles")
      .select("original_url")
      .in("original_url", batch);

    if (error) {
      throw new Error(`checkExistingUrls failed: ${error.message}`);
    }

    for (const row of data ?? []) {
      existing.add(row.original_url);
    }
  }

  return existing;
}

/* ─── Read (with analysis join) ──────────────────────────── */

/**
 * Fetch articles with their analysis and source for homepage display.
 * Only returns articles that have been analyzed (analyzed_at is set).
 * Results are ordered by published_at descending.
 */
export async function getArticlesWithAnalysis(
  limit = 20,
  offset = 0
): Promise<ArticleWithAnalysis[]> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select(
      `
      *,
      source:sources!articles_source_id_fkey ( id, name, logo_url ),
      analysis:article_analyses!article_analyses_article_id_fkey ( * )
    `
    )
    .not("analyzed_at", "is", null)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`getArticlesWithAnalysis failed: ${error.message}`);
  }

  // Supabase returns joined data as objects (1-to-1 joins) or arrays.
  // article_analyses has a unique constraint on article_id so the join
  // returns a single object, but we normalise to be safe.
  return (data ?? []).map((row) => ({
    id: row.id,
    source_id: row.source_id,
    original_url: row.original_url,
    canonical_url: row.canonical_url,
    title: row.title,
    image_url: row.image_url,
    published_at: row.published_at,
    raw_text: row.raw_text,
    scraped_at: row.scraped_at,
    analyzed_at: row.analyzed_at,
    source: Array.isArray(row.source) ? row.source[0] : row.source,
    analysis: Array.isArray(row.analysis)
      ? row.analysis[0] ?? null
      : row.analysis ?? null,
  }));
}

/**
 * Fetch a single article with its analysis and source for the details page.
 */
export async function getArticleWithAnalysis(
  id: string
): Promise<ArticleWithAnalysis | null> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select(
      `
      *,
      source:sources!articles_source_id_fkey ( id, name, logo_url ),
      analysis:article_analyses!article_analyses_article_id_fkey ( * )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`getArticleWithAnalysis failed: ${error.message}`);
  }

  if (!data) return null;

  return {
    id: data.id,
    source_id: data.source_id,
    original_url: data.original_url,
    canonical_url: data.canonical_url,
    title: data.title,
    image_url: data.image_url,
    published_at: data.published_at,
    raw_text: data.raw_text,
    scraped_at: data.scraped_at,
    analyzed_at: data.analyzed_at,
    source: Array.isArray(data.source) ? data.source[0] : data.source,
    analysis: Array.isArray(data.analysis)
      ? data.analysis[0] ?? null
      : data.analysis ?? null,
  };
}
