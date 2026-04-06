-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS brand_visual (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT NOT NULL UNIQUE,
  colors JSONB DEFAULT '[]',
  fonts JSONB DEFAULT '[]',
  logo_slots JSONB DEFAULT '{}',
  guideline_url TEXT,
  strategy_text TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE brand_visual ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all visual" ON brand_visual FOR ALL USING (true) WITH CHECK (true);
