CREATE TABLE IF NOT EXISTS brand_strategies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT NOT NULL DEFAULT 'vetra',
  user_id UUID REFERENCES auth.users(id),
  category TEXT,
  answers JSONB DEFAULT '{}',
  generated_strategy TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE brand_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for now" ON brand_strategies
  FOR ALL USING (true) WITH CHECK (true);
