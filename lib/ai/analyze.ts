/**
 * Single-article AI analysis using Vercel AI SDK v7.
 * Uses generateText + Output.object() with a Zod schema.
 * Server-only — never import from client code.
 */

import { generateText, Output } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import type { ArticleRow } from "@/lib/supabase/types";
import type { ArticleAnalysisInsert } from "@/lib/supabase/types";

/* ─── Max chars sent to the model ───────────────────────── */
const MAX_TEXT_CHARS = 8000;

/* ─── Zod schema for AI output ──────────────────────────── */

const analysisSchema = z
  .object({
    summary: z.string().min(1),
    sentimentScore: z.number().min(-1).max(1),
    sentimentLabel: z.enum(["positive", "neutral", "negative"]),
    leftPercentage: z.number().int().min(0).max(100),
    centerPercentage: z.number().int().min(0).max(100),
    rightPercentage: z.number().int().min(0).max(100),
    politicalFramingLabel: z.enum([
      "left",
      "center",
      "right",
      "mixed",
      "unclear",
    ]),
    confidence: z.number().min(0).max(1),
    framingNotes: z.string().nullable(),
    loadedTerms: z.array(z.string()).nullable(),
    disclaimer: z.string().nullable(),
  })
  .refine(
    (data) =>
      data.leftPercentage + data.centerPercentage + data.rightPercentage ===
      100,
    {
      message:
        "leftPercentage + centerPercentage + rightPercentage must equal 100",
    }
  );

type AnalysisOutput = z.infer<typeof analysisSchema>;

/* ─── System prompt ──────────────────────────────────────── */

const SYSTEM_PROMPT = `You are a neutral political analyst. Given a news article, produce a structured analysis.

Rules:
- Write a concise, factual, neutral summary of the article (2-4 sentences). Do not editorialize.
- Estimate the article's political framing as percentages: leftPercentage, centerPercentage, rightPercentage. They MUST sum to exactly 100.
- Use only evidence from the article text — do not infer bias from the source name alone.
- Set politicalFramingLabel to the dominant framing:
  - Use "unclear" if confidence < 0.4 OR if no two percentages differ by more than 15 points.
  - Use "mixed" if multiple framings are nearly equal without a clear dominant.
  - Otherwise use "left", "center", or "right" matching the highest percentage.
- Set sentimentLabel based on the overall tone: "positive", "neutral", or "negative".
- Set sentimentScore from -1.0 (very negative) to 1.0 (very positive).
- Set confidence from 0.0 to 1.0 — how confident you are in the framing estimate.
- List any notably loaded, charged, or emotionally manipulative language in loadedTerms (empty array if none).
- framingNotes: brief explanation of your framing reasoning (1-2 sentences), or null.
- disclaimer: always set to "AI-estimated political framing — not an objective classification."

Output valid JSON matching the schema exactly. The percentages must sum to 100 — verify before responding.`;

/* ─── Main analysis function ─────────────────────────────── */

/**
 * Analyze a single article with GPT-4o.
 * Returns a validated ArticleAnalysisInsert or null if analysis fails.
 */
export async function analyzeArticle(
  article: ArticleRow
): Promise<ArticleAnalysisInsert | null> {
  // Truncate text to avoid token limits
  const textTruncated = article.raw_text.length > MAX_TEXT_CHARS;
  const text = textTruncated
    ? article.raw_text.slice(0, MAX_TEXT_CHARS) +
      "\n\n[Article text truncated for analysis]"
    : article.raw_text;

  const userPrompt = `Article Title: ${article.title}\n\nArticle Text:\n${text}`;

  let output: AnalysisOutput;

  try {
    const result = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      providerOptions: {
        groq: {
          structuredOutputs: false,
        },
      },
      output: Output.object({ schema: analysisSchema }),
      system: SYSTEM_PROMPT + "\n\nYou must return a valid JSON object matching the schema.",
      prompt: userPrompt,
    });

    output = result.output;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  [analyze] AI call failed for "${article.title.slice(0, 60)}": ${msg}`);
    return null;
  }

  // Derive bias_score = (right - left) / 100 per AGENTS.md section 19
  const biasScore =
    (output.rightPercentage - output.leftPercentage) / 100;

  return {
    article_id: article.id,
    summary: output.summary,
    sentiment_score: output.sentimentScore,
    sentiment_label: output.sentimentLabel,
    bias_score: biasScore,
    bias_label: output.politicalFramingLabel,
    left_percentage: output.leftPercentage,
    center_percentage: output.centerPercentage,
    right_percentage: output.rightPercentage,
    confidence: output.confidence,
    framing_notes: output.framingNotes,
    loaded_terms: output.loadedTerms,
    disclaimer: output.disclaimer ?? "AI-estimated political framing — not an objective classification.",
    model: "llama-3.3-70b-versatile",
  };
}
