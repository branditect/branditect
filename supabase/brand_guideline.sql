-- Run in Supabase SQL Editor: paste the statements below, not this filename.
--
-- WHY: the brand guideline had nowhere to live. Studio's guideline builder
-- extracted colours, fonts and logo rules into React state, applied a theme,
-- and lost all of it on refresh. Nothing was ever indexed, so the AI chat
-- never learned the guideline even after the file was uploaded.
--
-- No DROP or UPDATE here, so the SQL Editor shows no destructive-operations
-- warning. Re-running errors on the policy already existing, which is harmless.
--
-- One statement per line and no square or curly brackets — the SQL Editor's
-- bracket auto-pairing mangles multi-line pasted SQL and can silently fail the
-- whole statement while appearing to have run. See CLAUDE.md.

CREATE TABLE IF NOT EXISTS brand_guideline (brand_id TEXT PRIMARY KEY, source_name TEXT, source_type TEXT, storage_path TEXT, page_count INTEGER, colors JSONB, typography JSONB, logo JSONB, voice JSONB, summary TEXT, status TEXT, error TEXT, indexed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now());

ALTER TABLE brand_guideline ENABLE ROW LEVEL SECURITY;

CREATE POLICY brand_guideline_all ON brand_guideline FOR ALL USING (true) WITH CHECK (true);

-- Confirm. Should return 14 rows, one per column.

SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'brand_guideline' ORDER BY ordinal_position;
