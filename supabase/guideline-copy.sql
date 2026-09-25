-- The brand guideline page's editorial copy, saved.
--
-- /api/brand-guideline/brand-text wrote this copy fresh on every visit to the
-- guideline page and threw it away: a Sonnet call and 2 credits per page view
-- for text that only changes when the strategy or visual DNA does. Now it is
-- written once per version of its inputs. source_hash is a sha256 of those
-- inputs (lib/guideline-copy.ts); a visit whose hash matches reads the row
-- and calls nothing.
--
-- Paste into the Supabase SQL editor and run once. IF NOT EXISTS throughout,
-- so a second run is harmless. Until it is run the route behaves exactly as
-- before — it generates on every visit — so applying it late loses nothing.
--
-- Service role only: RLS on, no policies. The route reads and writes it with
-- the service key after resolveBrand() has checked the caller owns the brand.

CREATE TABLE IF NOT EXISTS guideline_copy (
  brand_id    TEXT PRIMARY KEY,
  source_hash TEXT NOT NULL,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE guideline_copy ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON guideline_copy FROM anon, authenticated;
