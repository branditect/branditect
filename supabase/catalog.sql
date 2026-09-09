
-- ⚠ This file used to create a world-open policy on brand_catalog, catalog_products, brand_financial_rules.
--
-- The live database no longer has it — supabase/close-rls-2.sql and
-- close-rls-3.sql swept those, and scripts/cross-tenant.mjs proves it by
-- signing in as one user and failing to read another's rows. But re-running
-- THIS file would have put it straight back: PERMISSIVE policies are OR'd, so
-- one USING (true) defeats every scoped policy sitting beside it.
--
-- Replaced with a discovery-based drop and a brand-scoped policy. Dropping by
-- the name this file creates is what let nine open policies survive
-- close-rls.sql.

-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS brand_catalog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT NOT NULL,
  business_types TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catalog_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('physical', 'service', 'saas_tier', 'digital', 'addon')),
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  price_rrp NUMERIC,
  price_wholesale NUMERIC,
  price_cogs NUMERIC,
  price_monthly NUMERIC,
  price_model TEXT,
  currency TEXT DEFAULT 'EUR',
  sku TEXT,
  variants JSONB,
  inclusions TEXT[],
  ideal_client TEXT[],
  delivery_time TEXT,
  capacity_per_month TEXT,
  is_active BOOLEAN DEFAULT true,
  is_hero BOOLEAN DEFAULT false,
  is_flagship BOOLEAN DEFAULT false,
  flag_margin BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brand_financial_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT NOT NULL UNIQUE,
  margin_floor NUMERIC,
  max_discount NUMERIC,
  cac_ceiling NUMERIC,
  currency TEXT DEFAULT 'EUR',
  purchase_channel TEXT,
  purchase_frequency TEXT,
  cross_sell_notes TEXT,
  messaging_avoid TEXT,
  messaging_always TEXT,
  billing_cycles TEXT,
  annual_discount NUMERIC,
  free_trial_days INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE brand_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_financial_rules ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'brand_catalog'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.brand_catalog', r.policyname);
  END LOOP;
END $$;

CREATE POLICY brand_catalog_own_brand ON brand_catalog
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'catalog_products'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.catalog_products', r.policyname);
  END LOOP;
END $$;

CREATE POLICY catalog_products_own_brand ON catalog_products
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'brand_financial_rules'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.brand_financial_rules', r.policyname);
  END LOOP;
END $$;

CREATE POLICY brand_financial_rules_own_brand ON brand_financial_rules
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));
