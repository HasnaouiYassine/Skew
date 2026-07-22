/**
 * POST /api/oxylabs/scheduled-results/process
 *
 * Manually process completed Oxylabs scheduled results.
 * Requires x-biasly-admin-secret header (AGENTS.md section 15).
 * Fetches completed job HTML from Oxylabs and runs the scrape-to-insert pipeline.
 */

import { NextRequest, NextResponse } from "next/server";
import { getScheduleRuns, getJobResult } from "@/lib/scraping/scheduler";
import { runScrapePipeline } from "@/lib/scraping/pipeline";
import {
  getSchedulesWithSources,
  insertScheduleRun,
  markRunProcessed,
  isRunProcessed,
} from "@/lib/supabase/queries/schedules";
import { insertLog } from "@/lib/supabase/queries/logs";

/* ─── Types ──────────────────────────────────────────────── */

interface ProcessResult {
  status: "completed" | "partial" | "failed";
  schedulesChecked: number;
  runsProcessed: number;
  prefetchedSources: number;
  pipelineResult: unknown;
  errors: string[];
}

/* ─── POST — Process ─────────────────────────────────────── */

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

  console.log("\n═══════════════════════════════════════════════");
  console.log("  SCHEDULED RESULTS PROCESSING STARTED");
  console.log("═══════════════════════════════════════════════\n");

  const result: ProcessResult = {
    status: "completed",
    schedulesChecked: 0,
    runsProcessed: 0,
    prefetchedSources: 0,
    pipelineResult: null,
    errors: [],
  };

  try {
    // 1. Fetch all active schedules with source info
    const schedules = await getSchedulesWithSources();
    const activeSchedules = schedules.filter(
      (s) => s.is_active && s.source.is_active
    );

    result.schedulesChecked = activeSchedules.length;
    console.log(`  [process] Found ${activeSchedules.length} active schedule(s)`);

    if (activeSchedules.length === 0) {
      console.log("  [process] No active schedules — nothing to process");
      return NextResponse.json(result);
    }

    // 2. Collect prefetched HTML from completed runs
    const prefetchedHtml: Record<string, string> = {};

    for (const schedule of activeSchedules) {
      try {
        console.log(`\n  [process] Checking schedule for ${schedule.source.name}...`);

        const runs = await getScheduleRuns(schedule.oxylabs_schedule_id);
        const doneRuns = runs.filter((r) =>
          r.jobs.some((j) => j.result_status === "done")
        );

        if (doneRuns.length === 0) {
          console.log(`  [process] No completed runs for ${schedule.source.name}`);
          continue;
        }

        // Get the latest run with done jobs
        const latestRun = doneRuns[0];
        const doneJobs = latestRun.jobs.filter(
          (j) => j.result_status === "done"
        );

        // Check if this run has already been processed
        const alreadyProcessed = await isRunProcessed(latestRun.run_id);
        if (alreadyProcessed) {
          console.log(`  [process] Run ${latestRun.run_id} already processed — skipping`);
          continue;
        }

        // Record the run before processing
        const runRecord = await insertScheduleRun(
          schedule.id,
          latestRun.run_id
        );

        // Fetch HTML from completed jobs
        for (const job of doneJobs) {
          try {
            const html = await getJobResult(job.id);
            prefetchedHtml[schedule.source.id] = html;
            result.prefetchedSources++;
            console.log(`  [process] Fetched result for job ${job.id} (${html.length} chars)`);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            result.errors.push(
              `Failed to fetch job ${job.id} for ${schedule.source.name}: ${msg}`
            );
            console.error(`  [process] Failed to fetch job ${job.id}: ${msg}`);
          }
        }

        // Mark run as processed even if some jobs failed
        await markRunProcessed(runRecord.id);
        result.runsProcessed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(
          `Failed to process schedule for ${schedule.source.name}: ${msg}`
        );
        console.error(`  [process] Schedule error for ${schedule.source.name}: ${msg}`);
      }
    }

    // 3. Run the scrape pipeline with prefetched HTML
    if (Object.keys(prefetchedHtml).length > 0) {
      console.log(
        `\n  [process] Running scrape pipeline with ${Object.keys(prefetchedHtml).length} prefetched source(s)...`
      );

      try {
        result.pipelineResult = await runScrapePipeline({
          prefetchedHtml,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`Scrape pipeline failed: ${msg}`);
        console.error(`  [process] Scrape pipeline error: ${msg}`);
      }
    } else {
      console.log("  [process] No prefetched HTML — skipping scrape pipeline");
    }

    if (result.errors.length > 0) {
      result.status = "partial";
    }

    console.log("\n═══════════════════════════════════════════════");
    console.log("  SCHEDULED RESULTS PROCESSING COMPLETED");
    console.log(JSON.stringify(result, null, 2));
    console.log("═══════════════════════════════════════════════\n");

    // Log to Supabase
    await insertLog({
      run_type: "scheduled_results_process",
      status: result.status,
      summary: result as unknown as Record<string, unknown>,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      "[POST /api/oxylabs/scheduled-results/process] Unhandled error:",
      message
    );

    await insertLog({
      run_type: "scheduled_results_process",
      status: "failed",
      summary: { error: message } as unknown as Record<string, unknown>,
    });

    return NextResponse.json(
      { error: "Scheduled results processing failed", details: message },
      { status: 500 }
    );
  }
}
