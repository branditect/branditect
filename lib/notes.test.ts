/** Run with: npm test — criteria from branditect-ui/spec/studio-notes.md */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { NAV } from "./nav.ts";
import {
  TOOLBAR, SAVED_INDICATOR, BLOCK_KINDS, flattenBlocks, previewOf,
  imageIsMissing, afterImageDeleted, collectingAfterOpen, needsCollectingPrompt,
  mergePatch, patchBelongsTo, titleInputValue, titleToSave, DEFAULT_TITLE,
  emptyQueue, enqueue, takeNext, settle, isBusy, nextWidth, widthLabel,
  pinLabel, isRestorable, RESTORE_WINDOW_DAYS, type NoteBlock,
} from "./notes.ts";

/**
 * CRITERION 13. The toolbar has exactly six controls, "because this is the
 * surface that will accumulate buttons".
 */
describe("the toolbar has exactly six controls", () => {
  it("six, no more", () => {
    assert.equal(TOOLBAR.length, 6,
      `toolbar is ${TOOLBAR.length}: ${TOOLBAR.map((t) => t.id).join(", ")}`);
  });

  it("and they are the six in the spec", () => {
    assert.deepEqual(TOOLBAR.map((t) => t.id), ["image", "heading", "list", "pin", "pdf", "more"]);
  });

  it("every id is unique", () => {
    assert.equal(new Set(TOOLBAR.map((t) => t.id)).size, 6);
  });

  /**
   * CRITERION 3: typing autosaves, and there is no Save control anywhere. The
   * Saved indicator sits in the toolbar row, which is exactly why it is easy
   * to mistake for a seventh control when counting.
   */
  it("Saved is a status, not a control", () => {
    assert.equal(SAVED_INDICATOR.isControl, false);
    assert.ok(!TOOLBAR.some((t) => t.id === "saved"), "Saved is in the control list");
  });

  it("nothing in the toolbar saves", () => {
    for (const t of TOOLBAR) {
      assert.ok(!/^save$/i.test(t.label.trim()), `${t.id} is a Save control`);
      assert.ok(!/\bsave\b/i.test(t.title), `${t.id}'s tooltip offers saving: ${t.title}`);
    }
  });

  it("none of the cut chrome came back", () => {
    for (const gone of ["source", "product", "voice", "pair", "compose", "tone"]) {
      assert.ok(!TOOLBAR.some((t) => t.id.includes(gone)),
        `${gone} is back in the toolbar; the previous draft's chrome was cut on purpose`);
    }
  });
});

/** CRITERION 11. flat_text powers search, the preview and the brain. */
describe("flattening blocks", () => {
  const blocks: NoteBlock[] = [
    { kind: "heading", body: "October plan", sort_order: 0 },
    { kind: "text", body: "Competitor sells the refill at 14.90.", sort_order: 1 },
    { kind: "image", image_id: "img-1", caption: "Packshot on grey", sort_order: 2 },
    { kind: "list", body: "Post Tuesday\nPost Friday", sort_order: 3 },
  ];

  it("takes the text of every block, in order", () => {
    assert.equal(flattenBlocks(blocks),
      "October plan\nCompetitor sells the refill at 14.90.\nPackshot on grey\nPost Tuesday\nPost Friday");
  });

  it("sorts by sort_order rather than trusting the array", () => {
    const shuffled = [blocks[3], blocks[0], blocks[2], blocks[1]];
    assert.equal(flattenBlocks(shuffled), flattenBlocks(blocks));
  });

  it("an image with no caption contributes nothing, not a placeholder", () => {
    const out = flattenBlocks([{ kind: "image", image_id: "i", sort_order: 0 }]);
    assert.equal(out, "");
  });

  it("a competitor's price written here reaches the brain", () => {
    assert.match(flattenBlocks(blocks), /14\.90/);
  });

  it("the card preview is five lines of it", () => {
    const flat = "a\nb\nc\nd\ne\nf\ng";
    assert.equal(previewOf(flat).split("\n").length, 5);
    assert.equal(previewOf(flat), "a\nb\nc\nd\ne");
    assert.equal(previewOf(null), "");
  });
});

/**
 * CRITERION 10, THE MERGE BLOCKER. Deleting an image from Knowledge leaves the
 * block and the surrounding text intact and says the image is gone.
 */
describe("deleting an image from Knowledge does not delete the writing", () => {
  const blocks: NoteBlock[] = [
    { id: "b1", kind: "text", body: "Before the picture.", sort_order: 0 },
    { id: "b2", kind: "image", image_id: "img-1", caption: "Packshot", sort_order: 1 },
    { id: "b3", kind: "text", body: "After the picture.", sort_order: 2 },
  ];

  const after = afterImageDeleted(blocks, "img-1");

  it("every block survives", () => {
    assert.equal(after.length, 3);
    assert.deepEqual(after.map((b) => b.id), ["b1", "b2", "b3"]);
  });

  it("the text either side is untouched", () => {
    assert.equal(after[0].body, "Before the picture.");
    assert.equal(after[2].body, "After the picture.");
  });

  it("the image block stays, keeps its caption, and says the image is gone", () => {
    assert.equal(after[1].kind, "image");
    assert.equal(after[1].caption, "Packshot");
    assert.ok(imageIsMissing(after[1]));
  });

  it("a block whose image is still there is not reported as missing", () => {
    assert.ok(!imageIsMissing(blocks[1]));
    assert.ok(!imageIsMissing(blocks[0]), "a text block is never a missing image");
  });

  it("deleting one image leaves other images alone", () => {
    const two = [...blocks, { id: "b4", kind: "image" as const, image_id: "img-2", sort_order: 3 }];
    const out = afterImageDeleted(two, "img-1");
    assert.equal(out[3].image_id, "img-2");
  });

  /** The database is what actually guarantees this. */
  it("the migration uses SET NULL, never CASCADE, on image_id", () => {
    const sql = readFileSync("supabase/studio-notes.sql", "utf8");
    const line = sql.split("\n").find((l) => l.includes("REFERENCES brand_images"));
    assert.ok(line, "no foreign key to brand_images");
    assert.match(line!, /ON DELETE SET NULL/,
      "image_id would take the paragraph with it");
    assert.ok(!/REFERENCES brand_images\(id\)\s+ON DELETE CASCADE/.test(sql));
  });
});

/** CRITERION 8: one collecting note per brand, enforced by the database. */
describe("the collecting note", () => {
  const sql = readFileSync("supabase/studio-notes.sql", "utf8");

  it("is enforced by a partial unique index, not application code", () => {
    assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS notes_one_collecting\s*\n?\s*ON notes \(brand_id\) WHERE collecting/);
  });

  /** CRITERION 9. */
  it("opening a note does not make it the collecting note", () => {
    assert.equal(collectingAfterOpen("note-a", "note-b"), "note-a");
    assert.equal(collectingAfterOpen(null, "note-b"), null,
      "opening a note set it as collecting, redirecting the next hour of work");
  });

  it("with none set, the first pin asks once", () => {
    assert.ok(needsCollectingPrompt(null));
    assert.ok(!needsCollectingPrompt("note-a"));
  });

  it("the pin control names the note it is adding to", () => {
    assert.equal(pinLabel("14-day copy plan — October"), "Pin to · 14-day copy plan — October");
  });
});

/** CRITERION 12. */
describe("the bin", () => {
  const now = new Date("2026-09-07T12:00:00Z");
  it("keeps a deleted note for thirty days", () => {
    assert.equal(RESTORE_WINDOW_DAYS, 30);
    assert.ok(isRestorable("2026-08-20T12:00:00Z", now));
    assert.ok(!isRestorable("2026-07-01T12:00:00Z", now));
  });
  it("a note that was never deleted is not in the bin", () => {
    assert.ok(!isRestorable(null, now));
    assert.ok(!isRestorable(undefined, now));
  });
  it("a broken timestamp does not become restorable forever", () => {
    assert.ok(!isRestorable("not a date", now));
  });
});

describe("the migration", () => {
  const sql = readFileSync("supabase/studio-notes.sql", "utf8");

  it("is safe to run twice", () => {
    for (const stmt of sql.match(/^CREATE (TABLE|INDEX|UNIQUE INDEX) .*/gm) ?? []) {
      assert.ok(stmt.includes("IF NOT EXISTS"), stmt);
    }
  });

  it("names every index, so a later migration can find them", () => {
    assert.ok(!/CREATE INDEX ON /.test(sql), "an unnamed index cannot be dropped or checked for");
  });

  it("closes RLS on both tables", () => {
    for (const t of ["notes", "note_blocks"]) {
      assert.ok(new RegExp(`ALTER TABLE ${t}\\s+ENABLE ROW LEVEL SECURITY`).test(sql), t);
      assert.ok(new RegExp(`CREATE POLICY ${t}_own_brand`).test(sql), `${t} has no policy`);
    }
  });

  it("scopes those policies to the caller's own brand", () => {
    const opens = sql.match(/USING\s*\(\s*true\s*\)/gi) ?? [];
    assert.deepEqual(opens, [], "a USING (true) policy would defeat every correct one beside it");
  });

  it("has a verification paste that is separate and read-only", () => {
    assert.ok(existsSync("supabase/verify-studio-notes.sql"));
    const v = readFileSync("supabase/verify-studio-notes.sql", "utf8");
    // Statement position, not the word anywhere: the file legitimately
    // contains "ON DELETE SET NULL" inside a label it prints, and matching
    // that flagged a read-only file as dangerous.
    const statements = v.split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("--"));
    for (const line of statements) {
      assert.ok(!/^(ALTER|DROP|INSERT|UPDATE|DELETE|CREATE|TRUNCATE|GRANT)\b/i.test(line),
        `the verification file can change the database: ${line}`);
    }
    assert.ok(statements.some((l) => /^SELECT\b/i.test(l)), "it reads nothing");
  });
});

/** The block vocabulary, which is what keeps a paste survivable. */
describe("the body holds four kinds of block and no more", () => {
  it("paragraphs, headings, lists, images", () => {
    assert.deepEqual(BLOCK_KINDS, ["heading", "text", "list", "image"]);
  });

  it("and the migration's CHECK agrees", () => {
    const sql = readFileSync("supabase/studio-notes.sql", "utf8");
    assert.match(sql, /kind\s+TEXT NOT NULL CHECK \(kind IN \('heading','text','list','image'\)\)/);
  });
});

/** The spec it replaces is gone. */
describe("studio-library is superseded", () => {
  it("the spec file is deleted", () => {
    assert.ok(!existsSync("branditect-ui/spec/studio-library.md"));
  });
  it("and its reference with it, since nothing else pointed at it", () => {
    assert.ok(!existsSync("branditect-ui/reference/studio-library.html"));
  });
});

/**
 * The title input. The placeholder is "Untitled", so rendering the same word
 * as the value made a person delete it before naming anything — and typing
 * without deleting produced "UntitledOctober plan", which is what a person
 * gets and what the browser check hit.
 */
describe("the title input is empty, and Untitled is only the placeholder", () => {
  it("a note at the column default shows an empty input", () => {
    assert.equal(titleInputValue(DEFAULT_TITLE), "");
    assert.equal(titleInputValue(null), "");
    assert.equal(titleInputValue(undefined), "");
    assert.equal(titleInputValue(""), "");
  });

  it("a named note shows its name", () => {
    assert.equal(titleInputValue("October plan"), "October plan");
    // Only the exact default is blanked. Somebody who deliberately types
    // Untitled Draft keeps it.
    assert.equal(titleInputValue("Untitled Draft"), "Untitled Draft");
  });

  it("a blank title is never written", () => {
    assert.equal(titleToSave(""), null);
    assert.equal(titleToSave("   "), null);
    assert.equal(titleToSave("\n "), null);
  });

  it("a real title is written, trimmed", () => {
    assert.equal(titleToSave("  October plan  "), "October plan");
  });

  it("the row keeps its default so the card has something to show", () => {
    assert.equal(DEFAULT_TITLE, "Untitled");
    const sql = readFileSync("supabase/studio-notes.sql", "utf8");
    assert.match(sql, /title\s+TEXT NOT NULL DEFAULT 'Untitled'/,
      "the column default was removed; the card would show an empty line");
  });

  it("the page uses both rules rather than its own", () => {
    const src = readFileSync("app/(app)/studio/notes/page.tsx", "utf8");
    assert.ok(src.includes("titleInputValue("), "the page renders the stored title raw");
    assert.ok(src.includes("titleToSave("), "the page can still queue a blank title");
    assert.ok(!/setTitle\(json\.note\.title\)/.test(src), "a raw title is still assigned");
  });

  it("and the route refuses a blank as a backstop", () => {
    const route = readFileSync("app/api/notes/route.ts", "utf8");
    assert.match(route, /body\.title\.trim\(\) !== ""/,
      "the route would write an empty string");
  });
});

/**
 * The autosave merge. Found by typing into the real editor, not by a test.
 *
 * The first version of queueSave REPLACED the pending patch on every edit.
 * Typing a title and then typing a paragraph queued a title save, then a
 * blocks save that cancelled it, and the title was silently lost: the note
 * stayed "Untitled" in the database while the screen showed what had been
 * typed and the indicator said Saved. Every unit test passed and the route
 * returned 200 throughout.
 */
describe("a queued save merges rather than replacing", () => {
  it("a title edit survives a later block edit", () => {
    const merged = mergePatch({ title: "October plan" }, { blocks: [] });
    assert.equal(merged.title, "October plan", "the title was dropped");
    assert.deepEqual(merged.blocks, []);
  });

  it("a later edit of the same field wins", () => {
    assert.equal(mergePatch({ title: "a" }, { title: "b" }).title, "b");
  });

  it("blocks survive a later title edit", () => {
    const blocks = [{ kind: "text" as const, body: "kept" }];
    assert.deepEqual(mergePatch({ blocks }, { title: "t" }).blocks, blocks);
  });

  it("an edit belongs to the note it was made in", () => {
    assert.ok(patchBelongsTo("note-a", "note-a"));
    assert.ok(!patchBelongsTo("note-a", "note-b"), "a patch would carry across notes");
    assert.ok(!patchBelongsTo(null, "note-a"));
  });

  it("the page coalesces through the queue, which merges", () => {
    const src = readFileSync("app/(app)/studio/notes/page.tsx", "utf8");
    assert.ok(src.includes("enqueue(queue.current"), "the page replaces the pending patch again");
    assert.ok(src.includes("patchBelongsTo("), "a pending edit can cross notes");
  });
});

/**
 * One save at a time.
 *
 * Two autosave requests could be in flight and land out of order; the loser
 * overwrote the winner. One editor check in three lost both the title and
 * flat_text that way.
 */
describe("the save queue never runs two requests at once", () => {
  it("nothing goes out while a request is in flight", () => {
    let q = enqueue(emptyQueue, "n1", { title: "a" });
    const first = takeNext(q);
    assert.ok(first.send, "the first save did not go out");
    q = first.next;
    assert.equal(q.inFlight, true);

    q = enqueue(q, "n1", { blocks: [] });
    const second = takeNext(q);
    assert.equal(second.send, null, "a second request started while one was in flight");
  });

  it("edits made during a request coalesce and go out when it settles", () => {
    let q = takeNext(enqueue(emptyQueue, "n1", { title: "a" })).next;
    q = enqueue(q, "n1", { title: "b" });
    q = enqueue(q, "n1", { blocks: [{ kind: "text", body: "x" }] });
    q = settle(q);
    const out = takeNext(q);
    assert.deepEqual(out.send?.patch.title, "b", "the later title was lost");
    assert.equal(out.send?.patch.blocks?.length, 1, "the blocks were lost");
  });

  it("an empty queue sends nothing", () => {
    assert.equal(takeNext(emptyQueue).send, null);
    assert.equal(takeNext(settle(takeNext(enqueue(emptyQueue, "n1", { title: "a" })).next)).send, null);
  });

  it("an edit for another note replaces rather than mixing", () => {
    let q = enqueue(emptyQueue, "n1", { title: "one" });
    q = enqueue(q, "n2", { blocks: [] });
    const out = takeNext(q);
    assert.equal(out.send?.id, "n2");
    assert.equal(out.send?.patch.title, undefined, "note one's title followed note two");
  });

  it("busy covers both running and waiting", () => {
    assert.equal(isBusy(emptyQueue), false);
    assert.equal(isBusy(enqueue(emptyQueue, "n1", { title: "a" })), true);
    assert.equal(isBusy(takeNext(enqueue(emptyQueue, "n1", { title: "a" })).next), true);
  });

  it("the page drains through the queue rather than firing directly", () => {
    const src = readFileSync("app/(app)/studio/notes/page.tsx", "utf8");
    assert.ok(src.includes("takeNext(queue.current)"), "the page does not gate on the queue");
    assert.ok(src.includes("settle(queue.current)"), "the queue is never released");
    const patches = (src.match(/authedJson\("\/api\/notes", "PATCH"/g) ?? []).length;
    assert.equal(patches, 1, `${patches} places issue a PATCH; there must be exactly one`);
  });
});

/** flat_text comes from the database, not from what the request carried. */
describe("flat_text is recomputed from the rows that were written", () => {
  const route = readFileSync("app/api/notes/route.ts", "utf8");

  it("the route re-reads the blocks before flattening", () => {
    const post = route.slice(route.indexOf("if (Array.isArray(body.blocks))"));
    assert.ok(/from\("note_blocks"\)[\s\S]{0,200}\.order\("sort_order"\)/.test(post),
      "the blocks are not read back");
    assert.ok(/flattenBlocks\(\(written/.test(post),
      "flat_text still comes from the request payload");
  });

  it("it does not flatten the payload any more", () => {
    assert.ok(!/flattenBlocks\(body\.blocks\)/.test(route),
      "a partial block set would produce a wrong flat_text whatever the order");
  });

  it("a failed read is reported rather than writing a wrong flat_text", () => {
    assert.match(route, /readErr[\s\S]{0,80}status: 500/);
  });
});

/** CRITERION 14: nav has six primary items; Studio has three children. */
describe("Notes is in the nav", () => {
  it("Studio has Write, Create images and Notes", () => {
    const studio = NAV.find((i) => i.label === "Studio");
    assert.deepEqual((studio?.children ?? []).map((c) => c.label),
      ["Write", "Create images", "Notes"]);
  });

  it("still six primary items", () => {
    assert.equal(NAV.length, 6);
  });

  it("and the route it points at exists", () => {
    assert.ok(existsSync("app/(app)/studio/notes/page.tsx"));
  });
});

/**
 * CRITERION 3. Typing autosaves and there is no Save control. The page has to
 * actually behave that way, not merely omit the button from the toolbar array.
 */
describe("the page autosaves", () => {
  const src = readFileSync("app/(app)/studio/notes/page.tsx", "utf8");

  it("has no Save button", () => {
    assert.ok(!/>\s*Save\s*</.test(src), "there is a Save control on the page");
    assert.ok(!/onClick=\{[^}]*\bsave\b[^}]*\}/i.test(src.replace(/queueSave/g, "")),
      "something on the page is wired to an explicit save");
  });

  it("saves on a change rather than on a click", () => {
    assert.ok(/function editTitle/.test(src) && /queueSave\(\{ title/.test(src));
    assert.ok(/function editBlock/.test(src) && /queueSave\(\{ blocks/.test(src));
  });

  it("shows Saved as a status, from the shared constant", () => {
    assert.ok(src.includes("SAVED_INDICATOR.label"), "the label is duplicated rather than shared");
  });

  it("a failed save says so instead of looking fine", () => {
    assert.match(src, /Not saved\./);
  });

  it("renders the six controls from the shared list, not its own", () => {
    assert.ok(src.includes("TOOLBAR.map("), "the page builds its own toolbar");
    for (const hardcoded of [">Heading<", ">List<", ">PDF<"]) {
      assert.ok(!src.includes(hardcoded), `the page hardcodes ${hardcoded}`);
    }
  });
});

/** CRITERION 11: flat_text is regenerated on every block change. */
describe("flat_text is regenerated server-side on every block change", () => {
  const route = readFileSync("app/api/notes/route.ts", "utf8");

  it("the PATCH recomputes it from the blocks it just wrote", () => {
    assert.ok(/patch\.flat_text = flattenBlocks\(\(written/.test(route),
      "flat_text is not regenerated from the rows that were written");
  });

  it("it is computed by the shared flattener, not a second copy", () => {
    assert.ok(route.includes('from "@/lib/notes"'));
    assert.ok(!/\.join\("\\n"\)/.test(route), "the route flattens blocks itself");
  });

  it("the route identifies the caller and ignores a brand in the body", () => {
    const handlers = (route.match(/export async function (GET|POST|PATCH|DELETE)/g) ?? []).length;
    const guards = (route.match(/await resolveBrand\(req\)/g) ?? []).length;
    assert.equal(guards, handlers, `${handlers} handlers, ${guards} guards`);
    assert.ok(!/body\.brand_?[Ii]d/.test(route), "reads a brand id off the body");
  });

  it("deleting a note is soft, so criterion 12 can restore it", () => {
    const del = route.slice(route.indexOf("export async function DELETE"));
    assert.ok(del.includes("deleted_at"), "the delete is hard");
    assert.ok(!/\.delete\(\)/.test(del), "the note row is actually removed");
  });
});

/** CRITERION 4: no image may exist only inside a note. */
describe("a dragged file reaches Knowledge before it reaches the note", () => {
  const page = readFileSync("app/(app)/studio/notes/page.tsx", "utf8");
  const upload = readFileSync("lib/brand-image-upload.ts", "utf8");

  it("the editor has no uploader of its own", () => {
    assert.ok(!/storage\s*\n?\s*\.from\(/.test(page), "the note editor uploads to storage itself");
    assert.ok(!/from\("brand_images"\)[\s\S]{0,40}\.insert\(/.test(page),
      "the note editor writes brand_images itself");
    assert.ok(page.includes("uploadBrandImage("), "it does not use the shared uploader");
  });

  it("the block is placed only after the row exists", () => {
    const drop = page.slice(page.indexOf("async function onDrop"), page.indexOf("function toggleWidth"));
    const failAt = drop.indexOf('"failure" in result');
    const insertAt = drop.indexOf("insertImage(");
    assert.ok(failAt > -1 && insertAt > failAt,
      "a block can be placed before the upload is known to have worked");
    assert.ok(/return;/.test(drop.slice(failAt, insertAt)), "a failed upload still places a block");
  });

  it("the uploader writes the row and returns its id", () => {
    assert.ok(upload.includes('.from("brand_images")'));
    assert.ok(/\.select\("id, file_url, file_name"\)/.test(upload), "the id is not returned");
  });

  it("and reports a failure rather than returning a block to place", () => {
    assert.ok(upload.includes("storageError"), "the storage error is discarded");
    assert.ok(/Uploaded, but not saved to Knowledge/.test(upload),
      "an orphaned upload is not distinguished from a working one");
  });

  it("the block stores the id, not the URL", () => {
    assert.ok(/kind: "image", image_id: picked\.id/.test(page),
      "the block would keep pointing at a dead file after a delete");
  });
});

/** CRITERION 5. */
describe("the width toggle", () => {
  it("flips between full and half", () => {
    assert.equal(nextWidth("full"), "half");
    assert.equal(nextWidth("half"), "full");
    assert.equal(nextWidth(undefined), "half", "a block with no width defaults to full");
  });

  it("names the state it is in", () => {
    assert.equal(widthLabel("half"), "Half width");
    assert.equal(widthLabel("full"), "Full width");
    assert.equal(widthLabel(undefined), "Full width");
  });

  it("half floats left and full does not", () => {
    const css = readFileSync("app/(app)/studio/notes/notes.module.css", "utf8");
    const half = css.slice(css.indexOf(".half {"), css.indexOf("}", css.indexOf(".half {")));
    const full = css.slice(css.indexOf(".full {"), css.indexOf("}", css.indexOf(".full {")));
    assert.match(half, /float:\s*left/, "half does not float, so text cannot run beside it");
    assert.match(full, /float:\s*none/, "full floats, so text would wrap around it too");
    assert.match(half, /width:\s*4\d%/, "half is not roughly half the column");
  });

  it("the toggle is on the image, on hover", () => {
    const css = readFileSync("app/(app)/studio/notes/notes.module.css", "utf8");
    assert.match(css, /\.imageBlock:hover \.widthBtn/, "the control is not revealed on hover");
    assert.match(css, /\.widthBtn:focus-visible/, "the control is unreachable by keyboard");
  });
});
