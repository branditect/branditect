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
--
-- ─────────────────────────────────────────────────────────────────────────────
-- ⚠ 2026-09-08 — THIS FILE USED TO RE-OPEN THE TABLE TO EVERY SIGNED-IN USER.
--
-- It contained:
--
--   CREATE POLICY "Allow all for authenticated users" ON brand_images
--     FOR ALL USING (true) WITH CHECK (true);
--
-- The live database no longer has that policy — commit 082c26f closed it, and
-- scripts/cross-tenant.mjs proves it by signing in as one user and failing to
-- read another's rows. But the file that recreates it was still sitting here.
--
-- PERMISSIVE policies are OR'd. Re-running the old version of this file would
-- have re-opened brand_images to every signed-in user in a single statement,
-- with the correct scoped policy still in place beside it, looking fine. A
-- policy-reading audit would have passed. That is exactly the failure mode that
-- took three attempts to find last time.
--
-- The policy below is now the scoped one. Do not replace it with USING (true).
-- ─────────────────────────────────────────────────────────────────────────────

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

ALTER TABLE brand_images ENABLE ROW LEVEL SECURITY;

-- Drop by discovery, not by name. Same approach as close-rls-3.sql: a policy
-- someone added by hand in the dashboard has a name this file cannot guess, and
-- a permissive policy left behind is OR'd with the one below and wins.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'brand_images'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.brand_images', r.policyname);
  END LOOP;
END $$;

CREATE POLICY brand_images_own_brand ON brand_images
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));

-- Everything above this line is safe to run today. It removes an open policy
-- and replaces it with a scoped one; no data moves and nothing that works now
-- stops working.

-- ═════════════════════════════════════════════════════════════════════════════
-- BELOW THIS LINE: DO NOT RUN YET.
--
-- This is the storage half of branditect-ui/spec/security-hardening.md part 2,
-- and running it before the storage_path backfill breaks every image in the
-- app at once, for everyone.
--
-- Why: the bucket is public today, and brand_images.file_url stores the full
-- public URL. A signed URL expires, so it cannot be stored. Making the bucket
-- private turns every stored file_url into a dead link in one statement, and
-- the only way back is making it public again.
--
-- The order that works:
--   1. Add storage_path and backfill it by parsing file_url.
--   2. Prove every row has a non-NULL storage_path AND that every path resolves
--      to an object that actually exists. That assertion is the merge blocker.
--   3. Ship the app code that reads storage_path and signs at read time.
--   4. Only then run what follows.
--
-- The same treatment is needed for brand-assets and brand-logos. Doing only
-- brand-images leaves uploaded brand documents and logos public.
-- ═════════════════════════════════════════════════════════════════════════════

-- 1 · The column. Safe on its own — nothing reads it yet.
ALTER TABLE brand_images ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- 2 · Backfill. The path is everything after the bucket name in the public URL,
--     which is exactly the parse components/image-library.tsx:222 already does
--     for deletion. Uploads write `${brand_id}/${file}`; file-library writes
--     `${brand_id}/${category}/${file}`. Both keep brand_id as the first segment.
UPDATE brand_images
   SET storage_path = split_part(file_url, '/brand-images/', 2)
 WHERE storage_path IS NULL
   AND file_url LIKE '%/brand-images/%';

-- 3 · The assertion. Refuses to go further if any row failed to parse, or if a
--     parsed path does not start with the row's own brand_id — which would mean
--     the URL and the row disagree about who owns the file.
DO $$
DECLARE bad integer;
BEGIN
  SELECT count(*) INTO bad FROM brand_images
   WHERE storage_path IS NULL OR storage_path = '';
  IF bad > 0 THEN
    RAISE EXCEPTION 'aborting: % image row(s) have no storage_path. Making the bucket private would break them.', bad;
  END IF;

  SELECT count(*) INTO bad FROM brand_images
   WHERE split_part(storage_path, '/', 1) <> brand_id;
  IF bad > 0 THEN
    RAISE EXCEPTION 'aborting: % image row(s) whose path prefix is not their brand_id. The prefix policy below would hide them.', bad;
  END IF;
END $$;

-- 4 · Private, and scoped by the first path segment.
UPDATE storage.buckets SET public = false WHERE id = 'brand-images';

DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads"   ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

-- storage.foldername(name) splits the object key on '/'. Element 1 is the
-- brand_id, because that is how every upload path in this codebase is built.
CREATE POLICY brand_images_read_own ON storage.objects
  FOR SELECT USING (
    bucket_id = 'brand-images'
    AND (storage.foldername(name))[1] IN (SELECT brand_id FROM brands WHERE user_id = auth.uid())
  );

CREATE POLICY brand_images_write_own ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'brand-images'
    AND (storage.foldername(name))[1] IN (SELECT brand_id FROM brands WHERE user_id = auth.uid())
  );

CREATE POLICY brand_images_delete_own ON storage.objects
  FOR DELETE USING (
    bucket_id = 'brand-images'
    AND (storage.foldername(name))[1] IN (SELECT brand_id FROM brands WHERE user_id = auth.uid())
  );
