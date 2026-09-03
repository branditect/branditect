"use client";

/**
 * "What is this?" — the panel that opens the moment files are chosen.
 *
 * Step 2 of branditect-ui/spec/document-upload-asks.md. It does not own the
 * upload: the bytes are already moving when this appears, and Save patches rows
 * that exist by then. A modal that holds a 40 MB PDF hostage while someone
 * types a sentence is how a person learns to hit Skip every time.
 *
 * Description comes first because it is the only one of the three a person can
 * answer and a computer cannot.
 */

import { useState } from "react";
import Icon from "@/components/icon";
import { DOC_TYPES, docTypeLabel, studioMayUse, CONTRACT_NOTE } from "@/lib/document-types";
import {
  type Batch, setBatchType, overrideType, overrideDescription, stillUploading,
} from "@/lib/document-batch";
import p from "./ask-panel.module.css";

export default function AskPanel({
  batch, onChange, onSave, onSkip, saving,
}: {
  batch: Batch;
  onChange: (next: Batch) => void;
  onSave: () => void;
  onSkip: () => void;
  saving: boolean;
}) {
  const [edited, setEdited] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);
  const [overridden, setOverridden] = useState(false);

  const count = batch.files.length;
  const inFlight = stillUploading(batch);
  const contract = !studioMayUse(batch.docTypeId);

  function editFileType(tempId: string, typeId: string) {
    setEdited((prev) => new Set(prev).add(tempId));
    setOverridden(true);
    onChange(overrideType(batch, tempId, typeId));
  }

  return (
    <div className={p.panel} role="dialog" aria-label="What are these files?">
      <div className={p.head}>
        <div>
          <h2 className={p.title}>
            Uploading {count} file{count === 1 ? "" : "s"}
          </h2>
          {/* The upload state is shown, not enforced. Save stays live. */}
          <p className={p.sub} data-uploading={inFlight ? "yes" : "no"}>
            {inFlight
              ? "Still uploading — you can answer now, it saves when they land."
              : "All uploaded."}
          </p>
        </div>
        <div className={p.headActs}>
          <button type="button" className={p.skip} onClick={onSkip} disabled={saving}>
            Skip
          </button>
          <button type="button" className={p.save} onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <label className={p.field}>
        <span className={p.lab}>What is this?</span>
        <textarea
          className={p.textarea}
          rows={3}
          placeholder="Safety data sheet for the 500 ml bottle, TÜV tested Jan 2026"
          value={batch.description}
          onChange={(e) => onChange({ ...batch, description: e.target.value })}
          aria-label="Description"
        />
        <span className={p.help}>Studio reads this to decide when to cite the file.</span>
      </label>

      <label className={p.field}>
        <span className={p.lab}>Type</span>
        <select
          className={p.select}
          value={batch.docTypeId}
          onChange={(e) => onChange(setBatchType(batch, e.target.value, edited))}
          aria-label="Document type"
        >
          {DOC_TYPES.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        <span className={p.help}>Filled in from the file name. Change it if it is wrong.</span>
      </label>

      {/* Criterion 6 is step 3's, but the consequence is shown here as soon as
          the type says contract — a person should learn it at the moment they
          choose, not afterwards. */}
      {contract && (
        <p className={p.contract}>
          <strong>Not used in generated content.</strong> {CONTRACT_NOTE.replace("Not used in generated content. ", "")}
        </p>
      )}

      {count > 1 && (
        <div className={p.per}>
          <button
            type="button"
            className={p.disclose}
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            <Icon name={expanded ? "chevronLeft" : "chevronRight"} size={11} />
            {expanded ? "Hide the files" : `Set one file differently (${count})`}
            {overridden && <span className={p.dot} aria-label="some files differ" />}
          </button>

          {expanded && (
            <ul className={p.files}>
              {batch.files.map((f) => (
                <li key={f.tempId} className={p.file}>
                  <span className={p.fname} title={f.name}>{f.name}</span>
                  <select
                    className={p.fsel}
                    value={f.docTypeId ?? batch.docTypeId}
                    onChange={(e) => editFileType(f.tempId, e.target.value)}
                    aria-label={`Type for ${f.name}`}
                  >
                    {DOC_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                  <input
                    className={p.fdesc}
                    placeholder={batch.description || "Same as above"}
                    value={f.description ?? ""}
                    onChange={(e) => onChange(overrideDescription(batch, f.tempId, e.target.value))}
                    aria-label={`Description for ${f.name}`}
                  />
                  {!f.documentId && <span className={p.pending}>uploading</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className={p.foot}>
        Skip keeps the type above and no description. Files without one wait under{" "}
        <strong>Not described yet</strong> until you add it.
      </p>
      <span className={p.hiddenState} data-batch-type={batch.docTypeId}
            data-shown-label={docTypeLabel(batch.docTypeId)} />
    </div>
  );
}
