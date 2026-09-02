"use client";

import { useCallback, useEffect, useState } from "react";
import { Field, Panel, fieldClass, numStr, toNum } from "@/components/numbers/calc-shell";
import { formatMoney, type Product } from "@/lib/products";

/**
 * The per-product guardrails, in the room CLAUDE.md says pricing rules live.
 *
 * These moved off the product card, but only the room changed. The columns are
 * the same, the enforcement is the same, and the live pricing page says in
 * writing that offers are "checked against your floor price before you see
 * them" — so deleting the field would make a public claim false.
 *
 * Guardrails are per product, not per brand: a six pound clip cannot carry a
 * ninety-nine pound floor.
 */
export default function GuardrailsPanel({
  brandId, products, productId, onProductChange, onSaved,
}: {
  brandId: string;
  products: Product[];
  productId: string;
  onProductChange: (id: string) => void;
  onSaved?: (row: Record<string, unknown>) => void;
}) {
  const selected = products.find((p) => p.id === productId) ?? null;

  const [floor, setFloor] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [minMargin, setMinMargin] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  /* Keyed on the product id, not on the product object.
   *
   * Saving hands the updated row back to the page, which replaces it in the
   * list, which changes this object's identity. Depending on the object meant
   * this effect re-ran on every save and reset the state to idle, wiping the
   * "Saved" confirmation before anyone could see it. Silent saving is
   * indistinguishable from broken. */
  useEffect(() => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setFloor(numStr(p.floorPrice));
    setMaxDiscount(numStr(p.maxDiscountPct));
    setMinMargin(numStr(p.minMarginPct));
    setState("idle");
    setError(null);
    // products is deliberately not a dependency: see above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const save = useCallback(async () => {
    if (!selected) return;
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/catalog/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          brand_id: brandId,
          changes: {
            floor_price: floor,
            max_discount_pct: maxDiscount,
            min_margin_pct: minMargin,
          },
        }),
      });
      const data = await res.json();
      // supabase-js resolves { data, error } and never throws, so the route's
      // own error is the only signal that nothing was written.
      if (!res.ok || data.error) {
        setState("error");
        setError(data.error || "That did not save.");
        return;
      }
      setState("saved");
      onSaved?.(data.product);
      window.setTimeout(() => setState("idle"), 2200);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "That did not save.");
    }
  }, [selected, brandId, floor, maxDiscount, minMargin, onSaved]);

  const currency = selected?.currency ?? "EUR";
  const floorNum = toNum(floor);
  const retail = selected?.retailPrice ?? null;
  /* A floor above the price it guards is the mistake worth catching here. */
  const floorAbovePrice = floorNum != null && retail != null && floorNum > retail;

  return (
    <Panel title="Guardrails Studio obeys">
      <label className="mb-3 block">
        <span className="mb-1.5 block text-2xs font-bold text-ink-2">Which product</span>
        <select
          value={productId}
          onChange={(e) => onProductChange(e.target.value)}
          className={fieldClass}
          aria-label="Which product"
        >
          <option value="">Pick a product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>

      {!selected ? (
        <p className="rounded-card border border-rule bg-tile px-3.5 py-3 text-2xs font-medium leading-[1.6] text-muted">
          Pick a product to set its limits. They are per product on purpose: a six pound clip
          cannot carry a ninety-nine pound floor.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-[104px_minmax(0,1fr)] items-start gap-x-3 gap-y-2">
            <Field label="Floor price" value={floor} onChange={setFloor} suffix={currency} />
            <Field label="Max discount" value={maxDiscount} onChange={setMaxDiscount} suffix="%" />
            <Field label="Min margin" value={minMargin} onChange={setMinMargin} suffix="%" />
          </div>

          {floorAbovePrice && (
            <p className="mt-2.5 rounded-tile bg-amber-wash px-3 py-2 text-2xs font-medium leading-[1.5] text-amber">
              The floor is above the retail price of {formatMoney(retail!, currency)}. Nothing could
              be sold at that price without breaking the rule you just wrote.
            </p>
          )}

          <div className="mt-3 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => void save()}
              disabled={state === "saving"}
              className="rounded-tile bg-grad-mark px-4 py-2 text-xs font-bold text-white drop-shadow-btn disabled:opacity-60"
            >
              {state === "saving" ? "Saving…" : "Save limits"}
            </button>
            {state === "saved" && (
              <span role="status" className="text-2xs font-bold text-green-ink">Saved ✓</span>
            )}
            {state === "error" && (
              <span role="alert" className="text-2xs font-bold text-accent-dark">{error}</span>
            )}
          </div>

          <p className="mt-3 border-t border-rule pt-2.5 text-2xs font-medium leading-[1.6] text-muted">
            Copy and offers written about {selected.name} stay inside these limits. This is what the
            pricing page means when it says offers are checked against your floor price before you
            see them.
          </p>
        </>
      )}
    </Panel>
  );
}
