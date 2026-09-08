"use client";

/**
 * Studio ▸ Notes.
 *
 * Step 2 of branditect-ui/spec/studio-notes.md: the list, the cards, the
 * editor with text, heading and list blocks, and autosaving. Criteria 1, 3
 * and 11.
 *
 * Left is the count, a +, a search box and a two-up grid of cards. Right is
 * the note: a title and a document. That is the whole surface, and the toolbar
 * is the six controls in lib/notes.ts and no more.
 *
 * Images, the collecting note and PDF are steps 3, 4 and 6. The controls for
 * them are present because the toolbar is fixed at six by criterion 13, and
 * each says what it is waiting for rather than doing nothing quietly.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBrand } from "@/lib/useBrand";
import { authedFetch, authedJson } from "@/lib/authed-fetch";
import Icon from "@/components/icon";
import {
  TOOLBAR, SAVED_INDICATOR, flattenBlocks, previewOf, imageIsMissing,
  MISSING_IMAGE_NOTE, mergePatch, patchBelongsTo, titleInputValue, titleToSave,
  type NoteBlock, type NotePatch,
} from "@/lib/notes";
import s from "./notes.module.css";

interface NoteRow {
  id: string;
  title: string;
  flat_text: string | null;
  pinned: boolean;
  collecting: boolean;
  updated_at: string;
}

const AUTOSAVE_MS = 900;

export default function NotesPage() {
  const { brandId, loading: brandLoading } = useBrand();
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<NoteBlock[]>([]);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    if (!brandId || brandId === "default") { setLoading(false); return; }
    const res = await authedFetch("/api/notes");
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.error ?? "Could not load your notes."); setLoading(false); return; }
    setNotes(json.notes ?? []);
    setLoading(false);
  }, [brandId]);

  useEffect(() => { if (!brandLoading) loadNotes(); }, [brandLoading, loadNotes]);

  const openNote = useCallback(async (id: string) => {
    // CRITERION 9's counterpart: opening a note does not make it the
    // collecting note. Nothing here writes `collecting`.
    setOpenId(id);
    setSaving("idle");
    const res = await authedFetch(`/api/notes/blocks?note_id=${id}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.error ?? "Could not open that note."); return; }
    setTitle(titleInputValue(json.note?.title));
    setBlocks(json.blocks ?? []);
  }, []);

  /**
   * CRITERION 3. Typing autosaves, and there is no Save control anywhere. The
   * debounce is here rather than per keystroke so a note is not rewritten
   * thirty times a sentence.
   */
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatch = useRef<{ id: string | null; patch: NotePatch }>({ id: null, patch: {} });

  const queueSave = useCallback((next: NotePatch) => {
    if (!openId) return;
    if (pendingPatch.current.id && !patchBelongsTo(pendingPatch.current.id, openId)) {
      const stale = pendingPatch.current;
      void authedJson("/api/notes", "PATCH", { id: stale.id, ...stale.patch });
      pendingPatch.current = { id: null, patch: {} };
    }
    pendingPatch.current = {
      id: openId,
      patch: mergePatch(pendingPatch.current.patch, next),
    };
    if (timer.current) clearTimeout(timer.current);
    setSaving("saving");
    timer.current = setTimeout(async () => {
      const { id, patch } = pendingPatch.current;
      pendingPatch.current = { id: null, patch: {} };
      const res = await authedJson("/api/notes", "PATCH", { id, ...patch });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // A save that fails must say so. Silence here is how an afternoon's
        // writing is lost while the screen looks fine.
        setError(json.error ?? "Not saved. Your changes are still on screen.");
        setSaving("idle");
        return;
      }
      setError(null);
      setSaving("saved");
      setNotes((prev) => prev.map((n) => (n.id === openId ? { ...n, ...json.note } : n)));
    }, AUTOSAVE_MS);
  }, [openId]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function editTitle(value: string) {
    setTitle(value);
    const next = titleToSave(value);
    // A blank title is not written. The row keeps what it had, so the card
    // never shows an empty line where a name should be.
    if (next === null) return;
    queueSave({ title: next });
  }

  function editBlock(index: number, body: string) {
    const next = blocks.map((b, i) => (i === index ? { ...b, body } : b));
    setBlocks(next);
    queueSave({ blocks: next });
  }

  function addBlock(kind: NoteBlock["kind"]) {
    const next = [...blocks, { kind, body: "", sort_order: blocks.length }];
    setBlocks(next);
    queueSave({ blocks: next });
  }

  async function newNote() {
    const res = await authedJson("/api/notes", "POST", {});
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.error ?? "Could not make a note."); return; }
    setNotes((prev) => [json.note, ...prev]);
    setTitle(titleInputValue(json.note.title));
    setBlocks([]);
    setOpenId(json.note.id);
  }

  function onToolbar(id: string) {
    if (id === "heading") return addBlock("heading");
    if (id === "list") return addBlock("list");
    if (id === "pin") return togglePin();
    // Image and PDF are steps 3 and 6. Say so rather than doing nothing.
    setPending(id === "image"
      ? "Inserting an image lands with the library picker."
      : id === "pdf"
        ? "Download as PDF is built server-side, and is not wired up yet."
        : "Nothing else lives here yet.");
    window.setTimeout(() => setPending(null), 2600);
  }

  async function togglePin() {
    const note = notes.find((n) => n.id === openId);
    if (!note) return;
    const res = await authedJson("/api/notes", "PATCH", { id: openId, pinned: !note.pinned });
    if (!res.ok) { setError("Could not pin that."); return; }
    await loadNotes();
  }

  /** Criterion 2 is step 5; this is the same match over what is already loaded. */
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) =>
      n.title.toLowerCase().includes(q) || (n.flat_text ?? "").toLowerCase().includes(q));
  }, [notes, query]);

  const savedLabel = saving === "saving" ? "Saving…" : saving === "saved" ? SAVED_INDICATOR.label : "";

  return (
    <div className={s.wrap}>
      <aside className={s.left}>
        <div className={s.leftHead}>
          <span className={s.count}>{notes.length} note{notes.length === 1 ? "" : "s"}</span>
          <button type="button" className={s.new} onClick={newNote} aria-label="New note">
            <Icon name="plus" size={14} />
          </button>
        </div>
        <input
          className={s.search}
          placeholder="Search notes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search notes"
        />
        {loading ? (
          <p className={s.note}>Loading…</p>
        ) : shown.length === 0 ? (
          <p className={s.note}>
            {notes.length === 0
              ? "Nothing here yet. A note is a scratchpad — anything you write in one reaches AI Chat."
              : `Nothing matches “${query}”.`}
          </p>
        ) : (
          <div className={s.grid}>
            {shown.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => openNote(n.id)}
                className={`${s.card} ${openId === n.id ? s.cardOn : ""}`}
              >
                <span className={s.cardTitle}>
                  {n.pinned && <Icon name="target" size={10} />}
                  {n.title || "Untitled"}
                </span>
                <span className={s.cardPreview}>{previewOf(n.flat_text) || "Empty"}</span>
                <span className={s.cardDate}>
                  {new Date(n.updated_at).toLocaleDateString("en-GB",
                    { day: "numeric", month: "short" })}
                </span>
              </button>
            ))}
          </div>
        )}
      </aside>

      <section className={s.right}>
        {!openId ? (
          <p className={s.note}>Pick a note, or start one.</p>
        ) : (
          <>
            <div className={s.toolbar} role="toolbar" aria-label="Note">
              {TOOLBAR.map((c, i) => (
                <span key={c.id} className={s.tbSlot}>
                  {i === 1 && <span className={s.sep} aria-hidden="true" />}
                  {c.id === "pin" && <span className={s.spacer} />}
                  {c.id === "pin" && (
                    <span className={s.saved} data-saved>{savedLabel}</span>
                  )}
                  <button
                    type="button"
                    className={s.tb}
                    title={c.title}
                    aria-label={c.title}
                    onClick={() => onToolbar(c.id)}
                  >
                    {c.label || <Icon name={c.id === "pin" ? "target" : "arrow"} size={12} />}
                  </button>
                </span>
              ))}
            </div>

            {pending && <p className={s.pending}>{pending}</p>}
            {error && <p className={s.err} role="alert">{error}</p>}

            <input
              className={s.title}
              value={title}
              onChange={(e) => editTitle(e.target.value)}
              placeholder="Untitled"
              aria-label="Note title"
            />

            <div className={s.body}>
              {blocks.length === 0 && (
                <p className={s.note}>Start typing. It saves as you go.</p>
              )}
              {blocks.map((b, i) => (
                <div key={b.id ?? i}>
                  {b.kind === "image" ? (
                    <div className={s.imageBlock}>
                      {imageIsMissing(b)
                        ? <p className={s.missing}>{MISSING_IMAGE_NOTE}</p>
                        : <p className={s.note}>Image</p>}
                      {b.caption && <p className={s.caption}>{b.caption}</p>}
                    </div>
                  ) : (
                    <textarea
                      className={`${s.block} ${b.kind === "heading" ? s.heading : ""} ${b.kind === "list" ? s.list : ""}`}
                      value={b.body ?? ""}
                      onChange={(e) => editBlock(i, e.target.value)}
                      placeholder={b.kind === "heading" ? "Heading" : b.kind === "list" ? "One item per line" : "Write"}
                      aria-label={`${b.kind} block`}
                      rows={b.kind === "heading" ? 1 : 3}
                    />
                  )}
                </div>
              ))}
              <button type="button" className={s.addText} onClick={() => addBlock("text")}>
                <Icon name="plus" size={11} /> Paragraph
              </button>
            </div>

            <p className={s.flat} data-flat-length={flattenBlocks(blocks).length} aria-hidden="true" />
          </>
        )}
      </section>
    </div>
  );
}
