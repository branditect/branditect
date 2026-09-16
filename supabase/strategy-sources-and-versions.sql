-- Bring your own strategy, and start fresh without losing the old one.
--
-- Paste this whole block into the Supabase SQL editor and run it once. Every
-- statement is idempotent, and the backfill runs before the unique index so an
-- existing brand with two strategy rows does not make the index fail.
--
-- WHY. Two features from branditect-ui/spec/strategy-in-and-again.md:
--
--   1. "I already have a strategy" — the answers can come out of a document
--      instead of the questionnaire. What was extracted has to be marked as
--      extracted, and each answer has to carry the sentence it came from, or
--      nobody can tell an answer the founder wrote from one a model read.
--
--   2. "Start fresh" — a redo must not destroy the strategy that is live.
--      Versions, archived on finish, never on start.

ALTER TABLE brand_strategies ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'questionnaire';
COMMENT ON COLUMN brand_strategies.source IS '''questionnaire'' or ''document''';

-- Per answer: { "<question key>": { "quote": "...", "page": 3 } }. Empty for
-- an answer somebody typed.
ALTER TABLE brand_strategies ADD COLUMN IF NOT EXISTS provenance JSONB NOT NULL DEFAULT '{}';

-- The file it was read from, in Knowledge ▸ Documents. Null when pasted.
ALTER TABLE brand_strategies ADD COLUMN IF NOT EXISTS source_document_id UUID;

ALTER TABLE brand_strategies ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
ALTER TABLE brand_strategies ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE brand_strategies ADD COLUMN IF NOT EXISTS replaced_at TIMESTAMPTZ;

-- Backfill BEFORE the index. Brands already have more than one row here: the
-- newest is current, everything older is a version behind it, numbered by age
-- so version 1 is the oldest.
WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY brand_id ORDER BY updated_at, created_at, id) AS v,
         row_number() OVER (PARTITION BY brand_id ORDER BY updated_at DESC, created_at DESC, id DESC) AS newest
  FROM brand_strategies
)
UPDATE brand_strategies s
   SET version = ranked.v,
       is_current = (ranked.newest = 1),
       replaced_at = CASE WHEN ranked.newest = 1 THEN NULL ELSE COALESCE(s.replaced_at, now()) END
  FROM ranked
 WHERE ranked.id = s.id;

-- Exactly one current strategy per brand, enforced here rather than in
-- application code — the same pattern as is_primary on product_images.
CREATE UNIQUE INDEX IF NOT EXISTS brand_strategies_one_current
  ON brand_strategies (brand_id) WHERE is_current;

-- Reading a brand's history is ordered by version.
CREATE INDEX IF NOT EXISTS brand_strategies_brand_version
  ON brand_strategies (brand_id, version DESC);

-- What this does NOT do, deliberately: nothing to catalog_products,
-- brand_documents, brand_images, notes or anything Studio has written. A redo
-- replaces the strategy, the tone and the anti-voice, and touches nothing else.
