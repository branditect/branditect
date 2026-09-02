-- Fix: product_attachment_counts was readable across brands.
--
-- Paste this whole block into the Supabase SQL editor and run it once. It
-- replaces the view created by supabase/product-attachments.sql. Nothing else
-- in that file changes, and the tables it made are correct.
--
-- WHAT WENT WRONG. The view was created with security_invoker = on, which
-- makes it run as the caller rather than as its owner. That was necessary and
-- not sufficient: the view reads catalog_products, and catalog_products has no
-- RLS of its own, so running as the caller still returned every brand's rows.
-- A signed-in user could read the product id, the brand id and the attachment
-- counts of every product in the database.
--
-- Verified: a brand new account with its own empty brand saw all 10 products
-- across all 4 brands through the view.
--
-- THE FIX. The view filters itself, so it no longer depends on the base table
-- being protected. The service_role branch keeps server-side reads working;
-- without it every route using the service key would silently return nothing,
-- which is the worse failure because it looks like an empty product.

CREATE OR REPLACE VIEW product_attachment_counts AS
SELECT p.id AS product_id,
       p.brand_id,
       (SELECT count(*) FROM product_images    pi WHERE pi.product_id = p.id) AS image_count,
       (SELECT count(*) FROM product_documents pd WHERE pd.product_id = p.id) AS document_count
FROM catalog_products p
WHERE auth.role() = 'service_role'
   OR p.brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid());

ALTER VIEW product_attachment_counts SET (security_invoker = on);
