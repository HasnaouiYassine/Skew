-- ============================================================
-- Skew News — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. sources
create table if not exists public.sources (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  listing_url text not null,
  parser_strategy text,
  is_active   boolean not null default true,
  logo_url    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.sources enable row level security;

-- 2. articles
create table if not exists public.articles (
  id            uuid primary key default gen_random_uuid(),
  source_id     uuid not null references public.sources(id) on delete cascade,
  original_url  text unique not null,
  canonical_url text,
  title         text not null,
  image_url     text not null,
  published_at  timestamptz not null,
  raw_text      text not null,
  scraped_at    timestamptz not null default now(),
  analyzed_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_articles_source_id on public.articles(source_id);
create index if not exists idx_articles_analyzed_at on public.articles(analyzed_at);

alter table public.articles enable row level security;

-- 3. article_analyses
create table if not exists public.article_analyses (
  id                uuid primary key default gen_random_uuid(),
  article_id        uuid unique not null references public.articles(id) on delete cascade,
  summary           text not null,
  sentiment_score   real not null,
  sentiment_label   text not null,
  bias_score        real not null,
  bias_label        text not null,
  left_percentage   smallint not null,
  center_percentage smallint not null,
  right_percentage  smallint not null,
  confidence        real not null,
  framing_notes     text,
  loaded_terms      text[],
  disclaimer        text,
  model             text not null,
  created_at        timestamptz not null default now()
);

alter table public.article_analyses enable row level security;

-- 4. logs
create table if not exists public.logs (
  id         uuid primary key default gen_random_uuid(),
  run_type   text not null,
  status     text not null,
  summary    jsonb,
  error      text,
  created_at timestamptz not null default now()
);

alter table public.logs enable row level security;

-- 5. oxylabs_schedules
create table if not exists public.oxylabs_schedules (
  id                   uuid primary key default gen_random_uuid(),
  source_id            uuid unique not null references public.sources(id) on delete cascade,
  oxylabs_schedule_id  text not null,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.oxylabs_schedules enable row level security;

-- 6. oxylabs_schedule_runs
create table if not exists public.oxylabs_schedule_runs (
  id              uuid primary key default gen_random_uuid(),
  schedule_id     uuid not null references public.oxylabs_schedules(id) on delete cascade,
  oxylabs_run_id  text not null,
  status          text not null default 'pending',
  processed_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_oxylabs_schedule_runs_schedule_id
  on public.oxylabs_schedule_runs(schedule_id);

alter table public.oxylabs_schedule_runs enable row level security;
