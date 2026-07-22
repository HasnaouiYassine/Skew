/**
 * GET /api/cron/pipeline
 *
 * Vercel Cron pipeline (AGENTS.md section 18).
 * Fires at :15 past every hour (configured in vercel.json).
 *
 * Chains:
 *   1. Oxylabs scheduled results processing
 *   2. AI analysis on all pending articles
 *
 * Protected by CRON_SECRET — injected by Vercel automatically.
 * In local development, the secret check is skipped so the route
 * can be tested manually. Do NOT add CRON_SECRET to .env.local.
 */

import { NextRequest, NextResponse } from "next/server";
import { getScheduleRuns, getJobResult } from "@/lib/scraping/scheduler";
import { runScrapePipeline } from "@/lib/scraping/pipeline";
import { runAnalysisPipeline } from "@/lib/ai/pipeline";
import {
  getSchedulesWithSources,
  insertScheduleRun,
  markRunProcessed,
  isRunProcessed,
} from "@/lib/supabase/queries/schedules";
import { insertLog } from "@/lib/supabase/queries/logs";

/* ─── GET — Cron trigger ─────────────────────────────────── */

export async function GET(request: NextRequest) {
  // CRON_SECRET check — skip in development
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev) {
    const cronSecret = request.headers.get("CRON_SECRET");
    const expected = process.env.CRON_SECRET;

    if (!expected || cronSecret !== expected) {
      return NextResponse.json(
        { error: "Unauthorized — invalid or missing CRON_SECRET" },
        { status: 401 }
      );
    }
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log("  CRON PIPELINE TRIGGERED");
  console.log("═══════════════════════════════════════════════\n");

  const combined: {
    schedulerProcessing: Record<string, unknown> | null;
    analysis: Record<string, unknown> | null;
    schedulerError: string | null;
    analysisError: string | null;
  } = {
    schedulerProcessing: null,
    analysis: null,
    schedulerError: null,
    analysisError: null,
  };

  /* ── Step 1: Process scheduled results ──────────────────── */

  console.log("\n── Step 1: Processing scheduled results ────────\n");

  try {
    const schedules = await getSchedulesWithSources();
    const activeSchedules = schedules.filter(
      (s) => s.is_active && s.source.is_active
    );

    console.log(`  [cron] Found ${activeSchedules.length} active schedule(s)`);

    const prefetchedHtml: Record<string, string> = {};

    for (const schedule of activeSchedules) {
      try {
        console.log(`\n  [cron] Checking ${schedule.source.name}...`);
        const runs = await getScheduleRuns(schedule.oxylabs_schedule_id);
        const doneRuns = runs.filter((r) =>
          r.jobs.some((j) => j.result_status === "done")
        );

        if (doneRuns.length === 0) continue;

        const latestRun = doneRuns[0];
        const doneJobs = latestRun.jobs.filter(
          (j) => j.result_status === "done"
        );

        const alreadyProcessed = await isRunProcessed(latestRun.run_id);
        if (alreadyProcessed) {
          console.log(`  [cron] Run ${latestRun.run_id} already processed`);
          continue;
        }

        const runRecord = await insertScheduleRun(
          schedule.id,
          latestRun.run_id
        );

        for (const job of doneJobs) {
          try {
            const html = await getJobResult(job.id);
            prefetchedHtml[schedule.source.id] = html;
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`  [cron] Failed to fetch job ${job.id}: ${msg}`);
          }
        }

        await markRunProcessed(runRecord.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  [cron] Error processing ${schedule.source.name}: ${msg}`);
      }
    }

    if (Object.keys(prefetchedHtml).length > 0) {
      combined.schedulerProcessing = (await runScrapePipeline({
        prefetchedHtml,
      })) as unknown as Record<string, unknown>;
    } else {
      combined.schedulerProcessing = { skipped: true, reason: "No prefetched HTML" };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    combined.schedulerError = msg;
    console.error(`  [cron] Scheduler processing error: ${msg}`);
  }

  /* ── Step 2: Run AI analysis ────────────────────────────── */
  /*    Runs even if step 1 failed (AGENTS.md section 18).     */

  console.log("\n── Step 2: Running AI analysis ──────────────────\n");

  try {
    combined.analysis = (await runAnalysisPipeline()) as unknown as Record<
      string,
      unknown
    >;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    combined.analysisError = msg;
    console.error(`  [cron] Analysis error: ${msg}`);
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log("  CRON PIPELINE COMPLETED");
  console.log(JSON.stringify(combined, null, 2));
  console.log("═══════════════════════════════════════════════\n");

  // Log to Supabase
  await insertLog({
    run_type: "cron_pipeline",
    status:
      combined.schedulerError || combined.analysisError ? "partial" : "completed",
    summary: combined as unknown as Record<string, unknown>,
  });

  return NextResponse.json(combined);
}
