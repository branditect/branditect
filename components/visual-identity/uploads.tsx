"use client";

/**
 * Adding a logo, a colour or a typeface, on the page that shows them.
 *
 * These moved off Studio ▸ Brand assets, which was a second home for the brand
 * library: Visual identity displayed everything and could change nothing, so
 * its own empty states sent people into Studio to upload. The controls live
 * beside the thing they change now, and the Studio page is gone.
 *
 * Every call goes through authedFetch. The endpoints used to take a brandId
 * from the request body while running on the service key, which meant anyone
 * could write into any brand; they now resolve the brand from the caller's
 * token, so a request without one fails rather than succeeding against someone
 * else's library.
 */

import { useRef, useState } from "react";
import Icon from "@/components/icon";
import { authedFetch, authedJson } from "@/lib/authed-fetch";
import {
  UPLOAD_SLOTS, FONT_ROLES, googleFontUrl, normaliseHex, logoUploadType,
} from "@/lib/visual-identity";
import u from "./uploads.module.css";
import { useT } from "@/lib/i18n/use-t.tsx";

function Panel({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const t = useT();
  return (
    <div className={u.panel}>
      <button type="button" className={u.close} onClick={onClose} aria-label={t("common.close")}>
        <Icon name="close" size={12} />
      </button>
      {children}
    </div>
  );
}

/* ── logos ─────────────────────────────────────────────────────────────── */

export function AddLogo({
  brandId, onDone, variant = "act",
}: { brandId: string; onDone: () => void; variant?: "act" | "empty" }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState<string>("primary");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function send(files: FileList | null) {
    if (!files?.[0]) return;
    setBusy(true); setError(null);
    const fd = new FormData();
    fd.append("file", files[0]);
    fd.append("brandId", brandId);
    fd.append("uploadType", logoUploadType(slot));
    // fetch resolves on 4xx and 5xx. Reading json.success without checking
    // res.ok is how an upload reports "done" and saves nothing.
    try {
      const res = await authedFetch("/api/brand-assets/upload", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setError(json.error ?? t("uploads.uploadFailedStatus", { status: res.status }));
      } else {
        setOpen(false);
        onDone();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("docs.uploadFailed"));
    }
    setBusy(false);
  }

  return (
    <div className={u.wrap}>
      <button
        type="button"
        className={variant === "empty" ? u.emptyBtn : u.trigger}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="upload" size={variant === "empty" ? 14 : 12} />
        {t("vupload.logo")}
      </button>

      {open && (
        <Panel onClose={() => setOpen(false)}>
          <div className={u.plab}>{t("vupload.whichVersion")}</div>
          <div className={u.slots}>
            {UPLOAD_SLOTS.map((sl) => (
              <button
                key={sl.slot}
                type="button"
                className={`${u.slot} ${slot === sl.slot ? u.slotOn : ""}`}
                onClick={() => setSlot(sl.slot)}
              >
                <span className={u.slotL}>{t(sl.labelKey)}</span>
                <span className={u.slotH}>{t(sl.hintKey)}</span>
              </button>
            ))}
          </div>
          <p className={u.note}>
            {t("vupload.logoHelp")}
          </p>
          <button
            type="button"
            className={u.go}
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            {busy ? t("vi.uploading") : t("vi.chooseFile")}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.svg"
            className={u.hidden}
            onChange={(e) => { send(e.target.files); e.target.value = ""; }}
          />
          {error && <p className={u.err} role="alert">{error}</p>}
        </Panel>
      )}
    </div>
  );
}

/* ── colour ────────────────────────────────────────────────────────────── */

export function AddColour({
  brandId, onDone, variant = "act",
}: { brandId: string; onDone: () => void; variant?: "act" | "empty" }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shotRef = useRef<HTMLInputElement>(null);

  const parsed = normaliseHex(hex);

  async function save() {
    if (!parsed) { setError(t("uploads.notHex")); return; }
    setBusy(true); setError(null);
    const res = await authedJson("/api/brand-book/color", "POST", {
      brandId, hex: parsed, name: name.trim() || "Untitled",
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(json.error ?? t("uploads.couldNotSaveStatus", { status: res.status })); return; }
    setHex(""); setName(""); setOpen(false);
    onDone();
  }

  async function extract(files: FileList | null) {
    if (!files?.[0]) return;
    setBusy(true); setError(null);
    const fd = new FormData();
    fd.append("file", files[0]);
    fd.append("brandId", brandId);
    fd.append("uploadType", "color_screenshot");
    fd.append("extractColors", "true");
    const res = await authedFetch("/api/brand-assets/upload", { method: "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(json.error ?? t("uploads.extractionFailedStatus", { status: res.status })); return; }
    if (!json.colors?.length) { setError(t("uploads.noColoursFound")); return; }
    setOpen(false);
    onDone();
  }

  return (
    <div className={u.wrap}>
      <button
        type="button"
        className={variant === "empty" ? u.emptyBtn : u.trigger}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="plus" size={variant === "empty" ? 14 : 12} />
        {t("vupload.addColour")}
      </button>

      {open && (
        <Panel onClose={() => setOpen(false)}>
          <div className={u.plab}>{t("vupload.addOneColour")}</div>
          <div className={u.row}>
            <span
              className={u.preview}
              style={parsed ? { backgroundColor: parsed } : undefined}
              aria-hidden="true"
            />
            <input
              className={u.input}
              placeholder="#1a1a1a"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              aria-label={t("vupload.hex")}
            />
          </div>
          <input
            className={u.input}
            placeholder={t("vupload.colourRole")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label={t("vupload.colourName")}
          />
          <button type="button" className={u.go} disabled={busy || !parsed} onClick={save}>
            {busy ? t("settings.saving") : t("uploads.addColour")}
          </button>

          <div className={u.orLine}><span>{t("uploads.or")}</span></div>
          <button
            type="button"
            className={u.ghost}
            disabled={busy}
            onClick={() => shotRef.current?.click()}
          >
            <Icon name="img" size={12} />
            {t("vupload.fromScreenshot")}
          </button>
          <input
            ref={shotRef}
            type="file"
            accept="image/*"
            className={u.hidden}
            onChange={(e) => { extract(e.target.files); e.target.value = ""; }}
          />
          {error && <p className={u.err} role="alert">{error}</p>}
        </Panel>
      )}
    </div>
  );
}

/**
 * Changing a colour that is already there, or taking it out.
 *
 * A swatch was read-only: a hex typed one digit wrong had to be deleted and
 * added again, which put it at the end of the palette. Name, hex and role are
 * editable in place; removing asks twice, in the panel, rather than through a
 * browser dialog that blocks the page.
 */
export function EditColour({
  brandId, colour, onDone,
}: {
  brandId: string;
  colour: { id: string | number; hex: string | null; name: string | null; role?: string | null };
  onDone: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(colour.hex ?? "");
  const [name, setName] = useState(colour.name ?? "");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = normaliseHex(hex);

  async function save() {
    if (!parsed) { setError(t("uploads.notHex")); return; }
    setBusy(true); setError(null);
    const res = await authedJson("/api/brand-book/color", "PATCH", {
      // An emptied name is stored empty, not as the English word "Untitled":
      // the page already renders a blank name in the interface language.
      id: colour.id, brandId, hex: parsed, name: name.trim(),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(json.error ?? t("uploads.couldNotSaveStatus", { status: res.status })); return; }
    setOpen(false);
    onDone();
  }

  async function remove() {
    setBusy(true); setError(null);
    const res = await authedJson("/api/brand-book/delete", "DELETE", {
      id: colour.id, table: "brand_book_colors", brandId,
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(json.error ?? t("uploads.couldNotSaveStatus", { status: res.status })); return; }
    setConfirmRemove(false);
    setOpen(false);
    onDone();
  }

  return (
    <div className={u.wrap}>
      <button
        type="button"
        className={u.editDot}
        onClick={() => { setOpen((v) => !v); setConfirmRemove(false); }}
        aria-label={t("uploads.editColour", { name: colour.name ?? "" })}
      >
        <Icon name="pen" size={11} />
      </button>

      {open && (
        <Panel onClose={() => setOpen(false)}>
          <div className={u.plab}>{t("uploads.editColour", { name: colour.name ?? "" })}</div>
          <div className={u.row}>
            <span
              className={u.preview}
              style={parsed ? { backgroundColor: parsed } : undefined}
              aria-hidden="true"
            />
            <input
              className={u.input}
              placeholder="#1a1a1a"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              aria-label={t("vupload.hex")}
            />
          </div>
          <input
            className={u.input}
            placeholder={t("vupload.colourName")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label={t("vupload.colourName")}
          />
          <button type="button" className={u.go} disabled={busy || !parsed} onClick={save}>
            {busy ? t("settings.saving") : t("uploads.saveColour")}
          </button>

          {confirmRemove ? (
            <div className={u.confirmRow}>
              <button type="button" className={u.danger} disabled={busy} onClick={remove}>
                {t("uploads.removeConfirm")}
              </button>
              <button type="button" className={u.ghost} disabled={busy} onClick={() => setConfirmRemove(false)}>
                {t("common.cancel")}
              </button>
            </div>
          ) : (
            <button type="button" className={u.ghost} disabled={busy} onClick={() => setConfirmRemove(true)}>
              <Icon name="trash" size={12} /> {t("uploads.removeColour")}
            </button>
          )}

          {error && <div className={u.err}>{error}</div>}
        </Panel>
      )}
    </div>
  );
}

/* ── brand guideline ───────────────────────────────────────────────────── */

/**
 * The brand guideline PDF: the one asset the app asked for and could not take.
 *
 * Home's fourth readiness check is "upload your brand guideline" and it links
 * here, where there was nothing to press — `brand_visual.guideline_url` was
 * read in three places and written in none. Uploading also reads the palette
 * out of the file, because a guideline prints its colours with the hex codes
 * beside them, and typing those in again by hand is the thing being asked for.
 */
export function UploadGuideline({
  brandId, onDone, variant = "act", replace = false,
}: {
  brandId: string;
  onDone: (result: { colorsAdded: number }) => void;
  variant?: "act" | "empty";
  replace?: boolean;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function send(files: FileList | null) {
    if (!files?.[0]) return;
    setBusy(true); setError(null);
    const fd = new FormData();
    fd.append("file", files[0]);
    fd.append("brandId", brandId);
    try {
      const res = await authedFetch("/api/visual/guideline", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setError(json.error ?? t("uploads.uploadFailedStatus", { status: res.status }));
      } else {
        onDone({ colorsAdded: json.colorsAdded ?? 0 });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("docs.uploadFailed"));
    }
    setBusy(false);
  }

  return (
    <div className={u.wrap}>
      <button
        type="button"
        className={variant === "empty" ? u.emptyBtn : u.trigger}
        disabled={busy}
        onClick={() => fileRef.current?.click()}
      >
        <Icon name="upload" size={variant === "empty" ? 14 : 12} />
        {busy
          ? t("vupload.readingGuideline")
          : replace ? t("vupload.replaceGuideline") : t("vupload.uploadGuideline")}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,image/*"
        hidden
        onChange={(e) => send(e.target.files)}
      />
      {error && <div className={u.err}>{error}</div>}
    </div>
  );
}

/** Taking the guideline away. Asks twice, in place, and never with a dialog. */
export function RemoveGuideline({ brandId, onDone }: { brandId: string; onDone: () => void }) {
  const t = useT();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true); setError(null);
    const res = await authedJson("/api/visual/guideline", "DELETE", { brandId });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(json.error ?? t("uploads.couldNotSaveStatus", { status: res.status })); return; }
    setConfirm(false);
    onDone();
  }

  if (!confirm) {
    return (
      <button type="button" className={u.trigger} onClick={() => setConfirm(true)}>
        <Icon name="trash" size={12} /> {t("vupload.removeGuideline")}
      </button>
    );
  }
  return (
    <div className={u.confirmRow}>
      <button type="button" className={u.danger} disabled={busy} onClick={remove}>
        {busy ? t("settings.saving") : t("vupload.removeGuidelineConfirm")}
      </button>
      <button type="button" className={u.trigger} disabled={busy} onClick={() => setConfirm(false)}>
        {t("common.cancel")}
      </button>
      {error && <div className={u.err}>{error}</div>}
    </div>
  );
}

/* ── typefaces ─────────────────────────────────────────────────────────── */

export function AddTypeface({
  brandId, onDone, variant = "act",
}: { brandId: string; onDone: () => void; variant?: "act" | "empty" }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("body");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const family = name.trim();
    if (!family) { setError(t("vi.nameTypefaceFirst")); return; }
    setBusy(true); setError(null);
    const res = await authedJson("/api/brand-assets/font", "POST", {
      brandId, name: family, role, google_font_url: googleFontUrl(family),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(json.error ?? t("uploads.couldNotSaveStatus", { status: res.status })); return; }
    setName(""); setOpen(false);
    onDone();
  }

  return (
    <div className={u.wrap}>
      <button
        type="button"
        className={variant === "empty" ? u.emptyBtn : u.trigger}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="plus" size={variant === "empty" ? 14 : 12} />
        {t("vupload.addTypeface")}
      </button>

      {open && (
        <Panel onClose={() => setOpen(false)}>
          <div className={u.plab}>{t("vupload.googleFont")}</div>
          <input
            className={u.input}
            placeholder="DM Sans"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label={t("vupload.typefaceName")}
          />
          <div className={u.roles}>
            {FONT_ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`${u.role} ${role === r.id ? u.roleOn : ""}`}
                onClick={() => setRole(r.id)}
              >
                {t(r.labelKey)}
              </button>
            ))}
          </div>
          <p className={u.note}>
            {t("vi.specimenNote")}
          </p>
          <button type="button" className={u.go} disabled={busy || !name.trim()} onClick={save}>
            {busy ? t("settings.saving") : t("vi.addTypeface")}
          </button>
          {error && <p className={u.err} role="alert">{error}</p>}
        </Panel>
      )}
    </div>
  );
}
