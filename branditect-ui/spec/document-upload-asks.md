# Uploading a document should ask what it is

`app/(app)/knowledge/documents/page.tsx`. Today `uploadFiles()` writes the row with
`category: detectCategory(file.name)` (line 260) and nothing else. The filename is guessed from,
silently, and the person never sees what was chosen.

The same screen already knows how to ask. The paste-text path collects a title and a category
(lines 556–567) before it writes. Only the file path skips it. This spec makes the two match.

---

## What it asks

One panel, opening the moment files are chosen:

```
Uploading 3 files                                       [ Save ]  [ Skip ]

  What is this?     ┌──────────────────────────────────────────────┐
                    │ Safety data sheet for the 500ml bottle,      │
                    │ TÜV tested Jan 2026                          │
                    └──────────────────────────────────────────────┘
                    Studio reads this to decide when to cite the file.

  Type              [ Product safety sheet  ▾ ]      ← pre-filled from the filename

  About a product?  [ ✓ SORBIFY OIL 500ml ] [ + add another ]     · Not about a product
```

Three questions, in that order. Description first because it is the one only a person can answer.

## It must not block the upload

The bytes start moving the instant the files are chosen. The panel is filled in **while** the
upload runs, and `Save` writes the metadata to rows that already exist. A modal that holds a 40 MB
PDF hostage while someone types a sentence is how a person learns to hit Skip every time.

## One panel for the batch, per-file override

Six files selected means one set of answers, applied to all six, with each file listed and
individually editable underneath. Selecting a folder of certificates and answering once is the
whole point.

## `detectCategory` stays — as a visible suggestion

The guess is not deleted, it is *shown*. It pre-fills the Type field, where it can be corrected in
one click. A guess you can see is a helpful default; a guess you cannot see is a silent wrong
answer, which is what ships today.

Same rule as the image matcher: **suggest, never auto-apply.** The difference is only that here
the suggestion appears in a field rather than a checkbox.

## Skip is allowed, and made pointless

`Skip` stores the file with the guessed type and no description. It exists because sometimes you
are in a hurry, and a flow with no exit gets worked around.

The lever is not blocking, it is making Save cheaper. Every field is pre-filled: type from the
filename, product from a name/SKU match against the filename, description left empty because
inventing one would be worse than leaving it blank. Save is one click. Skip saves no clicks and
loses the description, so there is no reason to press it.

Files saved with no description appear under **`Not described yet`** at the top of the library
until they are — a queue, not a scolding.

---

## The three taxonomies become one

Right now there are three overlapping lists, which is two too many:

| Where | Values |
|---|---|
| `brand_documents.category` | product-info · company-info · pricing · presentations · other |
| `product_documents.doc_role` *(specced, not built)* | safety_sheet · spec · manual · certificate |
| What you asked for | product safety · contract · price list · catalogue · presentation |

**Pick the document type. Derive the rest.**

| Type | `category` |
|---|---|
| Product safety sheet | product-info |
| Specification | product-info |
| Manual or instructions | product-info |
| Certificate or test report | product-info |
| Catalogue | product-info |
| Price list | pricing |
| Contract or quotation | company-info |
| Presentation | presentations |
| Brand guideline | company-info |
| Other | other |

`category` keeps its five values so the existing filter row keeps working untouched. It stops being
something anyone types.

**And `doc_role` on `product_documents` is dropped.** A safety sheet is a safety sheet whichever
product it is tagged to; putting the type on the link means storing it again for every product and
letting the copies disagree. Remove it from `spec/product-attachments.md` — it has not been built,
so this costs nothing now and a migration later.

```sql
ALTER TABLE brand_documents ADD COLUMN IF NOT EXISTS description   TEXT;
ALTER TABLE brand_documents ADD COLUMN IF NOT EXISTS doc_type      TEXT;
ALTER TABLE brand_documents ADD COLUMN IF NOT EXISTS use_in_output BOOLEAN NOT NULL DEFAULT true;
```

---

## The one to think about: contracts

You listed **sopimus** among the types, and it is the reason for the third column above.

Every document in Knowledge feeds a system whose job is to write customer-facing copy. A contract
holds negotiated rates, discounts a specific customer got, termination terms, names. Those are
exactly the sentences that must never surface in a generated line — and they are also, in a plain
text extract, indistinguishable from any other fact about the business.

So `use_in_output` defaults to **false for `Contract or quotation`** and true for every other type,
shown in the panel as a line you can change:

> **Not used in generated content.** Stored, searchable by you, never quoted by Studio.
> `Use it anyway`

The file is still indexed and still findable — you can ask about it in AI Chat, which is you
reading your own document. What changes is that Studio will not draw on it when writing something a
customer sees.

This is a decision, not a detail, and it is worth disagreeing with if you want to. The alternative
is that a rate you agreed with one reseller can appear in copy written for another, and nothing in
the system would flag it.

---

## Acceptance criteria

1. Choosing files opens the panel and starts the upload at the same time — asserted by a test that
   checks bytes are in flight before any field is filled.
2. The panel pre-fills Type from `detectCategory` and shows the value; no document is written with
   a type the person was not shown.
3. Answering once applies to every file in the batch; a per-file edit overrides only that file.
4. `Skip` writes the guessed type and no description; the file then appears under
   `Not described yet`.
5. `category` is derived from `doc_type` and is never entered by hand — asserted by a test that
   sets each type and expects the mapped category.
6. A document of type `Contract or quotation` is written with `use_in_output = false`.
7. **No Studio generation path reads a document with `use_in_output = false`** — sentinel test,
   same technique as the `/k` portal. **MERGE BLOCKER.**
8. Product links made in the panel land in `product_documents` and appear on those product cards.
9. The paste-text path and the file path write the same shape of row — asserted by comparing the
   two inserts field for field.

---

## Build order

1. The three columns, and the `doc_type` → `category` mapping in one place both paths import.
2. The panel, description and type only. Criteria 1–5, 9.
3. `use_in_output` and the Studio sentinel. Criteria 6, 7.
4. The product picker inside the panel — reuses the component from
   `spec/product-attachments-tags.md` step 3. Criterion 8.

Step 4 comes last because it depends on the picker that step 3 of the attachments spec is building
now. Steps 1–3 do not, and can start immediately.

---

## Not building

A document-type taxonomy the user can extend, per-page tagging, expiry dates on certificates,
approval workflow, or OCR language selection. One list of ten types covers what a brand actually
uploads; a custom taxonomy is how two people end up with "Safety" and "safety sheet" and neither
finds the other's file.
