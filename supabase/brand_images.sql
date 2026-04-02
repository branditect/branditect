-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

CREATE TABLE IF NOT EXISTS brand_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT NOT NULL DEFAULT 'vetra',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'brand' CHECK (category IN ('social', 'event', 'product', 'campaign', 'brand', 'ai-generated')),
  format TEXT NOT NULL DEFAULT 'other' CHECK (format IN ('square', 'story', 'landscape', 'portrait', 'other')),
  campaign_name TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE brand_images ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (simple policy for now)
CREATE POLICY "Allow all for authenticated users" ON brand_images
  FOR ALL USING (true) WITH CHECK (true);

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-images', 'brand-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: allow uploads
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'brand-images');

CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT USING (bucket_id = 'brand-images');

CREATE POLICY "Allow public deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'brand-images');
