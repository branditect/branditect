-- Verification for supabase/studio-notes.sql. Run SEPARATELY, as its own
-- paste, after the migration. Reads the catalogue, changes nothing.
--
-- Expect every row ok = true. The two that matter most are the last two:
-- criterion 10 depends on image_id being SET NULL rather than CASCADE, and
-- criterion 8 on the partial unique index existing.

SELECT 'table: notes' AS thing,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes') AS ok
UNION ALL
SELECT 'table: note_blocks',
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'note_blocks')
UNION ALL
SELECT 'rls: notes',
       COALESCE((SELECT relrowsecurity FROM pg_class WHERE relname = 'notes'), false)
UNION ALL
SELECT 'rls: note_blocks',
       COALESCE((SELECT relrowsecurity FROM pg_class WHERE relname = 'note_blocks'), false)
UNION ALL
SELECT 'index: notes_one_collecting (criterion 8)',
       EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'notes_one_collecting')
UNION ALL
SELECT 'index: notes_search_idx',
       EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'notes_search_idx')
UNION ALL
SELECT 'index: note_blocks_note_order_idx',
       EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'note_blocks_note_order_idx')
UNION ALL
SELECT 'trigger: notes_touch keeps updated_at true',
       EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'notes_touch')
UNION ALL
-- 'n' = NO ACTION, 'c' = CASCADE, 'n' vs 'r'... confdeltype 'n' is SET NULL.
SELECT 'image_id is ON DELETE SET NULL, not CASCADE (criterion 10)',
       EXISTS (
         SELECT 1 FROM pg_constraint
         WHERE conrelid = 'note_blocks'::regclass
           AND confrelid = 'brand_images'::regclass
           AND confdeltype = 'n'
       );
