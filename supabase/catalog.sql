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

CREATE POLICY "Allow all catalog" ON brand_catalog FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all products" ON catalog_products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all financial" ON brand_financial_rules FOR ALL USING (true) WITH CHECK (true);
