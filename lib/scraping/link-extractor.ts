/**
 * Extract candidate article links from a source homepage HTML.
 * Applies source-specific URL pattern checks and the non-article reject list
 * (AGENTS.md sections 11–12).
 */

import * as cheerio from "cheerio";
import type { SourceRow } from "@/lib/supabase/types";

/* ─── Non-article reject patterns (AGENTS.md section 9) ─── */

const NON_ARTICLE_PATTERNS = [
  /\/(category|categories|section|sections|topic|topics|tag|tags)\b/i,
  /\/(author|authors|contributor|contributors)\b/i,
  /\/search\b/i,
  /\/(show|shows|program|programs|podcast|podcasts)\b/i,
  /\/live\b/i,
  /\/(game|games|gaming)\b/i,
  /\/(product|products|review|reviews|shop|shopping)\b/i,
  /\/(about|contact|careers|help|support|faq|terms|privacy|advertise)\b/i,
  /\/(newsletter|subscribe|subscription|signup|sign-up)\b/i,
  /\/(video|videos|gallery|galleries|photos|slideshow)$/i,
  /\/(menu|navigation|footer|header|sidebar)\b/i,
];

/* ─── Source-specific article URL validators ─────────────── */

type UrlValidator = (pathname: string) => boolean;

const SOURCE_VALIDATORS: Record<string, UrlValidator> = {
  reuters: (p) => {
    // Reuters articles: /section/subsection/slug-with-id-YYYY-MM-DD
    // Reject short category paths like /world/africa, /business
    const parts = p.split("/").filter(Boolean);
    if (parts.length < 3) return false;
    // Article slugs are typically long with hyphens and end with an ID
    const slug = parts[parts.length - 1];
    return slug.length > 20 || /\d{4}-\d{2}-\d{2}/.test(p);
  },

  "bbc news": (p) => {
    // BBC articles: /news/articles/*, /news/*/ID patterns
    // Reject /news/live/, /sport/, /sounds/
    if (/\/(live|sport|sounds|weather|reel)\b/i.test(p)) return false;
    if (/\/articles\//.test(p)) return true;
    // Match paths like /news/world-12345678
    return /\/news\/[\w-]+-\d{5,}/.test(p);
  },

  cnn: (p) => {
    // CNN articles: /YYYY/MM/DD/section/slug or /section/article/slug
    // Reject /videos/, /live-news/
    if (/\/(videos|live-news|audio|cnn-underscored)\b/i.test(p)) return false;
    return /\/\d{4}\/\d{2}\/\d{2}\//.test(p) || /\/article\//.test(p);
  },

  "fox news": (p) => {
    // Fox News articles: long slugs under news paths
    // Reject /shows/, /games/, /live/, /person/
    if (/\/(shows|games|live|person|radio|category|entertainment\/celebrities)\b/i.test(p)) return false;
    const parts = p.split("/").filter(Boolean);
    if (parts.length < 2) return false;
    const slug = parts[parts.length - 1];
    return slug.length > 15;
  },

  npr: (p) => {
    // NPR articles: /YYYY/MM/DD/ID/slug
    // Reject /sections/, /podcasts/, /programs/
    if (/\/(sections|podcasts|programs|series|music|stations)\b/i.test(p)) return false;
    return /\/\d{4}\/\d{2}\/\d{2}\//.test(p) || /\/\d{8,}\//.test(p);
  },

  "the guardian": (p) => {
    // Guardian articles: /section/YYYY/mon/DD/slug
    // Reject section-only paths like /us/environment, /thefilter-us
    if (/^\/[\w-]+\/[\w-]+$/.test(p) && !/\/\d{4}\//.test(p)) return false;
    if (/\/thefilter/i.test(p)) return false;
    return /\/\d{4}\/[a-z]{3}\/\d{2}\//.test(p);
  },
};

/* ─── Main extraction function ───────────────────────────── */

/**
 * Extract candidate article URLs from homepage HTML.
 * Filters by source-specific patterns and the non-article reject list.
 */
export function extractArticleLinks(
  html: string,
  source: SourceRow
): string[] {
  const $ = cheerio.load(html);
  const baseUrl = source.listing_url.replace(/\/$/, "");
  const baseOrigin = new URL(baseUrl).origin;
  const seen = new Set<string>();
  const results: string[] = [];

  // Get the source-specific validator (match by lowercase name)
  const validatorKey = source.name.toLowerCase();
  const sourceValidator = SOURCE_VALIDATORS[validatorKey];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    // Resolve relative URLs
    let absoluteUrl: string;
    try {
      absoluteUrl = new URL(href, baseOrigin).toString();
    } catch {
      return; // Invalid URL
    }

    // Only keep links to the same domain
    const parsed = new URL(absoluteUrl);
    if (parsed.origin !== baseOrigin) return;

    // Remove fragments and common tracking params
    parsed.hash = "";
    parsed.searchParams.delete("utm_source");
    parsed.searchParams.delete("utm_medium");
    parsed.searchParams.delete("utm_campaign");
    parsed.searchParams.delete("utm_content");
    parsed.searchParams.delete("utm_term");
    const cleanUrl = parsed.toString();

    // Dedupe
    if (seen.has(cleanUrl)) return;
    seen.add(cleanUrl);

    const pathname = parsed.pathname;

    // Skip root/homepage
    if (pathname === "/" || pathname === "") return;

    // Apply non-article reject list
    if (NON_ARTICLE_PATTERNS.some((pattern) => pattern.test(pathname))) return;

    // Apply source-specific validator if available
    if (sourceValidator && !sourceValidator(pathname)) return;

    results.push(cleanUrl);
  });

  return results;
}
