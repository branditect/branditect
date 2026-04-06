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

-- Storage bucket for brand library assets (logos, guidelines uploaded in Brand Library)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('brand-assets', 'brand-assets', true, 104857600)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow brand-assets uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'brand-assets');
CREATE POLICY "Allow brand-assets reads" ON storage.objects FOR SELECT USING (bucket_id = 'brand-assets');
CREATE POLICY "Allow brand-assets updates" ON storage.objects FOR UPDATE USING (bucket_id = 'brand-assets');
CREATE POLICY "Allow brand-assets deletes" ON storage.objects FOR DELETE USING (bucket_id = 'brand-assets');
