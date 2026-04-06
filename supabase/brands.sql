CREATE TABLE IF NOT EXISTS brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  brand_id TEXT UNIQUE NOT NULL,
  brand_name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  strategy_method TEXT DEFAULT 'skip',
  strategy_text TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their brands" ON brands
  FOR ALL USING (true) WITH CHECK (true);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-logos', 'brand-logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-strategy', 'brand-strategy', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow logo uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'brand-logos');
CREATE POLICY "Allow logo reads" ON storage.objects FOR SELECT USING (bucket_id = 'brand-logos');
CREATE POLICY "Allow strategy uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'brand-strategy');
CREATE POLICY "Allow strategy reads" ON storage.objects FOR SELECT USING (bucket_id = 'brand-strategy');
