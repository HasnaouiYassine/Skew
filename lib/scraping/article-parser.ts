/**
 * Parse an article detail page HTML into structured data.
 * Validates per AGENTS.md section 13 (article content gate).
 */

import * as cheerio from "cheerio";

/* ─── Types ──────────────────────────────────────────────── */

export interface ParsedArticle {
  title: string;
  imageUrl: string;
  publishedAt: string;
  rawText: string;
  canonicalUrl: string | null;
}

export interface ParseResult {
  article: ParsedArticle | null;
  rejectionReason: string | null;
}

/* ─── Cleanup patterns ───────────────────────────────────── */

/** Selectors for elements to remove before extracting body text. */
const REMOVE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "iframe",
  "svg",
  "nav",
  "header",
  "footer",
  "[role='navigation']",
  "[role='banner']",
  "[role='contentinfo']",
  ".ad",
  ".ads",
  ".advertisement",
  "[class*='newsletter']",
  "[class*='subscribe']",
  "[class*='subscription']",
  "[class*='related']",
  "[class*='most-viewed']",
  "[class*='most-read']",
  "[class*='trending']",
  "[class*='social-share']",
  "[class*='share-bar']",
  "[class*='load-more']",
  "[class*='comment']",
  "[class*='sidebar']",
  "[class*='promo']",
  "[class*='sponsor']",
  "[class*='outbrain']",
  "[class*='taboola']",
  "[data-component='share']",
  "[data-component='links']",
].join(", ");

/* ─── Text cleanup ───────────────────────────────────────── */

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")        // collapse whitespace
    .replace(/\n{3,}/g, "\n\n")  // max double newlines
    .trim();
}

function isJunkLine(line: string): boolean {
  const lower = line.toLowerCase().trim();
  if (lower.length < 10) return true;
  if (/^(share|tweet|email|print|copy link|follow|subscribe|sign up|load more)/i.test(lower)) return true;
  if (/^(advertisement|sponsored|promoted)/i.test(lower)) return true;
  if (/copyright|all rights reserved|©/i.test(lower)) return true;
  // CSS/JS dumps
  if (/\{[^}]*:[^}]*\}/.test(lower)) return true;
  if (/^\s*\.[a-z][\w-]*\s*\{/.test(lower)) return true;
  return false;
}

/* ─── Extraction helpers ─────────────────────────────────── */

function extractTitle($: cheerio.CheerioAPI): string | null {
  // Try og:title first, then <title>, then <h1>
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  if (ogTitle && ogTitle.length > 5) return ogTitle;

  const titleTag = $("title").text().trim();
  // Strip common suffixes like " - CNN", " | BBC"
  const cleaned = titleTag.replace(/\s*[|\-–—]\s*[^|\-–—]+$/, "").trim();
  if (cleaned && cleaned.length > 5) return cleaned;

  const h1 = $("h1").first().text().trim();
  if (h1 && h1.length > 5) return h1;

  return null;
}

function extractImage($: cheerio.CheerioAPI): string | null {
  // og:image is the most reliable
  const ogImage = $('meta[property="og:image"]').attr("content")?.trim();
  if (ogImage) return ogImage;

  // Fallback: first large image in article area
  const articleImg = $("article img[src], [role='main'] img[src]").first().attr("src");
  if (articleImg) return articleImg;

  return null;
}

function extractPublishedDate($: cheerio.CheerioAPI): string | null {
  // Try standard meta tags
  const metaSelectors = [
    'meta[property="article:published_time"]',
    'meta[name="pubdate"]',
    'meta[name="publishdate"]',
    'meta[name="date"]',
    'meta[property="og:article:published_time"]',
    'meta[name="DC.date.issued"]',
  ];

  for (const sel of metaSelectors) {
    const value = $(sel).attr("content")?.trim();
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    }
  }

  // Try time[datetime]
  const timeDatetime = $("time[datetime]").first().attr("datetime")?.trim();
  if (timeDatetime) {
    const parsed = new Date(timeDatetime);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  }

  // Try JSON-LD
  let jsonLdDate: string | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (jsonLdDate) return;
    try {
      const json = JSON.parse($(el).text());
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        if (item.datePublished) {
          const parsed = new Date(item.datePublished);
          if (!isNaN(parsed.getTime())) {
            jsonLdDate = parsed.toISOString();
            return;
          }
        }
      }
    } catch {
      // ignore invalid JSON-LD
    }
  });
  if (jsonLdDate) return jsonLdDate;

  return null;
}

function extractCanonical($: cheerio.CheerioAPI): string | null {
  return $('link[rel="canonical"]').attr("href")?.trim() ?? null;
}

function extractBodyText($: cheerio.CheerioAPI): string {
  // Remove junk elements
  $(REMOVE_SELECTORS).remove();

  // Try specific article containers first
  const containerSelectors = [
    "article",
    '[data-testid="article-body"]',
    ".article-body",
    ".article__body",
    ".story-body",
    ".post-content",
    '[role="main"]',
    ".content-body",
    "#article-body",
  ];

  let $container: ReturnType<cheerio.CheerioAPI> | null = null;
  for (const sel of containerSelectors) {
    const found = $(sel);
    if (found.length > 0) {
      $container = found.first();
      break;
    }
  }

  // Extract paragraphs
  const paragraphs: string[] = [];
  const source = $container ?? $("body");

  source.find("p").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 0 && !isJunkLine(text)) {
      paragraphs.push(text);
    }
  });

  // If no paragraphs found, try splitting text content
  if (paragraphs.length === 0) {
    const bodyText = source.text();
    const sentences = bodyText.split(/(?<=[.!?])\s+/);
    let currentPara = "";
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length === 0 || isJunkLine(trimmed)) continue;
      currentPara += (currentPara ? " " : "") + trimmed;
      if (currentPara.length > 200) {
        paragraphs.push(currentPara);
        currentPara = "";
      }
    }
    if (currentPara.length > 0) paragraphs.push(currentPara);
  }

  return paragraphs.map(cleanText).join("\n\n");
}

/* ─── Main parse function ────────────────────────────────── */

/**
 * Parse an article detail page HTML.
 * Returns the parsed article or null with a rejection reason.
 * Validates per AGENTS.md section 13.
 */
export function parseArticlePage(
  html: string,
  url: string
): ParseResult {
  const $ = cheerio.load(html);

  const title = extractTitle($);
  if (!title) {
    return { article: null, rejectionReason: "missing title" };
  }

  // Reject generic/non-article titles
  const titleLower = title.toLowerCase();
  const genericTitles = [
    "home", "homepage", "breaking news", "latest news",
    "live", "watch", "video", "podcast", "show",
  ];
  if (genericTitles.some((g) => titleLower === g || titleLower.startsWith(`${g} -`))) {
    return { article: null, rejectionReason: `generic title: "${title}"` };
  }

  const imageUrl = extractImage($);
  if (!imageUrl) {
    return { article: null, rejectionReason: "missing image" };
  }

  const publishedAt = extractPublishedDate($);
  if (!publishedAt) {
    return { article: null, rejectionReason: "missing published date" };
  }

  const rawText = extractBodyText($);
  const paragraphs = rawText.split("\n\n").filter((p) => p.length > 0);
  const charCount = rawText.replace(/\s+/g, " ").length;

  // Article content gate (AGENTS.md section 13):
  // 3+ meaningful paragraphs OR 900+ meaningful characters
  if (paragraphs.length < 3 && charCount < 900) {
    return {
      article: null,
      rejectionReason: `insufficient content: ${paragraphs.length} paragraphs, ${charCount} chars`,
    };
  }

  const canonicalUrl = extractCanonical($);

  // Reject if canonical points to a listing/category page
  if (canonicalUrl) {
    try {
      const canonPath = new URL(canonicalUrl).pathname;
      const parts = canonPath.split("/").filter(Boolean);
      if (parts.length <= 1) {
        return {
          article: null,
          rejectionReason: `canonical URL is a listing page: ${canonicalUrl}`,
        };
      }
    } catch {
      // Invalid canonical URL — keep going
    }
  }

  return {
    article: {
      title,
      imageUrl,
      publishedAt,
      rawText,
      canonicalUrl: canonicalUrl ?? url,
    },
    rejectionReason: null,
  };
}
