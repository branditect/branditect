/**
 * The answers panel's state, as data.
 *
 * Step 2 of branditect-ui/spec/document-upload-asks.md. Kept out of the
 * component so the batch rules can be tested: one set of answers applied to
 * every file, with a per-file override that touches only that file.
 *
 * The panel does not own the upload. Bytes start moving the instant files are
 * chosen and these rows are patched afterwards — a modal that holds a 40 MB PDF
 * hostage while someone types a sentence is how a person learns to hit Skip
 * every time.
 */

import { askedFields, detectDocType, type Category } from "./document-types.ts";

export interface BatchFile {
  /** Matches the tempId the uploader tracks, so a finished row can be attached. */
  tempId: string;
  name: string;
  /** Filled in once the insert returns. Null while the bytes are still moving. */
  documentId: string | null;
  /** null means "follow the batch answer"; a value is a per-file override. */
  docTypeId: string | null;
  description: string | null;
}

export interface Batch {
  files: BatchFile[];
  /** The answers that apply to every file that has not overridden them. */
  docTypeId: string;
  description: string;
}

/**
 * Open the panel for a set of chosen files.
 *
 * The batch type is the guess from the first file. Selecting a folder of
 * certificates and answering once is the point, and they will nearly always
 * agree; where they do not, each file keeps its own guess until the batch
 * answer is deliberately changed.
 */
export function makeBatch(files: { tempId: string; name: string }[]): Batch {
  return {
    files: files.map((f) => ({
      tempId: f.tempId,
      name: f.name,
      documentId: null,
      docTypeId: detectDocType(f.name),
      description: null,
    })),
    docTypeId: files.length ? detectDocType(files[0].name) : "other",
    description: "",
  };
}

/** Attach the row id once the insert comes back, so Save knows what to patch. */
export function attachDocument(batch: Batch, tempId: string, documentId: string): Batch {
  return {
    ...batch,
    files: batch.files.map((f) => (f.tempId === tempId ? { ...f, documentId } : f)),
  };
}

/**
 * Change the batch answer. Files that were never individually edited follow it;
 * a file the person has already corrected keeps its own answer, because
 * silently overwriting a correction is worse than not offering the batch field.
 */
export function setBatchType(batch: Batch, docTypeId: string, edited: Set<string>): Batch {
  return {
    ...batch,
    docTypeId,
    files: batch.files.map((f) =>
      edited.has(f.tempId) ? f : { ...f, docTypeId },
    ),
  };
}

/** A per-file override. Touches exactly one file. */
export function overrideType(batch: Batch, tempId: string, docTypeId: string): Batch {
  return {
    ...batch,
    files: batch.files.map((f) => (f.tempId === tempId ? { ...f, docTypeId } : f)),
  };
}

export function overrideDescription(batch: Batch, tempId: string, description: string): Batch {
  return {
    ...batch,
    files: batch.files.map((f) => (f.tempId === tempId ? { ...f, description } : f)),
  };
}

/** What a single file resolves to, batch answer plus any override. */
export function resolved(batch: Batch, file: BatchFile): {
  description: string | null; doc_type: string; category: Category; use_in_output: boolean;
} {
  return askedFields({
    docTypeId: file.docTypeId ?? batch.docTypeId,
    description: file.description ?? batch.description,
    filename: file.name,
  });
}

/**
 * The updates Save writes. Only files whose row exists are included — a file
 * still uploading has nothing to patch yet, and the caller retries those once
 * their insert returns.
 */
export function saveUpdates(batch: Batch): {
  documentId: string;
  fields: ReturnType<typeof resolved>;
}[] {
  return batch.files
    .filter((f) => f.documentId !== null)
    .map((f) => ({ documentId: f.documentId as string, fields: resolved(batch, f) }));
}

/** True while any file in the batch is still uploading. */
export function stillUploading(batch: Batch): boolean {
  return batch.files.some((f) => f.documentId === null);
}

/**
 * Criterion 4. Skip writes nothing: the row already carries the guessed type
 * from its insert, and leaving the description null is what puts the file under
 * `Not described yet`. There is deliberately no update here — a Skip that wrote
 * an empty description would take the file out of the queue it belongs in.
 */
export function skipChangesNothing(): true {
  return true;
}

/** Criterion 4: the queue at the top of the library. */
export function isUndescribed(doc: { description?: string | null }): boolean {
  const d = doc.description;
  return d === null || d === undefined || String(d).trim() === "";
}

/**
 * Criterion 4 again: `Not described yet` first, then everything else. Stable
 * within each group, so an existing sort is preserved.
 */
export function undescribedFirst<T extends { description?: string | null }>(docs: T[]): T[] {
  const undescribed = docs.filter(isUndescribed);
  const rest = docs.filter((d) => !isUndescribed(d));
  return [...undescribed, ...rest];
}
