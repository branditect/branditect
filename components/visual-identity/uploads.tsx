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

function Panel({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className={u.panel}>
      <button type="button" className={u.close} onClick={onClose} aria-label="Close">
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
        setError(json.error ?? `Upload failed (${res.status})`);
      } else {
        setOpen(false);
        onDone();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
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
        Upload a logo
      </button>

      {open && (
        <Panel onClose={() => setOpen(false)}>
          <div className={u.plab}>Which version is this?</div>
          <div className={u.slots}>
            {UPLOAD_SLOTS.map((sl) => (
              <button
                key={sl.slot}
                type="button"
                className={`${u.slot} ${slot === sl.slot ? u.slotOn : ""}`}
                onClick={() => setSlot(sl.slot)}
              >
                <span className={u.slotL}>{sl.label}</span>
                <span className={u.slotH}>{sl.hint}</span>
              </button>
            ))}
          </div>
          <p className={u.note}>
            SVG or PNG. Uploading to a slot that already has a file replaces it.
          </p>
          <button
            type="button"
            className={u.go}
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            {busy ? "Uploading…" : "Choose a file"}
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
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shotRef = useRef<HTMLInputElement>(null);

  const parsed = normaliseHex(hex);

  async function save() {
    if (!parsed) { setError("That is not a hex colour — try #1a1a1a"); return; }
    setBusy(true); setError(null);
    const res = await authedJson("/api/brand-book/color", "POST", {
      brandId, hex: parsed, name: name.trim() || "Untitled",
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(json.error ?? `Could not save (${res.status})`); return; }
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
    if (!res.ok) { setError(json.error ?? `Extraction failed (${res.status})`); return; }
    if (!json.colors?.length) { setError("No colours found — try a clearer screenshot"); return; }
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
        Add a colour
      </button>

      {open && (
        <Panel onClose={() => setOpen(false)}>
          <div className={u.plab}>Add one colour</div>
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
              aria-label="Hex value"
            />
          </div>
          <input
            className={u.input}
            placeholder="What it is for — Primary, Ink, Wash"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Colour name"
          />
          <button type="button" className={u.go} disabled={busy || !parsed} onClick={save}>
            {busy ? "Saving…" : "Add colour"}
          </button>

          <div className={u.orLine}><span>or</span></div>
          <button
            type="button"
            className={u.ghost}
            disabled={busy}
            onClick={() => shotRef.current?.click()}
          >
            <Icon name="img" size={12} />
            Pull them out of a screenshot
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
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("body");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const family = name.trim();
    if (!family) { setError("Name the typeface first"); return; }
    setBusy(true); setError(null);
    const res = await authedJson("/api/brand-assets/font", "POST", {
      brandId, name: family, role, google_font_url: googleFontUrl(family),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(json.error ?? `Could not save (${res.status})`); return; }
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
        Add a typeface
      </button>

      {open && (
        <Panel onClose={() => setOpen(false)}>
          <div className={u.plab}>A Google font, by name</div>
          <input
            className={u.input}
            placeholder="DM Sans"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Typeface name"
          />
          <div className={u.roles}>
            {FONT_ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`${u.role} ${role === r.id ? u.roleOn : ""}`}
                onClick={() => setRole(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <p className={u.note}>
            The specimen on this page is set in the real typeface, so a name that is not on Google
            Fonts will show as a fallback rather than silently look right.
          </p>
          <button type="button" className={u.go} disabled={busy || !name.trim()} onClick={save}>
            {busy ? "Saving…" : "Add typeface"}
          </button>
          {error && <p className={u.err} role="alert">{error}</p>}
        </Panel>
      )}
    </div>
  );
}
