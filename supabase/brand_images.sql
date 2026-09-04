-- ⚠ THIS FILE NO LONGER DESCRIBES PRODUCTION. Read
-- supabase/brand-images-categories.sql before trusting anything below.
--
-- The category CHECK constraint in this file lists six values. The live
-- constraint accepts ten: the four media types — video, audio, graphic, web —
-- were added by hand, outside these migration files, and nothing here records
-- it. Probed on 2026-09-03, one attempted insert per value.
--
-- That gap is what made finding 0 of branditect-ui/spec/knowledge-images.md
-- read as a live bug. This file said four of the five media tabs must reject
-- every upload; the database disagreed. Two people read the same file and drew
-- the same wrong conclusion from it.
--
-- Do not widen the constraint by pasting a new list over the old one. Read the
-- live definition first —
--   SELECT pg_get_constraintdef(oid) FROM pg_constraint
--   WHERE conname = 'brand_images_category_check';
-- — and union with what it returns, or you will drop a value that live rows
-- are using.

-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

CREATE TABLE IF NOT EXISTS brand_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT NOT NULL DEFAULT 'vetra',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'brand' CHECK (category IN ('social', 'event', 'product', 'campaign', 'brand', 'ai-generated')),
  format TEXT NOT NULL DEFAULT 'other' CHECK (format IN ('square', 'story', 'landscape', 'portrait', 'other')),
  campaign_name TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE brand_images ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (simple policy for now)
CREATE POLICY "Allow all for authenticated users" ON brand_images
  FOR ALL USING (true) WITH CHECK (true);

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-images', 'brand-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: allow uploads
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'brand-images');

CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT USING (bucket_id = 'brand-images');

CREATE POLICY "Allow public deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'brand-images');
