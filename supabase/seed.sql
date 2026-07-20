-- ============================================================
-- Skew News — Seed Data (Sources)
-- Run this AFTER schema.sql in Supabase Dashboard → SQL Editor
-- ============================================================

insert into public.sources (name, listing_url, is_active) values
  ('Reuters',      'https://www.reuters.com',          true),
  ('BBC News',     'https://www.bbc.com/news',         true),
  ('CNN',          'https://www.cnn.com',               true),
  ('Fox News',     'https://www.foxnews.com',           true),
  ('NPR',          'https://www.npr.org',               true),
  ('The Guardian', 'https://www.theguardian.com/us',    true)
on conflict do nothing;
