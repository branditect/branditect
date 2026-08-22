-- Run in Supabase SQL Editor.
--
-- Brings catalog_products up to the Products spec (docs/handoff/spec/products.md).
--
-- WHY THIS MATTERS: the correct margin is (net price − landed cost) / net price,
-- where net price is retail after tax is removed. Before this migration the
-- table held NEITHER value — only `price_cogs`, which is factory cost, and no
-- tax rate at all. Computing margin from what existed would have produced the
-- flattering-and-wrong figure the spec warns about: 86.9% instead of 82.2% on
-- the worked example. A max-discount rule built on that gap eats the difference
-- on every promotion.

ALTER TABLE catalog_products
  -- money
  ADD COLUMN IF NOT EXISTS landed_cost NUMERIC,        -- factory + duty + freight + packaging
  ADD COLUMN IF NOT EXISTS tax_rate_pct NUMERIC,       -- 20 for UK VAT. NULL = unknown, not 0
  ADD COLUMN IF NOT EXISTS price_retail NUMERIC,       -- gross, what the customer pays

  -- identity
  ADD COLUMN IF NOT EXISTS barcode TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',

  -- guardrails Studio obeys when writing offers
  ADD COLUMN IF NOT EXISTS floor_price NUMERIC,
  ADD COLUMN IF NOT EXISTS max_discount_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS min_margin_pct NUMERIC,

  -- availability: status only. Reorder point, supplier and lead time are
  -- deliberately absent — they are ops fields, and stale ops data held here
  -- becomes a brand risk rather than a warehouse problem.
  ADD COLUMN IF NOT EXISTS stock_status TEXT
    CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock')),
  ADD COLUMN IF NOT EXISTS stock_units INTEGER,
  ADD COLUMN IF NOT EXISTS stock_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stock_source TEXT,          -- 'Shopify', 'Manual'

  -- what the brain has on this product
  ADD COLUMN IF NOT EXISTS indexed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_file_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS used_in_output_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,

  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Existing rows carry retail in price_rrp; seed price_retail from it so the
-- list has something to show. RRP and retail then diverge as they should.
UPDATE catalog_products
   SET price_retail = price_rrp
 WHERE price_retail IS NULL AND price_rrp IS NOT NULL;

-- NOTE: landed_cost is deliberately NOT seeded from price_cogs. They are
-- different numbers, and copying one into the other would launder a factory
-- cost into a landed cost permanently. The UI falls back to price_cogs at
-- read time and labels the result an estimate instead.

-- Price-change audit trail. The History tab needs to answer "when did £139
-- become £149, and who did it".
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

CREATE INDEX IF NOT EXISTS product_history_product_idx
  ON product_history (product_id, changed_at DESC);

ALTER TABLE product_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all product_history" ON product_history
  FOR ALL USING (true) WITH CHECK (true);
