-- Step 1 of branditect-ui/spec/document-upload-asks.md: the three columns.
--
-- Paste this whole block into the Supabase SQL editor and run it once. Every
-- statement is IF NOT EXISTS, so running it twice is harmless.
--
-- Do NOT append a verification SELECT to this paste. The editor has mangled a
-- trailing ORDER BY before now and rolled back the whole transaction with it.
-- Check the columns afterwards in the table view.

ALTER TABLE brand_documents ADD COLUMN IF NOT EXISTS description   TEXT;
ALTER TABLE brand_documents ADD COLUMN IF NOT EXISTS doc_type      TEXT;
ALTER TABLE brand_documents ADD COLUMN IF NOT EXISTS use_in_output BOOLEAN NOT NULL DEFAULT true;

-- `Not described yet` is the first thing the library shows, so it is worth an
-- index rather than a sort over every row on every load.
CREATE INDEX IF NOT EXISTS brand_documents_undescribed_idx
  ON brand_documents (brand_id) WHERE description IS NULL;

-- Studio's sentinel (criterion 7) reads this on every generation path.
CREATE INDEX IF NOT EXISTS brand_documents_use_in_output_idx
  ON brand_documents (brand_id, use_in_output);

-- Backfill doc_type from the category already stored, so existing rows arrive
-- with a type rather than a blank field. The mapping is one-to-many in reverse,
-- so this picks the commonest type per category and nothing more clever —
-- these rows were never asked, and a wrong specific guess is worse than a
-- correct vague one. Anything already typed is left alone.
UPDATE brand_documents SET doc_type = CASE category
    WHEN 'pricing'       THEN 'price_list'
    WHEN 'presentations' THEN 'presentation'
    WHEN 'product-info'  THEN 'spec'
    WHEN 'company-info'  THEN 'brand_guideline'
    ELSE 'other'
  END
  WHERE doc_type IS NULL;

-- ── doc_role on product_documents ──────────────────────────────────────────
-- The spec drops it: a safety sheet is a safety sheet whichever product it is
-- tagged to, so the type belongs on the document, not on each link.
--
-- The spec assumed it had not been built. It has — supabase/product-attachments.sql
-- created it and the product card's Media tab renders it — so this is a real
-- migration rather than a free deletion, and dropping a populated column cannot
-- be undone on the Free plan, which has no point-in-time recovery.
--
-- The application stops reading and writing it in this release. Run the drop
-- once you are satisfied nothing depends on it:
--
--   ALTER TABLE product_documents DROP COLUMN IF EXISTS doc_role;
--
-- Until then it simply sits there unread, which costs nothing.
