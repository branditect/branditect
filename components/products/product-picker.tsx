"use client";

/**
 * Pick products to tag images to.
 *
 * ONE component, three entry points — Knowledge ▸ Images (a tile or a
 * selection), the product card's Media tab, and later the document upload
 * panel. Criterion 8 of branditect-ui/spec/knowledge-images.md exists because
 * building it three times is how three behaviours appear.
 *
 * Not to be confused with components/products/image-picker.tsx, which chooses
 * one image and returns a URL for the product hero. This picks products.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { authedJson } from "@/lib/authed-fetch";
import {
  productMatches, confirmState, type PickableProduct,
} from "@/lib/product-picker";
import Icon from "@/components/icon";
import { useT } from "@/lib/i18n/use-t.tsx";
import s from "./product-picker.module.css";

export default function ProductPicker({
  brandId, imageIds, onClose, onTagged, matchWord,
}: {
  brandId: string;
  /** The images being tagged. One from a tile, many from a selection. */
  imageIds: string[];
  onClose: () => void;
  onTagged: (inserted: number) => void;
  /** Set when the caller opened this from a suggestion, so it can be shown. */
  matchWord?: string | null;
}) {
  const t = useT();
  const [products, setProducts] = useState<PickableProduct[] | null>(null);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error: err } = await supabase
        .from("catalog_products")
        .select("id, name, sku")
        .eq("brand_id", brandId)
        .order("name");
      if (!alive) return;
      if (err) { setError(err.message); setProducts([]); return; }
      setProducts((data ?? []) as PickableProduct[]);
    })();
    return () => { alive = false; };
  }, [brandId]);

  useEffect(() => { inputRef.current?.focus(); }, [products]);

  const shown = useMemo(
    () => (products ?? []).filter((p) => productMatches(p, query)),
    [products, query],
  );

  const confirm = confirmState(imageIds.length, picked.size, t);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function save() {
    setBusy(true); setError(null);
    const res = await authedJson("/api/products/attachments", "POST", {
      imageIds, productIds: Array.from(picked),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    // fetch resolves on 4xx and 5xx. Reading json without checking res.ok is
    // how a tag reports success and writes nothing.
    if (!res.ok) { setError(json.error ?? t("picker.couldNotTag", { status: res.status })); return; }
    onTagged(json.inserted ?? 0);
  }

  return (
    <div className={s.backdrop} onClick={onClose}>
      <div
        className={s.panel}
        role="dialog"
        aria-label={t("images.tagToProduct")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={s.head}>
          <div>
            <h2 className={s.title}>{t("images.tagToProduct")}</h2>
            <p className={s.sub}>
              {imageIds.length === 1
                ? t("picker.oneWillShow")
                : t("picker.nWillShow", { count: imageIds.length })}
            </p>
          </div>
          <button type="button" className={s.close} onClick={onClose} aria-label={t("common.close")}>
            <Icon name="close" size={13} />
          </button>
        </div>

        {matchWord && (
          <p className={s.match}>
            {(() => {
              // One sentence, split where the word goes, so Finnish can put it
              // where Finnish puts it.
              const [before, after = ""] = t("picker.openedFromSuggestion").split("{word}");
              return <>{before}<b>{matchWord}</b>{after}</>;
            })()}
          </p>
        )}

        <input
          ref={inputRef}
          className={s.search}
          placeholder={t("products.searchBySku")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t("products.searchBySku")}
        />

        {products === null ? (
          <p className={s.note}>{t("common.loading")}</p>
        ) : shown.length === 0 ? (
          <p className={s.note}>
            {products.length === 0
              ? t("picker.noProducts")
              : t("notes.noMatch", { query })}
          </p>
        ) : (
          <ul className={s.rows}>
            {shown.map((p) => (
              <li key={p.id}>
                <label className={`${s.row} ${picked.has(p.id) ? s.rowOn : ""}`}>
                  <input
                    type="checkbox"
                    checked={picked.has(p.id)}
                    onChange={() => toggle(p.id)}
                    aria-label={t("picker.tagToName", { name: p.name })}
                  />
                  <span className={s.nm}>{p.name}</span>
                  {p.sku && <span className={s.sku}>{p.sku}</span>}
                </label>
              </li>
            ))}
          </ul>
        )}

        {error && <p className={s.err} role="alert">{error}</p>}

        <div className={s.foot}>
          <button type="button" className={s.cancel} onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className={s.go}
            onClick={save}
            disabled={confirm.disabled || busy}
          >
            {busy ? t("picker.tagging") : confirm.label}
          </button>
        </div>
      </div>
    </div>
  );
}
