"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/icon";
import ImagePicker from "@/components/products/image-picker";
import {
  categoryStyle,
  formatMoney,
  margin,
  marginFootnote,
  STOCK_LABELS,
  STOCK_STYLES,
  type Product,
  type StockStatus,
} from "@/lib/products";

const TABS = ["Details", "Pricing", "Inventory", "Media", "History"] as const;
type Tab = (typeof TABS)[number];

/** The shape held while editing. Numbers are strings so a field can be blank. */
interface Draft {
  name: string;
  description: string;
  category: string;
  sku: string;
  barcode: string;
  tags: string;
  imageUrl: string | null;
  retailPrice: string;
  rrp: string;
  taxRatePct: string;
  landedCost: string;
  factoryCost: string;
  floorPrice: string;
  maxDiscountPct: string;
  minMarginPct: string;
  stockStatus: StockStatus | "";
  stockUnits: string;
}

const numStr = (n: number | null | undefined) => (n == null ? "" : String(n));

function toDraft(p: Product): Draft {
  return {
    name: p.name,
    description: p.description,
    category: p.category,
    sku: p.sku,
    barcode: p.barcode ?? "",
    tags: p.tags.join(", "),
    imageUrl: p.imageUrl,
    retailPrice: numStr(p.retailPrice),
    rrp: numStr(p.rrp),
    taxRatePct: numStr(p.taxRatePct),
    landedCost: numStr(p.landedCost),
    factoryCost: numStr(p.factoryCost),
    floorPrice: numStr(p.floorPrice),
    maxDiscountPct: numStr(p.maxDiscountPct),
    minMarginPct: numStr(p.minMarginPct),
    stockStatus: p.stockStatus ?? "",
    stockUnits: numStr(p.stockUnits),
  };
}

/**
 * Blank means "not recorded" and must stay null — never 0.
 *
 * Accepts both decimal separators. Money fields are `type="text"` with
 * inputMode="decimal" rather than `type="number"`, because a number input
 * renders and validates against the browser's locale: on a comma-decimal
 * locale it shows 22,1 and can refuse "22.5" as you type it.
 */
const toNum = (s: string): number | null => {
  const t = s.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isNaN(n) ? null : n;
};

const splitTags = (s: string) => s.split(",").map((t) => t.trim()).filter(Boolean);

/** The API payload, in database column names. */
function toPatch(d: Draft) {
  return {
    name: d.name.trim(),
    description: d.description.trim(),
    category: d.category.trim(),
    sku: d.sku.trim(),
    barcode: d.barcode.trim(),
    tags: splitTags(d.tags),
    image_url: d.imageUrl,
    price_retail: toNum(d.retailPrice),
    price_rrp: toNum(d.rrp),
    tax_rate_pct: toNum(d.taxRatePct),
    landed_cost: toNum(d.landedCost),
    price_cogs: toNum(d.factoryCost),
    floor_price: toNum(d.floorPrice),
    max_discount_pct: toNum(d.maxDiscountPct),
    min_margin_pct: toNum(d.minMarginPct),
    stock_status: d.stockStatus === "" ? null : d.stockStatus,
    stock_units: toNum(d.stockUnits),
  };
}

const fieldClass =
  "w-full rounded-lg border border-rule-2 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-2 focus:border-accent-line focus:outline-none focus:ring-2 focus:ring-tint-1";

function Field({
  label,
  value,
  onChange,
  type = "text",
  suffix,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  suffix?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const id = `f-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <>
      <label htmlFor={id} className="pt-1.5 text-xs font-medium text-muted">
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        {multiline ? (
          <textarea
            id={id}
            value={value}
            rows={3}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={`${fieldClass} resize-y leading-[1.5]`}
          />
        ) : (
          <input
            id={id}
            type="text"
            inputMode={type === "number" ? "decimal" : undefined}
            value={value}
            placeholder={placeholder}
            onChange={(e) =>
              // Reject anything that isn't a number as it's typed, rather than
              // accepting it and failing at save.
              onChange(type === "number" ? e.target.value.replace(/[^0-9.,-]/g, "") : e.target.value)
            }
            className={`${fieldClass} ${type === "number" ? "tabular-nums" : ""}`}
          />
        )}
        {suffix && <span className="shrink-0 text-2xs font-semibold text-muted">{suffix}</span>}
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="m-0 text-xs font-semibold leading-[1.5] text-ink-2">{children}</dd>
    </>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="[&+&]:mt-[22px]">
      {title && (
        <div className="mb-2.5 flex items-center gap-2.5">
          <h3 className="text-sm font-bold tracking-[-0.15px]">{title}</h3>
        </div>
      )}
      {children}
    </section>
  );
}

const dash = <span className="text-faint">—</span>;

export default function ProductDrawer({
  product,
  brandId,
  onClose,
  onSaved,
  returnFocusTo,
}: {
  product: Product;
  brandId: string;
  onClose: () => void;
  onSaved: (updated: Product) => void;
  returnFocusTo?: HTMLElement | null;
}) {
  const [tab, setTab] = useState<Tab>("Details");
  const [draft, setDraft] = useState<Draft>(() => toDraft(product));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const tablistRef = useRef<HTMLDivElement>(null);

  // Switching product resets the form rather than carrying edits across.
  useEffect(() => {
    setDraft(toDraft(product));
    setError(null);
  }, [product]);

  const original = useMemo(() => toDraft(product), [product]);
  const dirty = useMemo(
    () => (Object.keys(draft) as (keyof Draft)[]).some((k) => draft[k] !== original[k]),
    [draft, original],
  );

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  function requestClose() {
    if (dirtyRef.current && !window.confirm("Discard unsaved changes to this product?")) return;
    onClose();
    returnFocusTo?.focus();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pickerOpen) {
        e.stopPropagation();
        requestClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerOpen]);

  // Focus trap. Suspended while the image picker owns the screen.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Tab" || !panelRef.current || pickerOpen) return;
      const f = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pickerOpen]);

  function onTabKey(e: React.KeyboardEvent) {
    const i = TABS.indexOf(tab);
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (i + 1) % TABS.length;
    if (e.key === "ArrowLeft") next = (i - 1 + TABS.length) % TABS.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = TABS.length - 1;
    if (next === null) return;
    e.preventDefault();
    setTab(TABS[next]);
    tablistRef.current?.querySelectorAll("button")[next]?.focus();
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/catalog/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, brand_id: brandId, changes: toPatch(draft) }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not save");

      onSaved({
        ...product,
        name: draft.name.trim(),
        description: draft.description.trim(),
        category: draft.category.trim(),
        sku: draft.sku.trim(),
        barcode: draft.barcode.trim() || undefined,
        tags: splitTags(draft.tags),
        imageUrl: draft.imageUrl,
        retailPrice: toNum(draft.retailPrice),
        rrp: toNum(draft.rrp),
        taxRatePct: toNum(draft.taxRatePct),
        landedCost: toNum(draft.landedCost),
        factoryCost: toNum(draft.factoryCost),
        floorPrice: toNum(draft.floorPrice),
        maxDiscountPct: toNum(draft.maxDiscountPct),
        minMarginPct: toNum(draft.minMarginPct),
        stockStatus: draft.stockStatus === "" ? null : draft.stockStatus,
        stockUnits: toNum(draft.stockUnits),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  // Recomputed from the draft, so the number moves as the inputs change — that
  // live feedback is the point of editing price and cost side by side.
  const live = {
    retailPrice: toNum(draft.retailPrice),
    taxRatePct: toNum(draft.taxRatePct),
    landedCost: toNum(draft.landedCost),
    factoryCost: toNum(draft.factoryCost),
    currency: product.currency,
  };
  const m = margin(live);
  const status = draft.stockStatus === "" ? null : draft.stockStatus;
  const money = (n: number | null) => (n == null ? dash : formatMoney(n, product.currency));

  return (
    <>
      <aside
        ref={panelRef}
        aria-label={`${product.name} detail`}
        className="sticky top-3 z-[1100] flex max-h-[calc(100vh-24px)] w-[400px] shrink-0 flex-col overflow-hidden rounded-panel border border-rule bg-card drop-shadow-panel"
      >
        <div className="relative flex gap-3.5 px-[18px] pt-[18px]">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-label={draft.imageUrl ? "Change product image" : "Choose a product image"}
            className={`group relative grid h-[74px] w-[74px] shrink-0 place-items-center overflow-hidden rounded-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              draft.imageUrl ? "border border-rule" : categoryStyle(draft.category)
            }`}
          >
            {draft.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Icon name="bag" size={34} />
            )}
            <span className="absolute inset-0 grid place-items-center bg-ink/55 text-micro font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
              {draft.imageUrl ? "Change" : "Add image"}
            </span>
          </button>

          <div className="min-w-0 flex-1">
            <h2 className="pr-8 text-h3 font-bold leading-[1.25] tracking-[-0.3px]">
              {draft.name || "Untitled product"}
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {status && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-pill px-[11px] py-1 text-2xs font-bold ${
                    status === "in_stock"
                      ? "bg-green-wash text-green-ink"
                      : status === "low_stock"
                        ? "bg-amber-wash text-amber"
                        : "bg-tint-2 text-accent-dark"
                  }`}
                >
                  <i
                    aria-hidden="true"
                    className={`block h-1.5 w-1.5 rounded-full ${
                      status === "in_stock" ? "bg-good" : status === "low_stock" ? "bg-amber" : "bg-accent"
                    }`}
                  />
                  {STOCK_LABELS[status]}
                </span>
              )}
              {draft.category && (
                <span className={`rounded-pill px-[11px] py-1 text-2xs font-bold ${categoryStyle(draft.category)}`}>
                  {draft.category}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={requestClose}
            className="absolute right-3.5 top-3.5 grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-tile hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
          >
            <Icon name="close" size={14} />
          </button>
        </div>

        <div className="flex gap-[7px] px-[18px] pt-3.5">
          {[
            { label: "Write about it", icon: "pen" as const, href: `/studio/write?product=${product.id}` },
            { label: "Make images", icon: "img" as const, href: `/studio/create-images?product=${product.id}` },
            { label: "Ask about it", icon: "chat" as const, href: `/chat?product=${product.id}` },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="flex flex-1 flex-col items-center gap-[5px] rounded-tile border border-accent-line bg-tint-1 px-1.5 py-[9px] text-center text-2xs font-bold text-accent hover:bg-tint-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Icon name={a.icon} size={15} />
              {a.label}
            </Link>
          ))}
        </div>

        <div
          ref={tablistRef}
          role="tablist"
          aria-label="Product detail sections"
          onKeyDown={onTabKey}
          className="mt-3.5 flex gap-0.5 border-b border-rule px-[18px] pt-3.5"
        >
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`tab-${t}`}
              aria-selected={tab === t}
              aria-controls={`panel-${t}`}
              tabIndex={tab === t ? 0 : -1}
              onClick={() => setTab(t)}
              className={`relative px-2.5 pb-2.5 text-sm focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
                tab === t
                  ? "font-bold text-accent after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-sm after:bg-accent after:content-['']"
                  : "font-semibold text-muted hover:text-ink-2"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto px-[18px] pb-2 pt-4">
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
            {tab === "Details" && (
              <>
                <Section title="Product information">
                  <div className="grid grid-cols-[104px_minmax(0,1fr)] items-start gap-x-3 gap-y-2">
                    <Field label="Product name" value={draft.name} onChange={(v) => set("name", v)} />
                    <Field
                      label="Description"
                      value={draft.description}
                      onChange={(v) => set("description", v)}
                      multiline
                      placeholder="What it is, in the words a copywriter should reuse"
                    />
                    <Field label="Category" value={draft.category} onChange={(v) => set("category", v)} />
                    <Field label="SKU" value={draft.sku} onChange={(v) => set("sku", v)} />
                    <Field label="Barcode" value={draft.barcode} onChange={(v) => set("barcode", v)} />
                    <Field
                      label="Tags"
                      value={draft.tags}
                      onChange={(v) => set("tags", v)}
                      placeholder="Professional, Ionic"
                    />
                  </div>
                  <p className="mt-2 text-2xs font-medium text-muted">
                    Tags steer tone and angle when Studio writes. Separate them with commas.
                  </p>
                </Section>

                <Section title="What Branditect knows">
                  <dl className="grid grid-cols-[104px_minmax(0,1fr)] items-start gap-x-3 gap-y-[9px]">
                    <Row label="Indexed">
                      {product.indexed ? (
                        <span className="text-green-ink">
                          Yes · {product.sourceFileCount} source file
                          {product.sourceFileCount === 1 ? "" : "s"}
                        </span>
                      ) : (
                        <span className="text-muted">
                          Not yet — it won&apos;t be quoted in Studio until it is
                        </span>
                      )}
                    </Row>
                    <Row label="Images">{product.imageCount} in Knowledge</Row>
                    <Row label="Used in">
                      {product.usedInOutputCount} output{product.usedInOutputCount === 1 ? "" : "s"}
                    </Row>
                  </dl>
                </Section>
              </>
            )}

            {tab === "Pricing" && (
              <>
                <Section title="Margin">
                  {m ? (
                    <div className="rounded-card border border-rule bg-tile px-3.5 py-[13px]">
                      <div className="flex items-baseline gap-[9px]">
                        <b className="text-[24px] font-bold tracking-[-0.7px] tabular-nums">
                          {m.pct.toFixed(1)}%
                        </b>
                        <span className="text-2xs font-semibold text-muted">
                          {formatMoney(m.cash, product.currency)} per unit
                        </span>
                        {!m.exact && (
                          <span className="ml-auto rounded-pill bg-amber-wash px-2 py-0.5 text-micro font-bold uppercase tracking-[0.6px] text-amber">
                            Estimate
                          </span>
                        )}
                      </div>
                      <div className="relative mt-2.5 h-1.5 overflow-hidden rounded-pill bg-rule-2">
                        <i
                          className={`absolute inset-y-0 left-0 block rounded-pill transition-[width] motion-reduce:transition-none ${
                            m.pct < 0 ? "bg-accent" : m.exact ? "bg-good" : "bg-amber"
                          }`}
                          style={{ width: `${Math.max(0, Math.min(100, m.pct))}%` }}
                        />
                      </div>
                      <p className="mt-[9px] text-2xs font-medium leading-[1.5] text-muted">
                        {marginFootnote(live, m)}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-card border border-rule bg-tile px-3.5 py-[13px]">
                      <b className="text-[24px] font-bold tracking-[-0.7px] text-faint">—</b>
                      <p className="mt-[9px] text-2xs font-medium leading-[1.5] text-muted">
                        No margin can be calculated without a retail price and a cost. A blank figure
                        is better than a fabricated one.
                      </p>
                    </div>
                  )}
                </Section>

                <Section title="Prices">
                  <div className="grid grid-cols-[104px_minmax(0,1fr)] items-start gap-x-3 gap-y-2">
                    <Field label="Retail price" type="number" value={draft.retailPrice} onChange={(v) => set("retailPrice", v)} suffix={product.currency} />
                    <Field label="RRP" type="number" value={draft.rrp} onChange={(v) => set("rrp", v)} suffix={product.currency} />
                    <Field label="Tax rate" type="number" value={draft.taxRatePct} onChange={(v) => set("taxRatePct", v)} suffix="%" placeholder="20" />
                    <Field label="Landed cost" type="number" value={draft.landedCost} onChange={(v) => set("landedCost", v)} suffix={product.currency} />
                    <Field label="Factory cost" type="number" value={draft.factoryCost} onChange={(v) => set("factoryCost", v)} suffix={product.currency} />
                    <dt className="pt-1.5 text-xs font-medium text-muted">Net price</dt>
                    <dd className="m-0 pt-1.5 text-xs font-semibold tabular-nums text-ink-2">
                      {m ? money(m.net) : dash}
                    </dd>
                  </div>
                  <p className="mt-2 text-2xs font-medium leading-[1.5] text-muted">
                    Landed cost is factory cost plus duty, freight and packaging. Margin is computed
                    from it, not from factory cost — leave it blank and the figure above is marked an
                    estimate rather than quietly reading high.
                  </p>
                </Section>

                <Section title="Guardrails Studio obeys">
                  <div className="rounded-card border border-accent-line bg-tint-1 px-3.5 py-[13px]">
                    <div className="grid grid-cols-[104px_minmax(0,1fr)] items-start gap-x-3 gap-y-2">
                      <Field label="Floor price" type="number" value={draft.floorPrice} onChange={(v) => set("floorPrice", v)} suffix={product.currency} />
                      <Field label="Max discount" type="number" value={draft.maxDiscountPct} onChange={(v) => set("maxDiscountPct", v)} suffix="%" />
                      <Field label="Min margin" type="number" value={draft.minMarginPct} onChange={(v) => set("minMarginPct", v)} suffix="%" />
                    </div>
                    <p className="mt-2.5 border-t border-accent-line pt-[9px] text-2xs font-medium leading-[1.5] text-accent-dark">
                      Copy and offers written about this product stay inside these limits. Brand-wide
                      defaults live in{" "}
                      <Link href="/numbers/pricing" className="underline underline-offset-2">
                        Numbers ▸ Pricing &amp; offers
                      </Link>
                      .
                    </p>
                  </div>
                </Section>
              </>
            )}

            {tab === "Inventory" && (
              <>
                <Section title="Availability">
                  <div className="grid grid-cols-[104px_minmax(0,1fr)] items-start gap-x-3 gap-y-2">
                    <label htmlFor="f-status" className="pt-1.5 text-xs font-medium text-muted">
                      Status
                    </label>
                    <select
                      id="f-status"
                      value={draft.stockStatus}
                      onChange={(e) => set("stockStatus", e.target.value as StockStatus | "")}
                      className={fieldClass}
                    >
                      <option value="">Not set</option>
                      {(Object.keys(STOCK_LABELS) as StockStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STOCK_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <Field label="Units" type="number" value={draft.stockUnits} onChange={(v) => set("stockUnits", v)} />
                    <Row label="Source">{product.stockSource ?? dash}</Row>
                  </div>
                  {status === "out_of_stock" && (
                    <p className={`mt-2 text-2xs font-semibold ${STOCK_STYLES[status]}`}>
                      Studio will avoid promoting this while it&apos;s out of stock.
                    </p>
                  )}
                </Section>
                <Section>
                  <p className="text-xs font-medium leading-[1.6] text-muted">
                    Stock is here for one reason: so Studio won&apos;t promote something you
                    can&apos;t ship. Reorder points, suppliers and lead times belong in your
                    inventory system, not your brand brain.
                  </p>
                </Section>
              </>
            )}

            {tab === "Media" && (
              <Section title="Product image">
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex w-full items-center gap-3 rounded-card border border-rule bg-tile p-3 text-left hover:border-accent-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-tile border border-rule bg-white">
                    {draft.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={draft.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-muted">
                        <Icon name="img" size={22} />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink">
                      {draft.imageUrl ? "Change product image" : "Choose a product image"}
                    </span>
                    <span className="mt-0.5 block text-2xs font-medium text-muted">
                      Picked from your image library in Knowledge ▸ Images
                    </span>
                  </span>
                </button>
                <p className="mt-3 text-xs font-medium leading-[1.6] text-muted">
                  {product.imageCount > 0
                    ? `${product.imageCount} images in Knowledge are tagged to this product. These are what the image creator reads when you ask for a new shot.`
                    : "No images tagged to this product yet, so the image creator has nothing to work from."}
                </p>
              </Section>
            )}

            {tab === "History" && (
              <Section title="Changes">
                <p className="text-xs font-medium leading-[1.6] text-muted">
                  No changes recorded yet. Price and cost edits will appear here with who made them —
                  someone will eventually need to know when a price changed and why.
                </p>
              </Section>
            )}
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mx-[18px] mb-2 rounded-lg bg-tint-2 px-3 py-2 text-2xs font-semibold text-accent-dark"
          >
            {error}
          </p>
        )}

        <div className="flex items-center gap-2.5 border-t border-rule bg-white px-[18px] py-3.5">
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={() => setDraft(toDraft(product))}
            className="rounded-tile border border-rule-2 px-3.5 py-2.5 text-sm font-semibold text-ink-2 hover:bg-tile disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Revert
          </button>
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={save}
            className="ml-auto rounded-tile bg-grad-mark px-5 py-2.5 text-sm font-bold text-white drop-shadow-[0_4px_8px_rgba(232,73,32,.28)] disabled:bg-none disabled:bg-rule-2 disabled:text-muted disabled:drop-shadow-none"
          >
            {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </button>
        </div>
      </aside>

      {pickerOpen && (
        <ImagePicker
          brandId={brandId}
          currentUrl={draft.imageUrl}
          onPick={(url) => set("imageUrl", url)}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}
