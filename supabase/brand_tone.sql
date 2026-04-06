-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS brand_tone (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT NOT NULL,
  expression_label TEXT,
  expression_text TEXT,
  pillars JSONB,
  dos TEXT[],
  donts TEXT[],
  vocab_yes TEXT[],
  vocab_no TEXT[],
  touchpoints JSONB,
  checklist JSONB,
  setup_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE brand_tone ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all tone" ON brand_tone FOR ALL USING (true) WITH CHECK (true);
