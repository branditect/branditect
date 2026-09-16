"use client";

import { useEffect, useState } from "react";
import { useBrand } from "@/lib/useBrand";
import { formatMoney, fromRow, type Product, DEFAULT_CURRENCY } from "@/lib/products";
import { marginPct, netPrice, priceForMargin } from "@/lib/numbers";
import {
  ApplyPanel, CalcShell, Field, Panel, ProductPicker, Readout, numStr, toNum,
} from "@/components/numbers/calc-shell";
import GuardrailsPanel from "@/components/numbers/guardrails-panel";
import { authedFetch } from "@/lib/authed-fetch";
import { useT } from "@/lib/i18n/use-t.tsx";

type Direction = "fromPrice" | "fromMargin";

export default function PricingCalculator() {
  const t = useT();
  const { brandId } = useBrand();
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [dir, setDir] = useState<Direction>("fromPrice");
  const [cost, setCost] = useState("");
  const [tax, setTax] = useState("");
  const [price, setPrice] = useState("");
  const [target, setTarget] = useState("");

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
    setCost(numStr(selected.landedCost ?? selected.factoryCost ?? null));
    setTax(numStr(selected.taxRatePct));
    setPrice(numStr(selected.retailPrice));
    setTarget(numStr(selected.minMarginPct));
  }, [selected]);

  const c = toNum(cost);
  const taxPct = toNum(tax) ?? 0;
  const p = toNum(price);
  const tgt = toNum(target);

  const resultMargin = c != null && p != null && p > 0 ? marginPct(p, taxPct, c) : null;
  const resultPrice = c != null && tgt != null ? priceForMargin({ variableCost: c, taxRatePct: taxPct, targetMarginPct: tgt }) : null;
  const usingFactory = selected != null && selected.landedCost == null && selected.factoryCost != null;

  return (
    <CalcShell n={2} tone="lavender" title={t("numbers.pricingAndMargin")}
      promise={t("num.priceLede")}>
      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] items-start gap-3 stack:grid-cols-1">
        <Panel title={t("numbers.eitherEnd")}>
          <div className="mt-3" role="radiogroup" aria-label={t("numbers.direction")}>
            <div className="flex gap-1.5">
              {([["fromPrice", "num.price.haveAPrice"], ["fromMargin", "num.price.haveATarget"]] as const).map(([v, label]) => (
                <button key={v} type="button" role="radio" aria-checked={dir === v}
                  onClick={() => setDir(v)}
                  className={`flex-1 rounded-tile border px-3 py-2 text-xs font-bold ${
                    dir === v ? "border-lav-line bg-lavender text-lav-ink" : "border-rule-2 text-ink-2 hover:bg-tile"
                  }`}>{t(label)}</button>
              ))}
            </div>
          </div>

          <div className="mt-3.5">
            <ProductPicker products={products} value={productId} onChange={setProductId} />
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            <Field label={t("num.costPerUnit")} hint={t("num.price.landedHint")} value={cost} onChange={setCost} suffix={currency} />
            <Field label={t("num.taxRate")} hint={t("num.price.taxHint")} value={tax} onChange={setTax} suffix="%" />
            {dir === "fromPrice"
              ? <Field label={t("num.retailPrice")} hint={t("num.price.grossHint")} value={price} onChange={setPrice} suffix={currency} />
              : <Field label={t("num.targetMargin")} value={target} onChange={setTarget} suffix="%" />}
          </div>

          {usingFactory && (
            <p className="mt-3 rounded-tile bg-amber-wash px-3 py-2.5 text-2xs font-medium leading-[1.5] text-amber">
              {t("num.price.usingFactory", { name: selected!.name })}
            </p>
          )}
        </Panel>

        <div className="flex flex-col gap-3">
          {dir === "fromPrice" ? (
            <Readout tone="lavender" label={t("num.price.marginAtPrice")}
              warn={resultMargin != null && resultMargin < 0}
              value={resultMargin == null ? "—" : `${resultMargin.toFixed(1)}%`}
              sub={resultMargin == null
                ? t("num.price.enterCostPrice")
                : resultMargin < 0
                  ? t("num.price.losesMoney")
                  : t("num.price.youKeep", { net: formatMoney(netPrice(p!, taxPct), currency), tax: taxPct, cost: formatMoney(c!, currency), keep: formatMoney(netPrice(p!, taxPct) - c!, currency) })}
            />
          ) : (
            <Readout tone="lavender" label={t("num.price.priceForMargin", { tgt: tgt ?? "—" })}
              value={resultPrice == null ? "—" : formatMoney(resultPrice, currency)}
              sub={resultPrice == null
                ? tgt != null && tgt >= 100
                  ? t("num.price.hundredUnreachable")
                  : t("num.price.enterCostTarget")
                : t("num.price.grossComparable", { tax: taxPct, net: formatMoney(resultPrice / (1 + taxPct / 100), currency) })}
            />
          )}

          <ApplyPanel tone="lavender" productId={productId || null}
            productName={selected?.name ?? null}
            fields={dir === "fromPrice"
              ? { min_margin_pct: (resultMargin ?? 0).toFixed(1) }
              : { price_retail: (resultPrice ?? 0).toFixed(2) }}>
            <div className="text-micro font-extrabold uppercase tracking-[0.8px] text-lav-ink opacity-75">
              {dir === "fromPrice" ? t("num.minMargin") : t("num.retailPrice")}
            </div>
            <div className="text-[20px] font-bold tracking-[-0.5px] tabular-nums text-lav-ink">
              {dir === "fromPrice"
                ? resultMargin == null ? "—" : `${resultMargin.toFixed(1)}%`
                : resultPrice == null ? "—" : (
                  selected?.retailPrice != null ? (
                    <>
                      <span className="text-lav-ink/50 line-through">{formatMoney(selected.retailPrice, currency)}</span>
                      {" "}→ {formatMoney(resultPrice, currency)}
                    </>
                  ) : formatMoney(resultPrice, currency)
                )}
            </div>
          </ApplyPanel>

          <p className="rounded-card border border-rule bg-tile px-3.5 py-3 text-2xs font-medium leading-[1.6] text-muted">
            {t("num.price.netOfTax")}
          </p>
        </div>
      </div>

      {/* The calculator above is a sandbox and never writes back. This does:
          it is where the limits live now, moved off the product card. */}
      <div className="mt-3">
        <GuardrailsPanel
          brandId={brandId}
          products={products}
          productId={productId}
          onProductChange={setProductId}
          onSaved={(saved) =>
            setProducts((prev) => prev.map((p) => (p.id === saved.id ? fromRow(saved) : p)))
          }
        />
      </div>
    </CalcShell>
  );
}
