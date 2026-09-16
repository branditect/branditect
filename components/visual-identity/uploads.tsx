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
