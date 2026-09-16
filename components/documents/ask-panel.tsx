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
import { DOC_TYPES, docTypeLabel, studioMayUse } from "@/lib/document-types";
import {
  type Batch, setBatchType, overrideType, overrideDescription, stillUploading,
} from "@/lib/document-batch";
import p from "./ask-panel.module.css";
import { useT } from "@/lib/i18n/use-t.tsx";

export default function AskPanel({
  batch, onChange, onSave, onSkip, saving,
}: {
  batch: Batch;
  onChange: (next: Batch) => void;
  onSave: () => void;
  onSkip: () => void;
  saving: boolean;
}) {
  const t = useT();
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
    <div className={p.panel} role="dialog" aria-label={t("ask.whatAreThese")}>
      <div className={p.head}>
        <div>
          <h2 className={p.title}>
            {t(count === 1 ? "ask.uploadingOne" : "ask.uploadingMany", { count })}
          </h2>
          {/* The upload state is shown, not enforced. Save stays live. */}
          <p className={p.sub} data-uploading={inFlight ? "yes" : "no"}>
            {inFlight ? t("ask.stillUploading") : t("ask.allUploaded")}
          </p>
        </div>
        <div className={p.headActs}>
          <button type="button" className={p.skip} onClick={onSkip} disabled={saving}>
            {t("common.skip")}
          </button>
          <button type="button" className={p.save} onClick={onSave} disabled={saving}>
            {saving ? t("settings.saving") : t("files.save")}
          </button>
        </div>
      </div>

      <label className={p.field}>
        <span className={p.lab}>{t("docs.whatIsThis")}</span>
        <textarea
          className={p.textarea}
          rows={3}
          placeholder={t("ask.descriptionPlaceholder")}
          value={batch.description}
          onChange={(e) => onChange({ ...batch, description: e.target.value })}
          aria-label={t("ask.description")}
        />
        <span className={p.help}>{t("ask.typeHelp")}</span>
      </label>

      <label className={p.field}>
        <span className={p.lab}>{t("common.type")}</span>
        <select
          className={p.select}
          value={batch.docTypeId}
          onChange={(e) => onChange(setBatchType(batch, e.target.value, edited))}
          aria-label={t("ask.documentType")}
        >
          {DOC_TYPES.map((dt) => (
            <option key={dt.id} value={dt.id}>{t(dt.labelKey)}</option>
          ))}
        </select>
        <span className={p.help}>{t("ask.titleFromFilename")}</span>
      </label>

      {/* Criterion 6 is step 3's, but the consequence is shown here as soon as
          the type says contract — a person should learn it at the moment they
          choose, not afterwards. */}
      {contract && (
        <p className={p.contract}>
          <strong>{t("ask.notUsedInContent")}</strong> {t("documents.contractNoteRest")}
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
            {expanded ? t("ask.hideFiles") : t("ask.setOneDifferently", { count })}
            {overridden && <span className={p.dot} aria-label={t("ask.someFilesDiffer")} />}
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
                    aria-label={t("ask.typeFor", { name: f.name })}
                  >
                    {DOC_TYPES.map((dt) => (
                      <option key={dt.id} value={dt.id}>{t(dt.labelKey)}</option>
                    ))}
                  </select>
                  <input
                    className={p.fdesc}
                    placeholder={batch.description || t("ask.sameAsAbove")}
                    value={f.description ?? ""}
                    onChange={(e) => onChange(overrideDescription(batch, f.tempId, e.target.value))}
                    aria-label={t("ask.descriptionFor", { name: f.name })}
                  />
                  {!f.documentId && <span className={p.pending}>{t("ask.uploadingTag")}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className={p.foot}>
        {/* B carries its own leading space in English and a comma in Finnish,
            so nothing goes between </strong> and it. */}
        {t("ask.skipKeepsA")}{" "}<strong>{t("ask.notDescribed")}</strong>{t("ask.skipKeepsB")}
      </p>
      <span className={p.hiddenState} data-batch-type={batch.docTypeId}
            data-shown-label={docTypeLabel(batch.docTypeId)} />
    </div>
  );
}
