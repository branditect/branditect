"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/icon";
import {
  categoryStyle,
  formatMoney,
  margin,
  marginFootnote,
  STOCK_LABELS,
  STOCK_STYLES,
  type Product,
} from "@/lib/products";

const TABS = ["Details", "Pricing", "Inventory", "Media", "History"] as const;
type Tab = (typeof TABS)[number];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="m-0 text-xs font-semibold leading-[1.5] text-ink-2">{children}</dd>
    </>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="[&+&]:mt-[22px]">
      <div className="mb-2.5 flex items-center gap-2.5">
        <h3 className="text-sm font-bold tracking-[-0.15px]">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

const dash = <span className="text-faint">—</span>;

export default function ProductDrawer({
  product,
  onClose,
  returnFocusTo,
}: {
  product: Product;
  onClose: () => void;
  /** The row that opened the drawer; focus goes back to it on close. */
  returnFocusTo?: HTMLElement | null;
}) {
  const [tab, setTab] = useState<Tab>("Details");
  const panelRef = useRef<HTMLElement>(null);
  const tablistRef = useRef<HTMLDivElement>(null);

  // Escape closes and returns focus to the row that opened it.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        returnFocusTo?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, returnFocusTo]);

  // Focus trap: Tab cycles within the drawer while it is open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Arrow-key navigation across tabs, per the tablist pattern.
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

  const m = margin(product);
  const money = (n: number | null | undefined) =>
    n == null ? dash : formatMoney(n, product.currency);
  const status = product.stockStatus;

  return (
    <aside
      ref={panelRef}
      aria-label={`${product.name} detail`}
      className="sticky top-3 flex max-h-[calc(100vh-24px)] w-[400px] shrink-0 flex-col overflow-hidden rounded-panel border border-rule bg-card drop-shadow-panel"
    >
      <div className="relative flex gap-3.5 px-[18px] pt-[18px]">
        <span
          className={`grid h-[74px] w-[74px] shrink-0 place-items-center rounded-tile ${categoryStyle(product.category)}`}
          aria-hidden="true"
        >
          <Icon name="bag" size={34} />
        </span>
        <div className="min-w-0">
          <h2 className="pr-8 text-h3 font-bold leading-[1.25] tracking-[-0.3px]">{product.name}</h2>
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
            {product.category && (
              <span className={`rounded-pill px-[11px] py-1 text-2xs font-bold ${categoryStyle(product.category)}`}>
                {product.category}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={() => {
            onClose();
            returnFocusTo?.focus();
          }}
          className="absolute right-3.5 top-3.5 grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-tile hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        >
          <Icon name="close" size={14} />
        </button>
      </div>

      {/*
        The point of the page. Without this row Products is a catalogue; with
        it, it is the thing that feeds Studio.
      */}
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
                <dl className="grid grid-cols-[104px_minmax(0,1fr)] items-start gap-x-3 gap-y-[9px]">
                  <Row label="Product name">{product.name}</Row>
                  <Row label="Description">{product.description || dash}</Row>
                  <Row label="Category">{product.category || dash}</Row>
                  <Row label="SKU">
                    <span className="tabular-nums">{product.sku || dash}</span>
                  </Row>
                  <Row label="Barcode">
                    <span className="tabular-nums">{product.barcode || dash}</span>
                  </Row>
                  <Row label="Tags">
                    {product.tags.length ? (
                      <span className="flex flex-wrap gap-[5px]">
                        {product.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-pill border border-rule bg-tile px-[9px] py-[3px] text-micro font-semibold text-ink-2"
                          >
                            {t}
                          </span>
                        ))}
                      </span>
                    ) : (
                      dash
                    )}
                  </Row>
                </dl>
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
                        className={`absolute inset-y-0 left-0 block rounded-pill ${
                          m.pct < 0 ? "bg-accent" : m.exact ? "bg-good" : "bg-amber"
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, m.pct))}%` }}
                      />
                    </div>
                    <p className="mt-[9px] text-2xs font-medium leading-[1.5] text-muted">
                      {marginFootnote(product, m)}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-card border border-rule bg-tile px-3.5 py-[13px]">
                    <b className="text-[24px] font-bold tracking-[-0.7px] text-faint">—</b>
                    <p className="mt-[9px] text-2xs font-medium leading-[1.5] text-muted">
                      No margin can be calculated without a cost. A blank figure is better than a
                      fabricated one — add a landed cost to see the real number.
                    </p>
                  </div>
                )}
              </Section>

              <Section title="Prices">
                <dl className="grid grid-cols-[104px_minmax(0,1fr)] items-start gap-x-3 gap-y-[9px]">
                  <Row label="Retail price">
                    <span className="tabular-nums">{money(product.retailPrice)}</span>
                  </Row>
                  <Row label="RRP">
                    <span className="tabular-nums">{money(product.rrp)}</span>
                  </Row>
                  <Row label="Tax">
                    {product.taxRatePct == null ? (
                      <span className="text-amber">Not set</span>
                    ) : (
                      `${product.taxRatePct}%`
                    )}
                  </Row>
                  <Row label="Net price">
                    <span className="tabular-nums">{m ? money(m.net) : dash}</span>
                  </Row>
                  <Row label="Landed cost">
                    <span className="tabular-nums">{money(product.landedCost)}</span>
                  </Row>
                  <Row label="Factory cost">
                    <span className="tabular-nums">{money(product.factoryCost)}</span>
                  </Row>
                </dl>
              </Section>

              <Section title="">
                <div className="rounded-card border border-accent-line bg-tint-1 px-3.5 py-[13px]">
                  <h4 className="mb-[9px] text-2xs font-extrabold uppercase tracking-[0.8px] text-accent">
                    Guardrails Studio obeys
                  </h4>
                  {[
                    ["Floor price", product.floorPrice == null ? null : money(product.floorPrice)],
                    ["Deepest discount", product.maxDiscountPct == null ? null : `${product.maxDiscountPct}%`],
                    ["Minimum margin", product.minMarginPct == null ? null : `${product.minMarginPct}%`],
                  ].map(([label, value]) => (
                    <div
                      key={label as string}
                      className="flex items-center gap-2 py-1 text-xs font-semibold text-accent-dark"
                    >
                      {label}
                      <b className="ml-auto tabular-nums">{value ?? <span className="opacity-60">Not set</span>}</b>
                    </div>
                  ))}
                  <p className="mt-2 border-t border-accent-line pt-[9px] text-2xs font-medium leading-[1.5] text-accent-dark">
                    Copy and offers written about this product stay inside these limits. Change them
                    in{" "}
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
                <dl className="grid grid-cols-[104px_minmax(0,1fr)] items-start gap-x-3 gap-y-[9px]">
                  <Row label="Status">
                    {status ? (
                      <span className={STOCK_STYLES[status]}>{STOCK_LABELS[status]}</span>
                    ) : (
                      dash
                    )}
                  </Row>
                  <Row label="Units">
                    <span className="tabular-nums">{product.stockUnits ?? dash}</span>
                  </Row>
                  <Row label="Source">{product.stockSource ?? dash}</Row>
                </dl>
              </Section>
              <Section title="">
                <p className="text-xs font-medium leading-[1.6] text-muted">
                  Stock is here for one reason: so Studio won&apos;t promote something you can&apos;t
                  ship. Reorder points, suppliers and lead times belong in your inventory system, not
                  your brand brain.
                </p>
              </Section>
            </>
          )}

          {tab === "Media" && (
            <Section
              title="Product images"
              action={
                <Link
                  href="/knowledge/images"
                  className="ml-auto rounded-lg border border-rule-2 px-[11px] py-1 text-2xs font-semibold text-ink-2 hover:bg-tile"
                >
                  Manage
                </Link>
              }
            >
              <p className="text-xs font-medium leading-[1.6] text-muted">
                {product.imageCount > 0
                  ? `${product.imageCount} images in Knowledge ▸ Images, tagged to this product. These are what the image creator reads when you ask for a new shot.`
                  : "No images tagged to this product yet. The image creator reads these when you ask for a new shot, so it has nothing to work from."}
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

      <div className="flex items-center gap-2.5 border-t border-rule bg-white px-[18px] py-3.5">
        <button
          type="button"
          className="inline-flex items-center gap-[7px] rounded-tile border border-rule-2 px-3.5 py-2.5 text-sm font-semibold text-ink-2 hover:bg-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span className="text-muted">
            <Icon name="trash" size={14} />
          </span>
          Delete
        </button>
        <Link
          href="/brand/products/import"
          className="ml-auto rounded-tile bg-grad-mark px-5 py-2.5 text-sm font-bold text-white drop-shadow-[0_4px_8px_rgba(232,73,32,.28)]"
        >
          Edit in catalogue
        </Link>
      </div>
    </aside>
  );
}
