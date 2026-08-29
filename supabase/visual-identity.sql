-- Visual brand identity — spec/visual-identity.md, build order step 1.
--
-- Paste this whole block into the Supabase SQL editor and run it once.
-- Every statement is IF NOT EXISTS, so running it twice is harmless.
--
-- Do NOT append a verification SELECT to this paste. The editor has mangled a
-- trailing ORDER BY before now and rolled back the whole transaction with it.
-- Check the columns afterwards in the table view.

-- Formats. One row is one file today, so a logo with SVG + PNG + PDF is three
-- rows sharing a slot. The page groups by slot rather than adding a column;
-- this only records what each file IS.
ALTER TABLE brand_logos ADD COLUMN IF NOT EXISTS format TEXT;

-- Colour roles. "Primary. Buttons, links, the mark."
-- Contrast is COMPUTED at render, never stored — a stored ratio goes stale the
-- moment the hex changes. See lib/contrast.ts.
ALTER TABLE brand_book_colors ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE brand_book_colors ADD COLUMN IF NOT EXISTS grouping TEXT DEFAULT 'core';
ALTER TABLE brand_book_colors ADD COLUMN IF NOT EXISTS css_value TEXT;

-- Weights actually in use, so the type card can light them against the rest.
ALTER TABLE brand_fonts ADD COLUMN IF NOT EXISTS weights_in_use INT[];

-- The version stamp in the hero. Teams keep using a logo they downloaded in
-- March; a visible version is what lets someone tell.
ALTER TABLE brand_visual ADD COLUMN IF NOT EXISTS version TEXT DEFAULT 'v1.0';
ALTER TABLE brand_visual ADD COLUMN IF NOT EXISTS assets_updated_at TIMESTAMPTZ;

-- Backfill `format` from the file name for the rows that already exist.
UPDATE brand_logos
   SET format = lower(split_part(file_name, '.', array_length(string_to_array(file_name, '.'), 1)))
 WHERE format IS NULL AND file_name LIKE '%.%';
