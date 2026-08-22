"use client";

import { useEffect, useState } from "react";
import { useBrand } from "@/lib/useBrand";
import { formatMoney, fromRow, type Product } from "@/lib/products";
import { marginPct, netPrice, priceForMargin } from "@/lib/numbers";
import {
  ApplyPanel, CalcShell, Field, Panel, ProductPicker, Readout, numStr, toNum,
} from "@/components/numbers/calc-shell";

type Direction = "fromPrice" | "fromMargin";

export default function PricingCalculator() {
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
    fetch(`/api/catalog?brand_id=${encodeURIComponent(brandId)}`)
      .then((r) => r.json())
      .then((c) => !cancelled && setProducts((c.products ?? []).map(fromRow)))
      .catch(() => {});
    return () => { cancelled = true; };
  }, [brandId]);

  const selected = products.find((p) => p.id === productId) ?? null;
  const currency = selected?.currency ?? products[0]?.currency ?? "GBP";

  useEffect(() => {
    if (!selected) return;
    setCost(numStr(selected.landedCost ?? selected.factoryCost ?? null));
    setTax(numStr(selected.taxRatePct));
    setPrice(numStr(selected.retailPrice));
    setTarget(numStr(selected.minMarginPct));
  }, [selected]);

  const c = toNum(cost);
  const t = toNum(tax) ?? 0;
  const p = toNum(price);
  const tgt = toNum(target);

  const resultMargin = c != null && p != null && p > 0 ? marginPct(p, t, c) : null;
  const resultPrice = c != null && tgt != null ? priceForMargin({ variableCost: c, taxRatePct: t, targetMarginPct: tgt }) : null;
  const usingFactory = selected != null && selected.landedCost == null && selected.factoryCost != null;

  return (
    <CalcShell n={2} tone="lavender" title="Pricing & margin"
      promise="Find the price that gives you the margin you want.">
      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] items-start gap-3 stack:grid-cols-1">
        <Panel title="Work it from either end">
          <div className="mt-3" role="radiogroup" aria-label="Direction">
            <div className="flex gap-1.5">
              {([["fromPrice", "I have a price"], ["fromMargin", "I have a target margin"]] as const).map(([v, label]) => (
                <button key={v} type="button" role="radio" aria-checked={dir === v}
                  onClick={() => setDir(v)}
                  className={`flex-1 rounded-tile border px-3 py-2 text-xs font-bold ${
                    dir === v ? "border-lav-line bg-lavender text-lav-ink" : "border-rule-2 text-ink-2 hover:bg-tile"
                  }`}>{label}</button>
              ))}
            </div>
          </div>

          <div className="mt-3.5">
            <ProductPicker products={products} value={productId} onChange={setProductId} />
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            <Field label="Cost per unit" hint="landed, not factory" value={cost} onChange={setCost} suffix={currency} />
            <Field label="Tax rate" hint="left blank, retail is treated as net" value={tax} onChange={setTax} suffix="%" />
            {dir === "fromPrice"
              ? <Field label="Retail price" hint="gross, what the customer pays" value={price} onChange={setPrice} suffix={currency} />
              : <Field label="Target margin" value={target} onChange={setTarget} suffix="%" />}
          </div>

          {usingFactory && (
            <p className="mt-3 rounded-tile bg-amber-wash px-3 py-2.5 text-2xs font-medium leading-[1.5] text-amber">
              {selected!.name} has no landed cost, so this prefilled from factory cost. The result
              will read high until duty, freight and packaging are included.
            </p>
          )}
        </Panel>

        <div className="flex flex-col gap-3">
          {dir === "fromPrice" ? (
            <Readout tone="lavender" label="Margin at that price"
              warn={resultMargin != null && resultMargin < 0}
              value={resultMargin == null ? "—" : `${resultMargin.toFixed(1)}%`}
              sub={resultMargin == null
                ? "Enter a cost and a price."
                : resultMargin < 0
                  ? "You lose money on every sale at this price."
                  : <>Net price {formatMoney(netPrice(p!, t), currency)} after {t}% tax, less cost {formatMoney(c!, currency)}. You keep {formatMoney(netPrice(p!, t) - c!, currency)} per sale.</>}
            />
          ) : (
            <Readout tone="lavender" label={`Price for ${tgt ?? "—"}% margin`}
              value={resultPrice == null ? "—" : formatMoney(resultPrice, currency)}
              sub={resultPrice == null
                ? tgt != null && tgt >= 100
                  ? "A 100% margin needs a zero cost — unreachable at any price."
                  : "Enter a cost and a target margin."
                : <>Gross, so it&apos;s comparable to your retail price. Net of {t}% tax that is {formatMoney(resultPrice / (1 + t / 100), currency)}.</>}
            />
          )}

          <ApplyPanel tone="lavender" productId={productId || null}
            productName={selected?.name ?? null}
            fields={dir === "fromPrice"
              ? { min_margin_pct: (resultMargin ?? 0).toFixed(1) }
              : { price_retail: (resultPrice ?? 0).toFixed(2) }}>
            <div className="text-micro font-extrabold uppercase tracking-[0.8px] text-lav-ink opacity-75">
              {dir === "fromPrice" ? "Minimum margin" : "Retail price"}
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
            Margin is always net of tax against landed cost. Comparing a gross price to a factory
            cost is the flattering version, and it is wrong by about five points.
          </p>
        </div>
      </div>
    </CalcShell>
  );
}
