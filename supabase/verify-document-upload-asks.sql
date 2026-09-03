-- Verification for supabase/document-upload-asks.sql.
--
-- Run this SEPARATELY, as its own paste, after the migration. Do not append it
-- to the migration: the editor has mangled a trailing clause before now and
-- rolled the whole transaction back with it, which is why the migration file
-- says not to.
--
-- Reads nothing but the catalogue. Changes nothing.
--
-- Expect five rows, all with ok = true. Anything false means that piece did not
-- land, and the row says which.

SELECT 'column: description'  AS thing,
       EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'brand_documents' AND column_name = 'description') AS ok
UNION ALL
SELECT 'column: doc_type',
       EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'brand_documents' AND column_name = 'doc_type')
UNION ALL
SELECT 'column: use_in_output',
       EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'brand_documents' AND column_name = 'use_in_output')
UNION ALL
SELECT 'index: brand_documents_undescribed_idx',
       EXISTS (SELECT 1 FROM pg_indexes
               WHERE tablename = 'brand_documents'
                 AND indexname = 'brand_documents_undescribed_idx')
UNION ALL
SELECT 'index: brand_documents_use_in_output_idx',
       EXISTS (SELECT 1 FROM pg_indexes
               WHERE tablename = 'brand_documents'
                 AND indexname = 'brand_documents_use_in_output_idx');
