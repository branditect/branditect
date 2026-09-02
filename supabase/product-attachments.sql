-- Tagging media and documents to a product. Step 1 of
-- branditect-ui/spec/product-attachments.md: the tables, the RLS, the partial
-- unique index and the counts view.
--
-- Paste this whole block into the Supabase SQL editor and run it once. Every
-- statement is IF NOT EXISTS or CREATE OR REPLACE, so running it twice is
-- harmless.
--
-- Do NOT append a verification SELECT to this paste. The editor has mangled a
-- trailing ORDER BY before now and rolled back the whole transaction with it.
-- Check the tables afterwards in the table view.
--
-- THREE DEPARTURES FROM THE SPEC, each forced by what the database actually
-- holds. All three were verified against the live schema before writing this.
--
--   1. The spec references products(id). There is no `products` table. The
--      products live in `catalog_products`, so that is what both foreign keys
--      point at. Referencing a table that does not exist would fail the whole
--      transaction on the first statement.
--
--   2. brand_id is TEXT here, matching brands.brand_id. It is not a UUID.
--
--   3. 24 of the 141 rows in brand_images carry brand_id 'vetra', which is not
--      a row in `brands` (the real one is 'vetra-6zc3'). Those images are
--      invisible under the RLS predicate below, which is correct and is not
--      something this migration should paper over. They are listed at the end
--      of this file so the problem is written down rather than discovered.

-- ── the two join tables ────────────────────────────────────────────────────
-- Two tables rather than one polymorphic product_links(kind, asset_id),
-- because a polymorphic table cannot carry foreign keys. Without them,
-- deleting an image leaves a link pointing at nothing and the product card
-- grows a broken thumbnail, which is the bug that makes people stop trusting
-- the feature. ON DELETE CASCADE costs one extra table and removes the class.

CREATE TABLE IF NOT EXISTS product_images (
  product_id  UUID NOT NULL REFERENCES catalog_products(id) ON DELETE CASCADE,
  image_id    UUID NOT NULL REFERENCES brand_images(id)     ON DELETE CASCADE,
  brand_id    TEXT NOT NULL,
  is_primary  BOOLEAN NOT NULL DEFAULT false,
  sort_order  INT     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (product_id, image_id)
);

CREATE TABLE IF NOT EXISTS product_documents (
  product_id   UUID NOT NULL REFERENCES catalog_products(id) ON DELETE CASCADE,
  document_id  UUID NOT NULL REFERENCES brand_documents(id)  ON DELETE CASCADE,
  brand_id     TEXT NOT NULL,
  doc_role     TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (product_id, document_id)
);

-- The reverse lookup: which products is this file tagged to. Criterion 12
-- reads this on every Knowledge item, and the primary key only covers the
-- product side.
CREATE INDEX IF NOT EXISTS product_images_image_idx    ON product_images (image_id);
CREATE INDEX IF NOT EXISTS product_documents_doc_idx   ON product_documents (document_id);
CREATE INDEX IF NOT EXISTS product_images_brand_idx    ON product_images (brand_id);
CREATE INDEX IF NOT EXISTS product_documents_brand_idx ON product_documents (brand_id);

-- ── criterion 8: exactly one primary per product ───────────────────────────
-- Enforced by the database, not by application code. Application code that
-- clears the old primary before setting the new one is one forgotten path away
-- from two primaries, and nothing would notice.
CREATE UNIQUE INDEX IF NOT EXISTS product_images_one_primary_idx
  ON product_images (product_id) WHERE is_primary;

-- ── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE product_images    ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_images_own_brand    ON product_images;
DROP POLICY IF EXISTS product_documents_own_brand ON product_documents;

CREATE POLICY product_images_own_brand ON product_images
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY product_documents_own_brand ON product_documents
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));

-- ── the counts, derived ────────────────────────────────────────────────────
-- A stored count needs every write path to remember to update it, and one that
-- forgets is invisible until somebody notices the number is wrong.
-- catalog_products.image_count and source_file_count already exist and are
-- exactly that: written once, never maintained, decorative. This view is the
-- truth and they are left alone.
--
-- The view filters itself rather than relying on the RLS of the table it
-- reads. security_invoker alone was not enough: catalog_products has no RLS,
-- so running as the caller still returned every brand's rows. The service_role
-- branch keeps server-side reads working, and without it every route using the
-- service key would silently return nothing.
CREATE OR REPLACE VIEW product_attachment_counts AS
SELECT p.id AS product_id,
       p.brand_id,
       (SELECT count(*) FROM product_images    pi WHERE pi.product_id = p.id) AS image_count,
       (SELECT count(*) FROM product_documents pd WHERE pd.product_id = p.id) AS document_count
FROM catalog_products p
WHERE auth.role() = 'service_role'
   OR p.brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid());

ALTER VIEW product_attachment_counts SET (security_invoker = on);

-- ── the orphan brand id, recorded rather than hidden ───────────────────────
-- 24 rows in brand_images carry brand_id 'vetra'. There is no such brand; the
-- real one is 'vetra-6zc3'. Those images cannot be tagged to a product,
-- because the RLS predicate above will not match them for any signed-in user.
--
-- The fix is one line, but it is a data change to somebody's library rather
-- than a schema change, so it is NOT run here. Decide, then run it:
--
--   UPDATE brand_images SET brand_id = 'vetra-6zc3' WHERE brand_id = 'vetra';
