/* ─── Row types (match Supabase table columns) ──────────── */

export interface SourceRow {
  id: string;
  name: string;
  listing_url: string;
  parser_strategy: string | null;
  is_active: boolean;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArticleRow {
  id: string;
  source_id: string;
  original_url: string;
  canonical_url: string | null;
  title: string;
  image_url: string;
  published_at: string;
  raw_text: string;
  scraped_at: string;
  analyzed_at: string | null;
  created_at: string;
}

export interface ArticleAnalysisRow {
  id: string;
  article_id: string;
  summary: string;
  sentiment_score: number;
  sentiment_label: string;
  bias_score: number;
  bias_label: string;
  left_percentage: number;
  center_percentage: number;
  right_percentage: number;
  confidence: number;
  framing_notes: string | null;
  loaded_terms: string[] | null;
  disclaimer: string | null;
  model: string;
  created_at: string;
}

export interface LogRow {
  id: string;
  run_type: string;
  status: string;
  summary: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
}

export interface OxylabsScheduleRow {
  id: string;
  source_id: string;
  oxylabs_schedule_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OxylabsScheduleRunRow {
  id: string;
  schedule_id: string;
  oxylabs_run_id: string;
  status: string;
  processed_at: string | null;
  created_at: string;
}

/* ─── Insert types (omit auto-generated fields) ─────────── */

export type SourceInsert = Omit<SourceRow, "id" | "created_at" | "updated_at">;

export type ArticleInsert = Omit<ArticleRow, "id" | "created_at" | "scraped_at" | "analyzed_at"> & {
  scraped_at?: string;
  analyzed_at?: string | null;
};

export type ArticleAnalysisInsert = Omit<
  ArticleAnalysisRow,
  "id" | "created_at"
>;

export type LogInsert = Omit<LogRow, "id" | "created_at" | "error"> & {
  error?: string | null;
};

export type OxylabsScheduleInsert = Omit<
  OxylabsScheduleRow,
  "id" | "created_at" | "updated_at"
>;

export type OxylabsScheduleRunInsert = Omit<
  OxylabsScheduleRunRow,
  "id" | "created_at"
> & {
  processed_at?: string | null;
};

/* ─── Joined types (for UI display) ─────────────────────── */

/** Article with its analysis and source, used for homepage cards and details page. */
export interface ArticleWithAnalysis {
  // article fields
  id: string;
  source_id: string;
  original_url: string;
  canonical_url: string | null;
  title: string;
  image_url: string;
  published_at: string;
  raw_text: string;
  scraped_at: string;
  analyzed_at: string | null;
  // source info
  source: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  // analysis (null if not yet analyzed)
  analysis: ArticleAnalysisRow | null;
}
