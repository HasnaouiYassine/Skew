import { supabaseAdmin } from "@/lib/supabase/client";
import type { SourceRow } from "@/lib/supabase/types";

/** Fetch all active sources. */
export async function getActiveSources(): Promise<SourceRow[]> {
  const { data, error } = await supabaseAdmin
    .from("sources")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(`getActiveSources failed: ${error.message}`);
  return data ?? [];
}

/** Fetch a single source by ID. */
export async function getSourceById(
  id: string
): Promise<SourceRow | null> {
  const { data, error } = await supabaseAdmin
    .from("sources")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getSourceById failed: ${error.message}`);
  return data;
}
