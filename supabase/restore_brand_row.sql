-- Run in Supabase SQL Editor.
--
-- WHY: the `brands` table is empty, but catalog_products, brand_documents,
-- brand_images, brand_tone and brand_visual all hold data under
-- 'sorbify-13t9'. useBrand() reads `brands`, finds nothing, and falls back to
-- brandId 'default' — so every page queries a brand that has no data, and the
-- AI chat answers with no brand context at all.
--
-- STEP 1 — check which account you sign in with. Run this on its own first:

SELECT id, email, created_at FROM auth.users ORDER BY created_at;

-- STEP 2 — create the row, linked to that account.
-- Edit the email below if step 1 shows a different one.
-- Safe to re-run: ON CONFLICT does nothing if the brand already exists.

INSERT INTO brands (brand_id, brand_name, industry, onboarding_completed, user_id)
SELECT 'sorbify-13t9', 'Sorbify', 'Industrial absorbents', true, id
FROM auth.users
WHERE email = 'saara.s.salama@gmail.com'
ON CONFLICT (brand_id) DO NOTHING;

-- STEP 3 — confirm. Should return exactly one row.

SELECT brand_id, brand_name, onboarding_completed, user_id FROM brands;

-- NOTE: four other brand_ids hold data — vetra-6zc3, deklan-zvkw,
-- nitroco-bsqy, and a stray 'vetra' in brand_images. Deliberately NOT created
-- here. useBrand() takes the first row matching your user with
-- onboarding_completed = true, so adding several makes which brand loads
-- arbitrary. Add them only when there is a way to switch between them.
