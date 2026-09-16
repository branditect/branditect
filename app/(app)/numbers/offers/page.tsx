"use client";

import { useEffect, useState } from "react";
import { useBrand } from "@/lib/useBrand";
import { formatMoney, fromRow, type Product, DEFAULT_CURRENCY } from "@/lib/products";
import { marginPct, maxDiscountPct, netPrice } from "@/lib/numbers";
import {
  ApplyPanel, CalcShell, Field, Panel, ProductPicker, Readout, numStr, toNum,
} from "@/components/numbers/calc-shell";
import { authedFetch } from "@/lib/authed-fetch";
import { useT } from "@/lib/i18n/use-t.tsx";

export default function OffersCalculator() {
  const t = useT();
  const { brandId } = useBrand();
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [tax, setTax] = useState("");
  const [minMargin, setMinMargin] = useState("");
  const [tryDiscount, setTryDiscount] = useState("");

  useEffect(() => {
    if (!brandId) return;
    let cancelled = false;
    authedFetch(`/api/catalog?brand_id=${encodeURIComponent(brandId)}`)
      .then((r) => r.json())
      .then((c) => !cancelled && setProducts((c.products ?? []).map(fromRow)))
      .catch(() => {});
    return () => { cancelled = true; };
  }, [brandId]);

  const selected = products.find((p) => p.id === productId) ?? null;
  const currency = selected?.currency ?? products[0]?.currency ?? DEFAULT_CURRENCY;

  useEffect(() => {
    if (!selected) return;
    setPrice(numStr(selected.retailPrice));
    setCost(numStr(selected.landedCost ?? selected.factoryCost ?? null));
    setTax(numStr(selected.taxRatePct));
    setMinMargin(numStr(selected.minMarginPct));
  }, [selected]);

  const p = toNum(price);
  const c = toNum(cost);
  const taxPct = toNum(tax) ?? 0;
  const mm = toNum(minMargin);
  const tryPct = toNum(tryDiscount);

  const ready = p != null && p > 0 && c != null && mm != null;
  const ceiling = ready ? maxDiscountPct({ retailGross: p, taxRatePct: taxPct, variableCost: c, minMarginPct: mm }) : null;
  const floorAtCeiling = ceiling != null && p != null ? p * (1 - ceiling / 100) : null;

  // What the discount they're actually considering does.
  const tryPrice = tryPct != null && p != null ? p * (1 - tryPct / 100) : null;
  const tryMargin = tryPrice != null && c != null ? marginPct(tryPrice, taxPct, c) : null;
  const breaches = tryMargin != null && mm != null && tryMargin < mm;

  return (
    <CalcShell n={3} tone="orange" title={t("numbers.offers")}
      promise={t("num.offersLede")}>
      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] items-start gap-3 stack:grid-cols-1">
        <Panel title={t("numbers.offerConsidering")}>
          <p className="mt-1 text-xs font-medium leading-[1.55] text-muted">
            {t("num.offers.ceilingNote")}
          </p>

          <div className="mt-3.5">
            <ProductPicker products={products} value={productId} onChange={setProductId} />
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            <Field label={t("num.retailPrice")} hint={t("num.hintGross")} value={price} onChange={setPrice} suffix={currency} />
            <Field label={t("num.costPerUnit")} hint={t("num.hintLanded")} value={cost} onChange={setCost} suffix={currency} />
            <Field label={t("num.taxRate")} value={tax} onChange={setTax} suffix="%" />
            <Field label={t("num.minMargin")} hint={t("num.offers.lineYouWontCross")} value={minMargin} onChange={setMinMargin} suffix="%" />
          </div>

          <div className="mt-4 border-t border-rule pt-3.5">
            <Field label={t("num.offers.discountWanted")} value={tryDiscount} onChange={setTryDiscount} suffix="%" />
            {tryMargin != null && (
              <p className={`mt-2.5 rounded-tile px-3 py-2.5 text-2xs font-semibold leading-[1.5] ${
                breaches ? "bg-tint-1 text-accent-dark" : "bg-green-wash text-green-ink"
              }`}>
                {t("num.offers.tryResult", { pct: tryPct ?? "", price: formatMoney(tryPrice!, currency), margin: tryMargin.toFixed(1) })}{" "}
                {breaches
                  ? t("num.offers.belowMinimum", { mm: mm ?? "" })
                  : t("num.offers.clearsMinimum")}
              </p>
            )}
          </div>
        </Panel>

        <div className="flex flex-col gap-3">
          <Readout tone="orange" label={t("num.offers.deepest")}
            value={ceiling == null ? "—" : `${ceiling.toFixed(1)}%`}
            warn={ceiling === 0 && ready}
            sub={ceiling == null
              ? t("num.offers.enterThree")
              : ceiling === 0
                ? t("num.offers.alreadyAtFloor", { currency: formatMoney(p!, currency), mm: mm ?? "" })
                : t("num.offers.takesPriceTo", { price: formatMoney(floorAtCeiling!, currency), mm: mm ?? "", net: formatMoney(netPrice(floorAtCeiling!, taxPct), currency) })}
          />

          <ApplyPanel tone="orange" productId={productId || null}
            productName={selected?.name ?? null}
            fields={{ max_discount_pct: (ceiling ?? 0).toFixed(1) }}>
            <div className="text-micro font-extrabold uppercase tracking-[0.8px] text-accent-dark opacity-75">
              {t("numbers.maxDiscount")}
            </div>
            <div className="text-[20px] font-bold tracking-[-0.5px] tabular-nums text-accent-dark">
              {ceiling == null ? "—" : selected?.maxDiscountPct != null ? (
                <>
                  <span className="text-accent-dark/50 line-through">{selected.maxDiscountPct}%</span>
                  {" "}→ {ceiling.toFixed(1)}%
                </>
              ) : `${ceiling.toFixed(1)}%`}
            </div>
          </ApplyPanel>

          <p className="rounded-card border border-rule bg-tile px-3.5 py-3 text-2xs font-medium leading-[1.6] text-muted">
            {t("num.offers.perProduct")}
          </p>
        </div>
      </div>
    </CalcShell>
  );
}
