/**
 * Studio ▸ Notes — the rules, as data.
 *
 * Step 1 of branditect-ui/spec/studio-notes.md, which replaces
 * spec/studio-library.md. A notes app: not a composer, not a post builder, not
 * a card wall. Left is a list, right is a document, and that is the whole
 * surface.
 *
 * Kept out of the components because the two things most likely to rot here
 * are both checkable: the toolbar accumulating buttons, and flat_text going
 * stale. Criterion 13 exists because this is the surface that will accumulate
 * buttons.
 */

/* ── the toolbar, criterion 13 ────────────────────────────────────────────── */

export interface ToolbarControl {
  id: string;
  label: string;
  /** Where it sits, left to right, with a separator between the groups. */
  group: "insert" | "block" | "note";
  title: string;
}

/**
 * EXACTLY SIX. The reference draws them as:
 *
 *     Image  │  Heading   List                    Saved    📌    PDF    ⋯
 *
 * Everything the previous draft had around them — source pills, product chips,
 * a voice panel, a pair composer — is gone. It was chrome around a text box,
 * and a note is a document.
 *
 * Adding a seventh is a product decision, not a tidy-up. The test on this
 * array is what makes that true rather than aspirational.
 */
export const TOOLBAR: ToolbarControl[] = [
  { id: "image", label: "Image", group: "insert", title: "Insert an image" },
  { id: "heading", label: "Heading", group: "block", title: "Heading" },
  { id: "list", label: "List", group: "block", title: "List" },
  { id: "pin", label: "", group: "note", title: "Pinned" },
  { id: "pdf", label: "PDF", group: "note", title: "Download as PDF" },
  { id: "more", label: "", group: "note", title: "More" },
];

/**
 * `Saved` is a status, not a control, and must never become a button.
 * Criterion 3: typing autosaves and there is no Save control anywhere in the
 * surface. It sits in the toolbar row, which is exactly why it is easy to
 * mistake for a seventh control when counting.
 */
export const SAVED_INDICATOR = { id: "saved", label: "Saved", isControl: false as const };

/* ── blocks ──────────────────────────────────────────────────────────────── */

export type BlockKind = "heading" | "text" | "list" | "image";
export const BLOCK_KINDS: BlockKind[] = ["heading", "text", "list", "image"];

export type BlockWidth = "full" | "half";

export interface NoteBlock {
  id?: string;
  kind: BlockKind;
  body?: string | null;
  /** Null once the picture is deleted from Knowledge. See criterion 10. */
  image_id?: string | null;
  width?: BlockWidth;
  caption?: string | null;
  /** 'chat' | 'write' | 'create_images' | 'manual'. Stored, never rendered. */
  source?: string | null;
  source_ref?: string | null;
  sort_order?: number;
}

/**
 * The formatting test is whether it survives being pasted somewhere else. A
 * heading degrades to a line and a bullet to a dash; tables, colours, fonts
 * and indents do not, and everything written here ends up in a caption field
 * or a product description.
 */
export const ALLOWED_FORMATTING = ["paragraph", "heading", "list", "image"];
export const REJECTED_FORMATTING = ["table", "colour", "font", "indent", "highlight"];

/* ── flat_text, criterion 11 ─────────────────────────────────────────────── */

/**
 * Flatten blocks for search, the card preview and the brain.
 *
 * Regenerated on every change rather than on a schedule: a competitor's price
 * written here should reach AI Chat, which is the only real reason notes
 * belong in this app rather than in the notes app already on the phone. A
 * preview built from stale flat_text is the same lie as a count that does not
 * match its grid.
 *
 * Captions are included because they are text somebody wrote. An image block
 * with no caption contributes nothing, rather than a placeholder that would
 * then be searchable.
 */
export function flattenBlocks(blocks: NoteBlock[]): string {
  return blocks
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((b) => (b.kind === "image" ? (b.caption ?? "") : (b.body ?? "")))
    .map((t) => String(t).trim())
    .filter(Boolean)
    .join("\n");
}

/** The card shows five lines of preview. */
export function previewOf(flatText: string | null | undefined, lines = 5): string {
  return String(flatText ?? "").split("\n").filter(Boolean).slice(0, lines).join("\n");
}

/* ── criterion 10, the merge blocker ─────────────────────────────────────── */

/**
 * An image block whose picture has been deleted from Knowledge.
 *
 * The row survives because image_id is ON DELETE SET NULL rather than CASCADE.
 * The block must still render, still hold its caption, and say the image is
 * gone — deleting a picture must never delete the paragraph beside it.
 */
export function imageIsMissing(block: NoteBlock): boolean {
  return block.kind === "image" && (block.image_id === null || block.image_id === undefined);
}

export const MISSING_IMAGE_NOTE = "This image was deleted from Knowledge. The text around it is untouched.";

/**
 * What survives when a picture is deleted. Used by the criterion-10 test and
 * by the editor, so the two cannot disagree about what "intact" means.
 */
export function afterImageDeleted(blocks: NoteBlock[], imageId: string): NoteBlock[] {
  return blocks.map((b) =>
    b.kind === "image" && b.image_id === imageId ? { ...b, image_id: null } : b,
  );
}

/* ── collecting, criteria 7 and 9 ────────────────────────────────────────── */

export const PIN_SOURCES = ["chat", "write", "create_images", "manual"] as const;
export type PinSource = (typeof PIN_SOURCES)[number];

/**
 * Criterion 9. Opening a note does not make it the collecting note —
 * re-reading something old must not silently redirect the next hour of work
 * into it. Written as a function so the rule is testable rather than a habit.
 */
export function collectingAfterOpen(
  currentCollectingId: string | null,
  openedId: string,
): string | null {
  void openedId;
  return currentCollectingId;
}

/** `Stop collecting here` clears it. With none set, the first pin asks once. */
export function needsCollectingPrompt(currentCollectingId: string | null): boolean {
  return currentCollectingId === null;
}

/** The pin control names the note it is adding to and does not ask again. */
export function pinLabel(noteTitle: string): string {
  return `Pin to · ${noteTitle}`;
}

/* ── the bin, criterion 12 ───────────────────────────────────────────────── */

export const RESTORE_WINDOW_DAYS = 30;

export function isRestorable(deletedAt: string | null | undefined, now: Date): boolean {
  if (!deletedAt) return false;
  const gone = new Date(deletedAt).getTime();
  if (Number.isNaN(gone)) return false;
  return now.getTime() - gone <= RESTORE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

/* ── the title ───────────────────────────────────────────────────────────── */

/** The column default. The card needs something to show, so the row keeps it. */
export const DEFAULT_TITLE = "Untitled";

/**
 * What the title input shows.
 *
 * The placeholder is already "Untitled", so rendering the same word as the
 * VALUE made a person delete it before they could name anything — and typing
 * without deleting produced "UntitledOctober plan", which is what the browser
 * check hit and what a person gets.
 *
 * Empty for the default, the real title otherwise. The row still reads
 * Untitled; only the input is blank.
 */
export function titleInputValue(stored: string | null | undefined): string {
  return !stored || stored === DEFAULT_TITLE ? "" : stored;
}

/**
 * What to write, or null to write nothing.
 *
 * A blank title must never be saved as an empty string: the card would show an
 * empty line where a name should be. Skipping the write leaves the row at
 * whatever it had, which for a new note is Untitled.
 */
/**
 * DECISION, not a consequence: clearing the title of a named note leaves the
 * name. Reverting to Untitled mid-edit would be worse with a debounce — clear
 * the field to retype it and a save could fire between the two, flipping the
 * card to Untitled while you are mid-word.
 */
export function titleToSave(input: string): string | null {
  const trimmed = input.trim();
  return trimmed === "" ? null : trimmed;
}

/* ── autosave, criterion 3 ───────────────────────────────────────────────── */

export interface NotePatch {
  title?: string;
  pinned?: boolean;
  blocks?: NoteBlock[];
}

/**
 * Merge a new edit into whatever is already waiting to be saved.
 *
 * The editor debounces, and the first version of it REPLACED the pending patch
 * on every keystroke instead of merging. Typing a title and then typing a
 * paragraph queued a title save, then a blocks save that cancelled it, and the
 * title was silently lost — the note kept saying Untitled while the screen
 * showed what had been typed and the indicator said Saved.
 *
 * Every unit test passed and the route returned 200 throughout. It took typing
 * into the real editor and reading the row back to see it.
 */
export function mergePatch(pending: NotePatch, next: NotePatch): NotePatch {
  return { ...pending, ...next };
}

/**
 * Whether a queued save belongs to the note now open. Switching notes with an
 * edit still in flight must not carry one note's title onto another.
 */
export function patchBelongsTo(pendingId: string | null, openId: string | null): boolean {
  return pendingId !== null && pendingId === openId;
}

/* ── one save at a time ──────────────────────────────────────────────────── */

/**
 * Two autosave requests could be in flight at once and land out of order. The
 * handler recomputed flat_text from the blocks IT was sent, so a slower
 * earlier request overwrote a newer one: the block body reached the database
 * while flat_text came from the older payload. One editor check in three lost
 * both the title and flat_text that way.
 *
 * Never more than one request in flight. Edits made while one is running
 * coalesce into a single pending patch and go out when it settles. Written as
 * a state machine rather than a pair of refs so the rule is testable — a
 * "never two at once" claim that only exists inside a component is a claim
 * nothing checks.
 */
export interface SaveQueue {
  inFlight: boolean;
  pendingId: string | null;
  pending: NotePatch;
}

export const emptyQueue: SaveQueue = { inFlight: false, pendingId: null, pending: {} };

/** Merge an edit in. An edit for a different note replaces rather than mixes. */
export function enqueue(q: SaveQueue, id: string, patch: NotePatch): SaveQueue {
  const sameNote = q.pendingId === null || q.pendingId === id;
  return {
    inFlight: q.inFlight,
    pendingId: id,
    pending: sameNote ? mergePatch(q.pending, patch) : { ...patch },
  };
}

/**
 * What to send now, if anything. Returns null while a request is in flight or
 * when there is nothing waiting — those are the two cases that must not start
 * a second request.
 */
export function takeNext(q: SaveQueue): {
  next: SaveQueue;
  send: { id: string; patch: NotePatch } | null;
} {
  if (q.inFlight || !q.pendingId || Object.keys(q.pending).length === 0) {
    return { next: q, send: null };
  }
  return {
    next: { inFlight: true, pendingId: null, pending: {} },
    send: { id: q.pendingId, patch: q.pending },
  };
}

/** The request finished, however it went. Anything queued behind it may go. */
export function settle(q: SaveQueue): SaveQueue {
  return { ...q, inFlight: false };
}

/** True when a save is running or waiting, so the indicator can say so. */
export function isBusy(q: SaveQueue): boolean {
  return q.inFlight || Object.keys(q.pending).length > 0;
}
