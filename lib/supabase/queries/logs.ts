import { supabaseAdmin } from "@/lib/supabase/client";
import type { LogInsert, LogRow } from "@/lib/supabase/types";

/** Insert a log entry. */
export async function insertLog(log: LogInsert): Promise<LogRow> {
  const { data, error } = await supabaseAdmin
    .from("logs")
    .insert(log)
    .select()
    .single();

  if (error) throw new Error(`insertLog failed: ${error.message}`);
  return data;
}

/** Fetch recent log entries. */
export async function getRecentLogs(limit = 50): Promise<LogRow[]> {
  const { data, error } = await supabaseAdmin
    .from("logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getRecentLogs failed: ${error.message}`);
  return data ?? [];
}
