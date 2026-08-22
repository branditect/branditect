-- Run in Supabase SQL Editor. APPLIED 2026-08-22.
--
-- Brings catalog_products up to the Products spec (docs/handoff/spec/products.md).
--
-- WHY THIS MATTERS: the correct margin is (net price - landed cost) / net price,
-- where net price is retail after tax is removed. Before this migration the
-- table held NEITHER value - only `price_cogs`, which is factory cost, and no
-- tax rate at all. Computing margin from what existed would have produced the
-- flattering-and-wrong figure the spec warns about: 86.9% instead of 82.2% on
-- the worked example. A max-discount rule built on that gap eats the difference
-- on every promotion.
--
-- FORMATTING NOTE, learned the hard way: one statement per line, and no square
-- or curly brackets. Pasting `tags TEXT[] DEFAULT '{}'` into the Supabase SQL
-- editor arrives mangled - its bracket auto-pairing ate part of the line and
-- the whole ALTER TABLE failed with a syntax error. `TEXT ARRAY` is identical
-- to Postgres and survives the paste. Keep it that way.

ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS landed_cost NUMERIC;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS tax_rate_pct NUMERIC;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS price_retail NUMERIC;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS tags TEXT ARRAY;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS floor_price NUMERIC;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS max_discount_pct NUMERIC;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS min_margin_pct NUMERIC;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS stock_status TEXT;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS stock_units INTEGER;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS stock_synced_at TIMESTAMPTZ;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS stock_source TEXT;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS indexed BOOLEAN DEFAULT false;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS source_file_count INTEGER DEFAULT 0;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS image_count INTEGER DEFAULT 0;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS used_in_output_count INTEGER DEFAULT 0;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- NOTES ON WHAT IS DELIBERATELY ABSENT
--
-- landed_cost is NOT seeded from price_cogs. They are different numbers, and
-- copying one into the other would launder a factory cost into a landed cost
-- permanently. The UI falls back to price_cogs at read time and labels the
-- result an estimate instead.
--
-- price_retail is NOT seeded from price_rrp either. RRP is not retail, and an
-- UPDATE here is what makes Supabase flag the script as destructive. Set retail
-- per product in the drawer.
--
-- stock_status has no CHECK constraint. Only the app writes it, and it only
-- ever writes in_stock / low_stock / out_of_stock. Add one later if the column
-- is ever written by hand.
--
-- tags has no DEFAULT. It is null until set, which fromRow() in lib/products.ts
-- already handles.


-- ---------------------------------------------------------------------------
-- OPTIONAL. Backs the History tab, which shows a placeholder without it.
-- Not yet applied.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS product_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES catalog_products(id) ON DELETE CASCADE,
  brand_id TEXT NOT NULL,
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all product_history" ON product_history
  FOR ALL USING (true) WITH CHECK (true);
