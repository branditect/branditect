-- Run in Supabase SQL Editor.
--
-- Business profile and running costs for /numbers. Both are business-level,
-- not per product: rent is not a property of a hair dryer.
--
-- Extends brand_financial_rules, which is already brand-scoped and unique,
-- rather than adding a table that would need the same key and RLS.
--
-- FORMATTING: one statement per line, no square or curly brackets. Pasting
-- `TEXT[]` into the Supabase SQL editor arrives mangled and fails the whole
-- statement. `TEXT ARRAY` is identical to Postgres and survives.

-- Business profile: three axes, not five buckets.
ALTER TABLE brand_financial_rules ADD COLUMN IF NOT EXISTS sells TEXT;
ALTER TABLE brand_financial_rules ADD COLUMN IF NOT EXISTS charges TEXT;
ALTER TABLE brand_financial_rules ADD COLUMN IF NOT EXISTS channels TEXT ARRAY;

-- Running costs: five monthly totals, not receipts. The moment this wants
-- categories, dates and history it stops being a calculator and becomes
-- bookkeeping, at which point the product competes with Xero.
ALTER TABLE brand_financial_rules ADD COLUMN IF NOT EXISTS opex_rent NUMERIC;
ALTER TABLE brand_financial_rules ADD COLUMN IF NOT EXISTS opex_salaries NUMERIC;
ALTER TABLE brand_financial_rules ADD COLUMN IF NOT EXISTS opex_software NUMERIC;
ALTER TABLE brand_financial_rules ADD COLUMN IF NOT EXISTS opex_marketing NUMERIC;
ALTER TABLE brand_financial_rules ADD COLUMN IF NOT EXISTS opex_other NUMERIC;

-- Units per month the brand expects to sell. Feeds the overhead half of the
-- floor price test; without it that test cannot run.
ALTER TABLE brand_financial_rules ADD COLUMN IF NOT EXISTS expected_volume NUMERIC;
