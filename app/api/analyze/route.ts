/**
 * POST /api/analyze
 *
 * AI analysis endpoint (AGENTS.md section 19).
 * Requires x-biasly-admin-secret header (section 15).
 * Analyzes all pending articles and returns a summary.
 */

import { NextRequest, NextResponse } from "next/server";
import { runAnalysisPipeline } from "@/lib/ai/pipeline";

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
  let body: { limit?: number; articleIds?: string[] } = {};
  try {
    body = await request.json();
  } catch {
    // No body or invalid JSON — use defaults
  }

  try {
    const result = await runAnalysisPipeline({
      limit: body.limit,
      articleIds: body.articleIds,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/analyze] Unhandled error:", message);
    return NextResponse.json(
      { error: "Analysis pipeline failed", details: message },
      { status: 500 }
    );
  }
}
