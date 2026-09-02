-- Removing a product. Soft delete, because there are no backups.
--
-- Paste this whole block into the Supabase SQL editor and run it once. It is
-- IF NOT EXISTS, so running it twice is harmless.
--
-- Do NOT append a verification SELECT to this paste. The editor has mangled a
-- trailing ORDER BY before now and rolled back the whole transaction with it.
-- Check the column afterwards in the table view.
--
-- Why a column rather than DELETE: a product row carries the landed cost, the
-- tax rate, the floor price, the maximum discount and the margin guardrails
-- somebody worked out once. Supabase is on the Free plan, so there are no
-- scheduled backups and no point-in-time recovery. A DELETE here is permanent,
-- and this project has already lost a product description that way.

ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Every read filters on this, so it is worth an index.
CREATE INDEX IF NOT EXISTS catalog_products_live_idx
  ON catalog_products (brand_id) WHERE deleted_at IS NULL;
