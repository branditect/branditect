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

  const confirm = confirmState(imageIds.length, picked.size);

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
    if (!res.ok) { setError(json.error ?? `Could not tag (${res.status})`); return; }
    onTagged(json.inserted ?? 0);
  }

  return (
    <div className={s.backdrop} onClick={onClose}>
      <div
        className={s.panel}
        role="dialog"
        aria-label="Tag to a product"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={s.head}>
          <div>
            <h2 className={s.title}>Tag to a product</h2>
            <p className={s.sub}>
              {imageIds.length === 1
                ? "This image will show on the product's card."
                : `${imageIds.length} images will show on the product's card.`}
            </p>
          </div>
          <button type="button" className={s.close} onClick={onClose} aria-label="Close">
            <Icon name="close" size={13} />
          </button>
        </div>

        {matchWord && (
          <p className={s.match}>
            Opened from a suggestion on <b>{matchWord}</b>. Nothing is tagged until you confirm.
          </p>
        )}

        <input
          ref={inputRef}
          className={s.search}
          placeholder="Search products by name or SKU"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search products by name or SKU"
        />

        {products === null ? (
          <p className={s.note}>Loading…</p>
        ) : shown.length === 0 ? (
          <p className={s.note}>
            {products.length === 0
              ? "No products yet. Add one in Knowledge ▸ Products first."
              : `Nothing matches “${query}”.`}
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
                    aria-label={`Tag to ${p.name}`}
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
            Cancel
          </button>
          <button
            type="button"
            className={s.go}
            onClick={save}
            disabled={confirm.disabled || busy}
          >
            {busy ? "Tagging…" : confirm.label}
          </button>
        </div>
      </div>
    </div>
  );
}
