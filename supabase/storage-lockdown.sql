-- URGENT — run this. Storage was readable by anyone, signed in or not.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- WHAT WAS WRONG
--
-- Every storage.objects policy checked the BUCKET and nothing else:
--
--   CREATE POLICY "Allow brand-documents reads" ON storage.objects
--     FOR SELECT USING (bucket_id = 'brand-documents');
--
-- and each was granted to the role `public`, which in Postgres means every
-- role — including `anon`, the key that ships inside every page of the app.
--
-- So the check was "is this file in the bucket", never "is this file yours".
-- brand-documents is a private bucket, which stops the public CDN URL, but
-- private only governs that one path: the authenticated object endpoint is
-- governed by these policies, and they said yes to everybody.
--
-- MEASURED, NOT ASSUMED. With no account and no sign-in, using only the
-- publishable anon key, it was possible to list every brand's folder in
-- brand-documents and download another customer's 6 MB file. The same policies
-- allowed DELETE, so anyone could also have erased every logo and document in
-- the account.
--
-- supabase/private-buckets.sql said "brand-documents  private  already
-- correct, nothing to do". The bucket was correct; its policy was not, and
-- nothing had ever tested the policy from the outside.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- WHAT THIS DOES
--
--   brand-documents   read, write and delete become "your brand's folder,
--                     signed in". Contracts and specs live here. The app
--                     already signs these URLs with the user's own session
--                     (lib/signed-url.ts), so nothing in the app changes.
--
--   brand-assets      write and delete become "your brand's folder, signed
--   brand-images      in". READS STAY PUBLIC for now — the app renders logos,
--   brand-reference-  book pages and product images through public URLs in a
--   images            dozen places, and closing reads without first moving
--                     those to signed URLs would blank the interface.
--                     Closing the writes is what stops a stranger deleting
--                     every logo in the account, and it needs no app change.
--
-- The remaining step — making those three buckets private too — is
-- supabase/private-buckets.sql and supabase/brand_images.sql. Both carry a
-- DO NOT RUN YET line because four live rows sit under paths that are not
-- their brand's folder, and a prefix policy would hide them from their own
-- owner. That is a migration to do deliberately, not at speed. This file is
-- the part that can be run right now without breaking anything.
--
-- The path's first folder is the brand: `<brand_id>/<file>`. Both the slug
-- (brands.brand_id) and the UUID (brands.id) are accepted, because template
-- thumbnails use the UUID.

-- ── The old bucket-only policies ────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow brand-documents reads"   ON storage.objects;
DROP POLICY IF EXISTS "Allow brand-documents uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow brand-documents deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow brand-assets reads"      ON storage.objects;
DROP POLICY IF EXISTS "Allow brand-assets uploads"    ON storage.objects;
DROP POLICY IF EXISTS "Allow brand-assets updates"    ON storage.objects;
DROP POLICY IF EXISTS "Allow brand-assets deletes"    ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads"            ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads"          ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes"          ON storage.objects;

-- ── The ownership expression ────────────────────────────────────────────────
-- Written out in every policy rather than hidden behind a helper, because
-- lib/storage.test.ts requires every storage policy to name auth.uid() in its
-- own text — and that requirement is the reason this file exists. A policy you
-- have to follow into a function to check is how "bucket_id and nothing else"
-- survived review.
--
-- Both spellings of the brand are accepted: the slug (brands.brand_id) and the
-- UUID (brands.id), because template thumbnails are filed under the UUID.

-- ── brand-documents: yours only, in every direction ─────────────────────────
CREATE POLICY "brand_documents_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'brand-documents' AND (
      (storage.foldername(name))[1] IN (
        SELECT b.brand_id FROM brands b WHERE b.user_id = auth.uid()
        UNION ALL
        SELECT b.id::text  FROM brands b WHERE b.user_id = auth.uid()
      )
    ));

CREATE POLICY "brand_documents_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brand-documents' AND (
      (storage.foldername(name))[1] IN (
        SELECT b.brand_id FROM brands b WHERE b.user_id = auth.uid()
        UNION ALL
        SELECT b.id::text  FROM brands b WHERE b.user_id = auth.uid()
      )
    ));

CREATE POLICY "brand_documents_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'brand-documents' AND (
      (storage.foldername(name))[1] IN (
        SELECT b.brand_id FROM brands b WHERE b.user_id = auth.uid()
        UNION ALL
        SELECT b.id::text  FROM brands b WHERE b.user_id = auth.uid()
      )
    ))
  WITH CHECK (bucket_id = 'brand-documents' AND (
      (storage.foldername(name))[1] IN (
        SELECT b.brand_id FROM brands b WHERE b.user_id = auth.uid()
        UNION ALL
        SELECT b.id::text  FROM brands b WHERE b.user_id = auth.uid()
      )
    ));

CREATE POLICY "brand_documents_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'brand-documents' AND (
      (storage.foldername(name))[1] IN (
        SELECT b.brand_id FROM brands b WHERE b.user_id = auth.uid()
        UNION ALL
        SELECT b.id::text  FROM brands b WHERE b.user_id = auth.uid()
      )
    ));

-- ── brand-assets, brand-images, brand-reference-images ──────────────────────
-- These three are public buckets today, and the app renders logos, book pages
-- and product images through public URLs in a dozen places. A public URL is
-- served from /object/public/… and does not consult these policies at all, so
-- dropping the old "Allow public reads" does not blank the interface — the
-- bucket's own public flag is what keeps those URLs working.
--
-- What the old policies did add was WRITE and DELETE for everybody, including
-- anonymous. That is what let a stranger overwrite or erase every logo in the
-- account, and it is closed here.
--
-- The SELECT policy below is for signed-in owners reading their own files
-- through the authenticated endpoint (downloads, signed URLs). It does not
-- affect the public URLs.
--
-- STILL OPEN AFTER THIS FILE: anyone holding a public URL can read these three
-- buckets. Closing that is supabase/private-buckets.sql and
-- supabase/brand_images.sql, both of which carry a DO NOT RUN YET line because
-- four live rows sit under paths that are not their brand's folder and would
-- disappear from their own owner. Fix those paths
-- (scripts/storage-remediate.mjs), then run them.

CREATE POLICY "public_buckets_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('brand-assets', 'brand-images', 'brand-reference-images')
    AND (
      (storage.foldername(name))[1] IN (
        SELECT b.brand_id FROM brands b WHERE b.user_id = auth.uid()
        UNION ALL
        SELECT b.id::text  FROM brands b WHERE b.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "public_buckets_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('brand-assets', 'brand-images', 'brand-reference-images')
    AND (
      (storage.foldername(name))[1] IN (
        SELECT b.brand_id FROM brands b WHERE b.user_id = auth.uid()
        UNION ALL
        SELECT b.id::text  FROM brands b WHERE b.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "public_buckets_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('brand-assets', 'brand-images', 'brand-reference-images')
    AND (
      (storage.foldername(name))[1] IN (
        SELECT b.brand_id FROM brands b WHERE b.user_id = auth.uid()
        UNION ALL
        SELECT b.id::text  FROM brands b WHERE b.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id IN ('brand-assets', 'brand-images', 'brand-reference-images')
    AND (
      (storage.foldername(name))[1] IN (
        SELECT b.brand_id FROM brands b WHERE b.user_id = auth.uid()
        UNION ALL
        SELECT b.id::text  FROM brands b WHERE b.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "public_buckets_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('brand-assets', 'brand-images', 'brand-reference-images')
    AND (
      (storage.foldername(name))[1] IN (
        SELECT b.brand_id FROM brands b WHERE b.user_id = auth.uid()
        UNION ALL
        SELECT b.id::text  FROM brands b WHERE b.user_id = auth.uid()
      )
    )
  );
