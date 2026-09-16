/**
 * Turn an answer from AI Chat into a real note.
 *
 * The panel's old "save" wrote to localStorage under `andy_saved` and showed
 * the result in a tab inside the panel, so what it saved was not in Studio ▸
 * Notes, was not in the brand brain, and did not survive a different browser.
 * This writes a note the same way the editor does: create, then send the
 * title and blocks through PATCH, which is what recomputes `flat_text`.
 *
 * `source: "chat"` is stored on the block (see supabase/studio-notes.sql) so a
 * note can say where it came from later without guessing.
 */
import { authedJson } from "./authed-fetch.ts";
import { noteTitleFrom } from "./notes.ts";

export { noteTitleFrom };

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveAnswerAsNote(
  answer: string,
  title: string,
): Promise<SaveResult> {
  try {
    const created = await authedJson("/api/notes", "POST", {});
    const createdBody = await created.json();
    // supabase-js style { error } bodies resolve rather than throw, so an
    // unchecked call here would report a note that was never written.
    if (!created.ok || !createdBody?.note?.id) {
      return { ok: false, error: createdBody?.error ?? String(created.status) };
    }
    const id: string = createdBody.note.id;
    const saved = await authedJson("/api/notes", "PATCH", {
      id,
      title,
      blocks: [{ kind: "text", body: answer, source: "chat" }],
    });
    const savedBody = await saved.json();
    if (!saved.ok) return { ok: false, error: savedBody?.error ?? String(saved.status) };
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "fetch failed" };
  }
}
