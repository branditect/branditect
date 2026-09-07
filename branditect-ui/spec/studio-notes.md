# Studio ▸ Notes

Reference: `reference/studio-notes.html`. **Replaces `spec/studio-library.md`** — delete that file.

A notes app. Not a composer, not a post builder, not a card wall.

---

## The screen

**Left:** the note count, a `+`, a search box, and a two-up grid of note cards — title, five lines of
preview, date. Newest first, pinned above.

**Right:** the note. A title and a document.

That is the whole surface.

## The toolbar, in full

```
Image  │  Heading   List                    Saved    📌    PDF    ⋯
```

Six controls. Everything else that was in the previous draft — source pills, product chips, a voice
panel, a pair composer — is gone. It was chrome around a text box, and a note is a document.

## The body

Paragraphs, headings, lists, images. Nothing else.

**The formatting test is whether it survives being pasted somewhere else.** A heading degrades to a
line, a bullet to a dash. Tables, colours, fonts and indents do not, and everything written here ends
up in a caption field or a product description.

### Images

Inserted from the library picker in `spec/knowledge-images.md`, or dragged in, which uploads to
Knowledge ▸ Media first so it is never a file that exists only inside a note.

One control on an image, on hover: **full width** or **half width**. Half floats left and the text
runs beside it. That is the image-and-text pairing that was asked for, reduced to one toggle rather
than a composer.

An optional caption line under the image, small and grey. Empty by default.

## Download as PDF

The note, rendered server-side: title, text, images at their chosen width, captions. One file.

Server-side, not in the browser — a note with eight photographs is a lot of memory in a tab and it
fails silently on a phone. Same rule as the zip in `spec/product-attachments.md`.

## Pinning from the rest of the app

One note at a time is **collecting**. Anything pinned in AI Chat, Write or Create images is appended
to the bottom of it as plain text. The pin control names the note it is adding to and does not ask
again:

```
Pin to  ·  14-day copy plan — October  ▾
```

This is the point of the feature. During an hour of drafting the answer is the same thirty times, and
asking thirty times is thirty interruptions.

`Stop collecting here` clears it. With none set, the first pin asks once. **Opening a note does not
make it the collecting note** — re-reading something old must not silently redirect the next hour of
work into it.

### Provenance is stored and not shown

`source` and `source_ref` are written on a pinned paragraph and rendered nowhere.

It costs nothing to keep and cannot be recovered later if it was never kept. If *"where did this line
come from"* ever becomes a question worth answering on screen, that is a display change rather than a
rebuild and a migration.

---

## What this is not

| Not building | Why |
|---|---|
| Notebooks, folders, stacks | A tax paid at write time for something search already does |
| Tags | Same. Search matches the words that are already in the note |
| Tables, highlighting, fonts, colours | Fails the survives-a-paste test |
| Reminders, tasks, due dates | Loses to the to-do app they already use |
| Sharing, comments, collaboration | Real work, and not asked for |
| Web clipper, offline sync | Months each |
| A voice check on note text | It was in the previous draft and it is cut. A note is a scratchpad; being marked for tone while thinking is the opposite of useful |

---

## Data

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id   TEXT NOT NULL,
  title      TEXT NOT NULL DEFAULT 'Untitled',
  flat_text  TEXT,                 -- blocks flattened, for search, preview and indexing
  pinned     BOOLEAN NOT NULL DEFAULT false,
  collecting BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE note_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id    UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  brand_id   TEXT NOT NULL,
  kind       TEXT NOT NULL CHECK (kind IN ('heading','text','list','image')),
  body       TEXT,
  image_id   UUID REFERENCES brand_images(id) ON DELETE SET NULL,
  width      TEXT NOT NULL DEFAULT 'full' CHECK (width IN ('full','half')),
  caption    TEXT,
  source     TEXT,        -- 'chat' | 'write' | 'create_images' | 'manual'. Stored, not displayed
  source_ref TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS notes_one_collecting
  ON notes (brand_id) WHERE collecting;

CREATE INDEX ON note_blocks (note_id, sort_order);
CREATE INDEX ON notes USING GIN (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(flat_text,'')));
```

Three deliberate things:

**`notes_one_collecting`** — one collecting note per brand, enforced by a partial unique index rather
than application code. Same pattern as `is_primary` on `product_images`.

**`ON DELETE SET NULL` on `image_id`, never `CASCADE`.** Deleting a picture from Knowledge must not
delete the paragraph it sits next to. The block stays and says the image is gone. Losing an
afternoon's writing because a file was tidied up is the bug that makes people abandon a tool.

**`flat_text`** is regenerated on every change. It powers search, the card preview and the brain: a
competitor's price written here should reach AI Chat, which is the only real reason notes belong in
this app rather than in the notes app already on the phone.

RLS scoped by `brand_id` on both tables, per `supabase/close-rls-2.sql`.

---

## Acceptance criteria

1. The card grid shows title, preview and date, pinned first then newest, and the preview comes from
   `flat_text`.
2. Search matches text inside notes, not only titles.
3. Typing autosaves. There is no Save control anywhere in the surface.
4. An image inserts from the library picker, and a dragged file uploads to Knowledge ▸ Media before
   it is placed — no image exists only inside a note. Asserted by dropping a file and finding the row
   in `brand_images`.
5. The half-width toggle floats the image and runs text beside it; full width does not.
6. `PDF` produces the note server-side with its text, images at their chosen widths, and captions,
   and is never assembled in the browser.
7. Pinning from AI Chat, Write and Create images appends to the collecting note, in order, and stores
   `source` without rendering it.
8. Exactly one collecting note per brand, enforced by the partial unique index — asserted by
   attempting a direct second update and expecting rejection.
9. Opening a note does not make it the collecting note.
10. Deleting an image from Knowledge leaves the block and the surrounding text intact and says the
    image is gone. **MERGE BLOCKER.**
11. `flat_text` is regenerated on every block change, so search and previews never go stale.
12. A deleted note is restorable for 30 days.
13. The toolbar has exactly the six controls in this spec — asserted by a test, because this is the
    surface that will accumulate buttons.
14. Nav has six primary items; Studio has three children — Write, Create images, Notes.

---

## Build order

1. Both tables, RLS, the two indexes. Criteria 8, 10.
2. The list, the cards, the editor with text, heading and list blocks, autosaving. Criteria 1, 3, 11.
3. Images, insert and width. Criteria 4, 5.
4. The collecting note and pinning. Criteria 7, 9.
5. Search. Criterion 2.
6. PDF. Criterion 6.
