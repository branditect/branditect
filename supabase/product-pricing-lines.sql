-- The product card rebuild, step 1. spec/product-card-rebuild.md section 3.
--
-- Paste this whole block into the Supabase SQL editor and run it once. Every
-- statement is IF NOT EXISTS, so running it twice is harmless.
--
-- Do NOT append a verification SELECT to this paste. The editor has mangled a
-- trailing ORDER BY before now and rolled back the whole transaction with it,
-- and it has dropped characters from the middle of a line since. Check the
-- columns afterwards in the table view.
--
-- WHAT THIS IS FOR. The Pricing tab showed the same five fields to every
-- product. A digital product has no freight and a service has no packaging,
-- which is why a fixed list does not work. These columns let a product carry
-- only the lines that apply to it.

-- Which lines this product shows. NULL means "use the preset for this brand's
-- track", so an existing product with no selection renders something sensible
-- rather than an empty tab.
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS price_lines_visible TEXT[];

-- Lines this business has that our list does not. A column per idea is how a
-- table reaches eighty columns none of which are queried.
-- Shape: [{ "label": "Sample kits", "value": 0.40, "group": "sell" }]
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS price_lines_custom JSONB DEFAULT '[]'::jsonb;

-- Cost to sell. Deliberately NOT folded into landed_cost: doing that would
-- understate gross margin on every product and break the house rule in
-- CLAUDE.md that margin is net of tax against landed cost.
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS cac               NUMERIC;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS payment_fees      NUMERIC;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS shipping_cost     NUMERIC;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS returns_allowance NUMERIC;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS platform_fee      NUMERIC;

-- Cost of goods lines the table did not have. price_cogs already holds the
-- supplier's charge and is relabelled "Unit cost" in the UI; landed_cost
-- already holds the goods total and is relabelled "COGS". Neither column is
-- renamed, so nothing that reads them breaks.
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS freight_duty   NUMERIC;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS packaging_cost NUMERIC;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS licence_cost   NUMERIC;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS labour_per_job NUMERIC;

-- The soft half of a guardrail. Most real pricing rules are sentences rather
-- than numbers, and Studio reads this one.
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS pricing_notes TEXT;
