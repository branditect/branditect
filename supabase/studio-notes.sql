-- Studio ▸ Notes. Step 1 of branditect-ui/spec/studio-notes.md: both tables,
-- RLS, and the indexes. Criteria 8 and 10.
--
-- Paste this whole block into the Supabase SQL editor and run it once. Every
-- statement is IF NOT EXISTS or CREATE OR REPLACE, so running it twice is
-- harmless.
--
-- Do NOT append a verification SELECT to this paste. The editor has mangled a
-- trailing clause before now and rolled the whole transaction back with it.
-- supabase/verify-studio-notes.sql is a separate paste for that.
--
-- FOUR DEPARTURES FROM THE SPEC'S DDL, all mechanical:
--
--   1. IF NOT EXISTS on both CREATE TABLEs. The spec's version fails on a
--      second run, and a migration you cannot re-run safely is one you end up
--      afraid to run at all.
--   2. The three indexes the spec writes unnamed are named. Postgres would
--      generate names, and an unnamed index cannot be dropped or checked for
--      by a later migration.
--   3. RLS policies are written out. The spec says "RLS scoped by brand_id on
--      both tables, per supabase/close-rls-2.sql" without giving the
--      predicate; this is the same predicate that file uses.
--   4. updated_at is maintained by a trigger. The spec has the column and
--      relies on it for "newest first", and a column only the application
--      remembers to touch is the same class of defect as
--      catalog_products.image_count, which was written once and never again.

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id   TEXT NOT NULL,
  title      TEXT NOT NULL DEFAULT 'Untitled',
  flat_text  TEXT,                 -- blocks flattened, for search, preview and indexing
  pinned     BOOLEAN NOT NULL DEFAULT false,
  collecting BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS note_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id    UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  brand_id   TEXT NOT NULL,
  kind       TEXT NOT NULL CHECK (kind IN ('heading','text','list','image')),
  body       TEXT,
  -- CRITERION 10, THE MERGE BLOCKER. SET NULL, never CASCADE. Deleting a
  -- picture from Knowledge must not delete the paragraph beside it: the block
  -- stays, image_id becomes null, and the editor says the image is gone.
  -- Losing an afternoon's writing because a file was tidied up is the bug that
  -- makes people abandon a tool.
  image_id   UUID REFERENCES brand_images(id) ON DELETE SET NULL,
  width      TEXT NOT NULL DEFAULT 'full' CHECK (width IN ('full','half')),
  caption    TEXT,
  source     TEXT,        -- 'chat' | 'write' | 'create_images' | 'manual'. Stored, not displayed
  source_ref TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CRITERION 8: one collecting note per brand, enforced by the database rather
-- than by application code. Application code that clears the old flag before
-- setting the new one is one forgotten path away from two, and nothing would
-- notice. Same pattern as is_primary on product_images.
CREATE UNIQUE INDEX IF NOT EXISTS notes_one_collecting
  ON notes (brand_id) WHERE collecting;

CREATE INDEX IF NOT EXISTS note_blocks_note_order_idx
  ON note_blocks (note_id, sort_order);
CREATE INDEX IF NOT EXISTS note_blocks_brand_idx
  ON note_blocks (brand_id);
CREATE INDEX IF NOT EXISTS note_blocks_image_idx
  ON note_blocks (image_id);

-- Criterion 2: search matches text inside notes, not only titles.
CREATE INDEX IF NOT EXISTS notes_search_idx ON notes
  USING GIN (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(flat_text, '')));

-- "Newest first, pinned above", over the notes that are not in the bin.
CREATE INDEX IF NOT EXISTS notes_brand_recent_idx
  ON notes (brand_id, pinned DESC, updated_at DESC) WHERE deleted_at IS NULL;

-- ── updated_at, maintained by the database ─────────────────────────────────
CREATE OR REPLACE FUNCTION notes_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notes_touch ON notes;
CREATE TRIGGER notes_touch BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION notes_touch_updated_at();

-- ── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notes_own_brand       ON notes;
DROP POLICY IF EXISTS note_blocks_own_brand ON note_blocks;

CREATE POLICY notes_own_brand ON notes
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY note_blocks_own_brand ON note_blocks
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));
