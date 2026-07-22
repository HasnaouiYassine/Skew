import { supabaseAdmin } from "@/lib/supabase/client";
import type {
  OxylabsScheduleRow,
  OxylabsScheduleRunRow,
  SourceRow,
} from "@/lib/supabase/types";

/* ─── Types ──────────────────────────────────────────────── */

export interface ScheduleWithSource extends OxylabsScheduleRow {
  source: Pick<SourceRow, "id" | "name" | "listing_url" | "is_active">;
}

/* ─── Schedule queries ───────────────────────────────────── */

/** Fetch all stored schedule rows. */
export async function getAllSchedules(): Promise<OxylabsScheduleRow[]> {
  const { data, error } = await supabaseAdmin
    .from("oxylabs_schedules")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getAllSchedules failed: ${error.message}`);
  return data ?? [];
}

/** Fetch schedules joined with their source info. */
export async function getSchedulesWithSources(): Promise<
  ScheduleWithSource[]
> {
  const { data, error } = await supabaseAdmin
    .from("oxylabs_schedules")
    .select(
      `
      *,
      source:sources!oxylabs_schedules_source_id_fkey ( id, name, listing_url, is_active )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`getSchedulesWithSources failed: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    ...row,
    source: Array.isArray(row.source) ? row.source[0] : row.source,
  }));
}

/** Upsert a schedule row (unique on source_id). */
export async function upsertSchedule(
  sourceId: string,
  oxylabsScheduleId: string
): Promise<OxylabsScheduleRow> {
  const { data, error } = await supabaseAdmin
    .from("oxylabs_schedules")
    .upsert(
      {
        source_id: sourceId,
        oxylabs_schedule_id: oxylabsScheduleId,
      },
      { onConflict: "source_id" }
    )
    .select()
    .single();

  if (error) throw new Error(`upsertSchedule failed: ${error.message}`);
  return data;
}

/**
 * Delete schedule rows whose oxylabs_schedule_id is NOT in the given set.
 * Used for orphan cleanup.
 */
export async function deleteSchedulesNotIn(
  keepIds: string[]
): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("oxylabs_schedules")
    .delete()
    .not("oxylabs_schedule_id", "in", `(${keepIds.join(",")})`)
    .select("id");

  if (error) throw new Error(`deleteSchedulesNotIn failed: ${error.message}`);
  return data?.length ?? 0;
}

/* ─── Schedule run queries ───────────────────────────────── */

/** Fetch all schedule runs for a given schedule. */
export async function getRunsForSchedule(
  scheduleId: string
): Promise<OxylabsScheduleRunRow[]> {
  const { data, error } = await supabaseAdmin
    .from("oxylabs_schedule_runs")
    .select("*")
    .eq("schedule_id", scheduleId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getRunsForSchedule failed: ${error.message}`);
  return data ?? [];
}

/** Insert a schedule run record. */
export async function insertScheduleRun(
  scheduleId: string,
  oxylabsRunId: string
): Promise<OxylabsScheduleRunRow> {
  const { data, error } = await supabaseAdmin
    .from("oxylabs_schedule_runs")
    .insert({
      schedule_id: scheduleId,
      oxylabs_run_id: oxylabsRunId,
      status: "processing",
    })
    .select()
    .single();

  if (error) throw new Error(`insertScheduleRun failed: ${error.message}`);
  return data;
}

/** Mark a schedule run as processed. */
export async function markRunProcessed(runId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("oxylabs_schedule_runs")
    .update({ status: "processed", processed_at: new Date().toISOString() })
    .eq("id", runId);

  if (error) throw new Error(`markRunProcessed failed: ${error.message}`);
}

/** Check if an Oxylabs run ID has already been processed. */
export async function isRunProcessed(
  oxylabsRunId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("oxylabs_schedule_runs")
    .select("id")
    .eq("oxylabs_run_id", oxylabsRunId)
    .maybeSingle();

  if (error) throw new Error(`isRunProcessed failed: ${error.message}`);
  return !!data;
}
