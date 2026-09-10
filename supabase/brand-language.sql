-- Item 12 of branditect-ui/spec/queue.md, and section 1 of spec/finnish.md:
-- the two language columns on brands.
--
-- Paste this whole block into the Supabase SQL editor and run it once. Both
-- statements are IF NOT EXISTS, so running it twice is harmless.
--
-- Do NOT append a verification SELECT to this paste. The editor has mangled a
-- trailing ORDER BY before now and rolled back the whole transaction with it.
-- Check the columns afterwards in the table view.
--
-- TWO COLUMNS, NOT ONE, and that is the point of the whole thing. What Studio
-- WRITES and what the interface IS are different questions. A founder who has
-- read English software for fifteen years may well want the interface in
-- English out of habit and the copy in Finnish, because Finnish is what her
-- customers read. Someone else wants the reverse. One column forces a wrong
-- answer on half of them, and splitting it later is a migration on live
-- brands rather than on an empty one.
--
-- The default is 'en' on both, and every reader in the app defaults to 'en'
-- independently, so the interface is correct before this file is run as well
-- as after. Nothing waits on the migration.

ALTER TABLE brands ADD COLUMN IF NOT EXISTS output_language    TEXT NOT NULL DEFAULT 'en';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS interface_language TEXT NOT NULL DEFAULT 'en';

-- No CHECK constraint on the values, deliberately. A third language is a
-- dictionary file and nothing else; a constraint here would turn that into a
-- migration on a live table. lib/i18n/index.ts is where an unknown value is
-- rejected, and it falls back to 'en' rather than throwing.
