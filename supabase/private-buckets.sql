-- Queue item 3 / security-hardening part 2: the rest of the buckets.
--
-- NOT RUN. Rule 1 — this is written, reported, and left for Saara.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- WHAT IS ACTUALLY THERE, measured rather than taken from the spec
--
--   brand-images            PUBLIC    114 rows + 10 product images point at it
--   brand-assets            PUBLIC    43 book pages, 15 logos, 5 thumbnails,
--                                     3 brand logo_urls, 1 guideline
--   brand-reference-images  PUBLIC    referenced nowhere in the code
--   brand-documents         private   already correct, nothing to do
--
-- The spec names three buckets: brand-images, brand-assets and brand-logos.
-- **brand-logos does not exist.** `app/onboarding/page.tsx:148` uploads a
-- founder's logo to it and discards the error, so that upload has been failing
-- silently; the logos that do exist came through /api/brand-assets/upload,
-- which writes to brand-assets. Creating the bucket is not the fix — deleting
-- the dead upload path is — and that is app code, not this file.
--
-- **brand-reference-images is public and in no spec.** It is covered below
-- rather than left open because a bucket nobody is watching is exactly the one
-- that keeps being public.
--
-- The brand-images half lives in brand_images.sql, below its own DO NOT RUN
-- line, and is not repeated here. Two files creating the same policy is the
-- drift this codebase keeps paying for.
-- ═════════════════════════════════════════════════════════════════════════════

-- ── 1 · The path columns ────────────────────────────────────────────────────
-- Safe on their own: nothing reads them until the app code ships, and the app
-- code falls back to file_url when the column is NULL.

ALTER TABLE catalog_products  ADD COLUMN IF NOT EXISTS image_storage_path     TEXT;
ALTER TABLE brand_book_pages  ADD COLUMN IF NOT EXISTS storage_path           TEXT;
ALTER TABLE brand_logos       ADD COLUMN IF NOT EXISTS storage_path           TEXT;
ALTER TABLE brands            ADD COLUMN IF NOT EXISTS logo_storage_path      TEXT;
ALTER TABLE brand_visual      ADD COLUMN IF NOT EXISTS guideline_storage_path TEXT;
-- brand_templates.thumbnail_path already exists and is used for deletion.

-- ── 2 · Backfill ────────────────────────────────────────────────────────────
-- The path is everything after the bucket name in the public URL, which is the
-- parse lib/storage-paths.ts does and the one image-library.tsx has always
-- done for deletion. `split_part(url, '/<bucket>/', 2)` is that parse in SQL.
--
-- No query strings appear in these columns today (the templates screen appends
-- ?t= for display only), but split_part would carry one into the object key,
-- so each backfill trims at '?'.

UPDATE catalog_products
   SET image_storage_path = split_part(split_part(image_url, '/brand-images/', 2), '?', 1)
 WHERE image_storage_path IS NULL AND image_url LIKE '%/brand-images/%';

UPDATE brand_book_pages
   SET storage_path = split_part(split_part(file_url, '/brand-assets/', 2), '?', 1)
 WHERE storage_path IS NULL AND file_url LIKE '%/brand-assets/%';

UPDATE brand_logos
   SET storage_path = split_part(split_part(file_url, '/brand-assets/', 2), '?', 1)
 WHERE storage_path IS NULL AND file_url LIKE '%/brand-assets/%';

UPDATE brand_templates
   SET thumbnail_path = split_part(split_part(thumbnail_url, '/brand-assets/', 2), '?', 1)
 WHERE thumbnail_path IS NULL AND thumbnail_url LIKE '%/brand-assets/%';

UPDATE brands
   SET logo_storage_path = split_part(split_part(logo_url, '/brand-assets/', 2), '?', 1)
 WHERE logo_storage_path IS NULL AND logo_url LIKE '%/brand-assets/%';

UPDATE brand_visual
   SET guideline_storage_path = split_part(split_part(guideline_url, '/brand-assets/', 2), '?', 1)
 WHERE guideline_storage_path IS NULL AND guideline_url LIKE '%/brand-assets/%';

-- ── 3 · The assertion, which is the merge blocker ───────────────────────────
-- A row whose URL did not parse is a file that disappears the moment the
-- bucket goes private. This refuses to continue rather than leaving it to be
-- noticed by a user.
--
-- It cannot check that the object exists — SQL cannot see the storage backend.
-- `npm run storage:audit` does that part, against the live buckets, and it is
-- the half that has to be green before anything below section 4 is run.

DO $$
DECLARE bad integer;
BEGIN
  SELECT count(*) INTO bad FROM catalog_products
   WHERE image_url LIKE '%/brand-images/%' AND coalesce(image_storage_path, '') = '';
  IF bad > 0 THEN RAISE EXCEPTION 'aborting: % product image(s) have no path', bad; END IF;

  SELECT count(*) INTO bad FROM brand_book_pages
   WHERE file_url LIKE '%/brand-assets/%' AND coalesce(storage_path, '') = '';
  IF bad > 0 THEN RAISE EXCEPTION 'aborting: % brand book page(s) have no path', bad; END IF;

  SELECT count(*) INTO bad FROM brand_logos
   WHERE file_url LIKE '%/brand-assets/%' AND coalesce(storage_path, '') = '';
  IF bad > 0 THEN RAISE EXCEPTION 'aborting: % logo(s) have no path', bad; END IF;

  SELECT count(*) INTO bad FROM brand_templates
   WHERE thumbnail_url LIKE '%/brand-assets/%' AND coalesce(thumbnail_path, '') = '';
  IF bad > 0 THEN RAISE EXCEPTION 'aborting: % template thumbnail(s) have no path', bad; END IF;

  SELECT count(*) INTO bad FROM brands
   WHERE logo_url LIKE '%/brand-assets/%' AND coalesce(logo_storage_path, '') = '';
  IF bad > 0 THEN RAISE EXCEPTION 'aborting: % brand logo(s) have no path', bad; END IF;

  SELECT count(*) INTO bad FROM brand_visual
   WHERE guideline_url LIKE '%/brand-assets/%' AND coalesce(guideline_storage_path, '') = '';
  IF bad > 0 THEN RAISE EXCEPTION 'aborting: % guideline(s) have no path', bad; END IF;
END $$;

-- ═════════════════════════════════════════════════════════════════════════════
-- BELOW THIS LINE: DO NOT RUN YET.
--
-- Everything above adds columns and fills them in. Nothing reads them yet and
-- nothing that works today stops working. Everything below makes the buckets
-- private, and running it while any stored URL still fails to resolve breaks
-- every image in the app at once, for everyone, with no way back except making
-- the buckets public again.
--
-- The storage_path columns above must be non-NULL on every row AND every path
-- must resolve to an object that exists. `npm run storage:audit` asserts both
-- against the live buckets and exits non-zero when it does not hold.
--
-- IT DOES NOT HOLD TODAY. Four rows are stored under a path that is neither
-- their brand's slug nor its UUID, so the prefix policies below would hide
-- them from their own owner:
--
--   brand_images   x2  vetra/web/...              (the slug before the suffix)
--   brands.logo_url    logos/primary-logo-...     (a shared namespace)
--   brand_visual       guidelines/small Sorbify.. (a shared namespace)
--
-- Those four objects have to be copied to a brand-prefixed path and their rows
-- updated first. scripts/storage-remediate.mjs does exactly that and has NOT
-- been run — it writes to production storage, which rule 2 puts out of reach
-- here.
-- ═════════════════════════════════════════════════════════════════════════════

-- ── 4 · Private ─────────────────────────────────────────────────────────────
UPDATE storage.buckets SET public = false
 WHERE id IN ('brand-assets', 'brand-reference-images');
-- brand-images is flipped by supabase/brand_images.sql, below its own line.
-- brand-documents is already private.

-- ── 5 · Policies on storage.objects ─────────────────────────────────────────
-- storage.foldername(name) splits the object key on '/'. Element 1 is the
-- brand, because that is how every upload path in this codebase is built.
--
-- BOTH KEYS ARE ACCEPTED, and that is not leniency. brand_templates uploaded
-- thumbnails under brands.id (the UUID) while every other upload used
-- brands.brand_id (the TEXT slug). That same confusion is what made templates
-- render nowhere until brand-templates-key.sql fixed the column, and the
-- objects are still on disk under the UUID. A policy that accepted only the
-- slug would hide five thumbnails on the day the bucket went private.

DROP POLICY IF EXISTS "Allow public uploads"       ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads"         ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes"       ON storage.objects;
-- The four from brand_visual.sql and the four from brands.sql. Dropped here as
-- well as there, because whichever file runs last is the one that decides, and
-- an unscoped policy beside a scoped one defeats it.
DROP POLICY IF EXISTS "Allow brand-assets uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow brand-assets reads"   ON storage.objects;
DROP POLICY IF EXISTS "Allow brand-assets updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow brand-assets deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow logo uploads"         ON storage.objects;
DROP POLICY IF EXISTS "Allow logo reads"           ON storage.objects;
DROP POLICY IF EXISTS "Allow strategy uploads"     ON storage.objects;
DROP POLICY IF EXISTS "Allow strategy reads"       ON storage.objects;
DROP POLICY IF EXISTS brand_assets_read_own   ON storage.objects;
DROP POLICY IF EXISTS brand_assets_write_own  ON storage.objects;
DROP POLICY IF EXISTS brand_assets_delete_own ON storage.objects;

CREATE POLICY brand_assets_read_own ON storage.objects
  FOR SELECT USING (
    bucket_id IN ('brand-assets', 'brand-reference-images')
    AND (storage.foldername(name))[1] IN (
      SELECT brand_id FROM brands WHERE user_id = auth.uid()
      UNION ALL
      SELECT id::text  FROM brands WHERE user_id = auth.uid())
  );

CREATE POLICY brand_assets_write_own ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('brand-assets', 'brand-reference-images')
    AND (storage.foldername(name))[1] IN (
      SELECT brand_id FROM brands WHERE user_id = auth.uid()
      UNION ALL
      SELECT id::text  FROM brands WHERE user_id = auth.uid())
  );

CREATE POLICY brand_assets_delete_own ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('brand-assets', 'brand-reference-images')
    AND (storage.foldername(name))[1] IN (
      SELECT brand_id FROM brands WHERE user_id = auth.uid()
      UNION ALL
      SELECT id::text  FROM brands WHERE user_id = auth.uid())
  );
