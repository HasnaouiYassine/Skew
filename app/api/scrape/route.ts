/**
 * POST /api/scrape
 *
 * Manual scraping endpoint (AGENTS.md section 16).
 * Requires x-biasly-admin-secret header (section 15).
 * Triggers the scrape-to-insert pipeline and returns the summary.
 */

import { NextRequest, NextResponse } from "next/server";
import { runScrapePipeline } from "@/lib/scraping/pipeline";

export async function POST(request: NextRequest) {
  // Verify admin secret (AGENTS.md section 15)
  const secret = request.headers.get("x-biasly-admin-secret");
  const expected = process.env.BIASLY_ADMIN_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json(
      { error: "Unauthorized — invalid or missing x-biasly-admin-secret header" },
      { status: 401 }
    );
  }

  // Parse optional body
  let body: { sourceIds?: string[]; perSourceLimit?: number } = {};
  try {
    body = await request.json();
  } catch {
    // No body or invalid JSON — use defaults
  }

  // Run the pipeline
  try {
    const result = await runScrapePipeline({
      sourceIds: body.sourceIds,
      perSourceLimit: body.perSourceLimit,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/scrape] Unhandled error:", message);
    return NextResponse.json(
      { error: "Scrape pipeline failed", details: message },
      { status: 500 }
    );
  }
}
