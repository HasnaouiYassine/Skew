/**
 * GET /api/oxylabs/schedules   — list stored schedules with source info
 * POST /api/oxylabs/schedules  — sync schedules from active sources to Oxylabs
 *
 * POST requires x-biasly-admin-secret header (AGENTS.md section 15).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createSchedule,
  listSchedules,
  deactivateSchedule,
} from "@/lib/scraping/scheduler";
import {
  getSchedulesWithSources,
  upsertSchedule,
  getAllSchedules,
  deleteSchedulesNotIn,
} from "@/lib/supabase/queries/schedules";
import { getActiveSources } from "@/lib/supabase/queries/sources";
import { insertLog } from "@/lib/supabase/queries/logs";

/* ─── GET — List ─────────────────────────────────────────── */

export async function GET() {
  try {
    const schedules = await getSchedulesWithSources();
    return NextResponse.json(schedules);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[GET /api/oxylabs/schedules] Error:", message);
    return NextResponse.json(
      { error: "Failed to list schedules", details: message },
      { status: 500 }
    );
  }
}

/* ─── POST — Sync ────────────────────────────────────────── */

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
  console.log("  SCHEDULE SYNC STARTED");
  console.log("═══════════════════════════════════════════════\n");

  const summary: {
    created: number;
    deactivated: number;
    total: number;
    errors: string[];
  } = { created: 0, deactivated: 0, total: 0, errors: [] };

  try {
    // 1. Fetch all active sources
    const sources = await getActiveSources();
    console.log(`  [sync] Found ${sources.length} active source(s)`);

    // 2. Deactivate all existing schedules on Oxylabs and clear the DB
    const existingSchedules = await getAllSchedules();
    const existingOxyIds = existingSchedules.map((s) => s.oxylabs_schedule_id);

    for (const schedule of existingSchedules) {
      try {
        await deactivateSchedule(schedule.oxylabs_schedule_id);
        console.log(`  [sync] Deactivated old schedule: ${schedule.oxylabs_schedule_id}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        summary.errors.push(`Failed to deactivate ${schedule.oxylabs_schedule_id}: ${msg}`);
        console.error(`  [sync] Failed to deactivate schedule ${schedule.oxylabs_schedule_id}: ${msg}`);
      }
    }

    // Delete all existing DB rows
    if (existingOxyIds.length > 0) {
      await deleteSchedulesNotIn([]);
      console.log(`  [sync] Cleared ${existingSchedules.length} existing schedule row(s)`);
    }

    // 3. Create fresh schedules for all active sources with the current cron
    const newOxyIds: string[] = [];

    for (const source of sources) {
      try {
        const { scheduleId } = await createSchedule(source.listing_url);
        await upsertSchedule(source.id, scheduleId);
        newOxyIds.push(scheduleId);
        summary.created++;
        console.log(`  [sync] ✓ Created schedule for ${source.name} → ${scheduleId}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        summary.errors.push(`Failed to create schedule for ${source.name}: ${msg}`);
        console.error(`  [sync] ✗ Failed to create schedule for ${source.name}: ${msg}`);
      }
    }

    // 4. Check for orphan schedules on Oxylabs (ones we didn't just create)
    try {
      const oxylabsIds = await listSchedules();
      const ourIds = new Set(newOxyIds);

      for (const oxyId of oxylabsIds) {
        if (!ourIds.has(oxyId)) {
          try {
            await deactivateSchedule(oxyId);
            summary.deactivated++;
            console.log(`  [sync] Deactivated orphan schedule: ${oxyId}`);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            summary.errors.push(`Failed to deactivate orphan ${oxyId}: ${msg}`);
            console.error(`  [sync] Failed to deactivate orphan ${oxyId}: ${msg}`);
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      summary.errors.push(`Orphan check failed: ${msg}`);
      console.error(`  [sync] Orphan check failed: ${msg}`);
    }

    summary.total = (await getAllSchedules()).length;

    console.log("\n═══════════════════════════════════════════════");
    console.log("  SCHEDULE SYNC COMPLETED");
    console.log(JSON.stringify(summary, null, 2));
    console.log("═══════════════════════════════════════════════\n");

    // Log to Supabase
    await insertLog({
      run_type: "schedule_sync",
      status: summary.errors.length > 0 ? "partial" : "completed",
      summary: summary as unknown as Record<string, unknown>,
    });

    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/oxylabs/schedules] Unhandled error:", message);

    await insertLog({
      run_type: "schedule_sync",
      status: "failed",
      summary: { error: message } as unknown as Record<string, unknown>,
    });

    return NextResponse.json(
      { error: "Schedule sync failed", details: message },
      { status: 500 }
    );
  }
}
