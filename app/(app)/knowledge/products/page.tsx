"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useBrand } from "@/lib/useBrand";
import Icon from "@/components/icon";
import ProductDrawer from "@/components/products/product-drawer";
import RemoveProductDialog, { UndoBar } from "@/components/products/remove-product";
import {
  categoryStyle,
  formatMoney,
  fromRow,
  margin,
  sortByMargin,
  STOCK_LABEL_KEYS,
  STOCK_STYLES,
  type Product,
} from "@/lib/products";
import { authedFetch } from "@/lib/authed-fetch";
import { useT } from "@/lib/i18n/use-t.tsx";

const PAGE_SIZE = 12;

type SortKey = "margin" | "price" | "name";

export default function ProductsPage() {
  const t = useT();
  const { brandId } = useBrand();

  const [products, setProducts] = useState<Product[] | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("margin");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Product | null>(null);
  const [removing, setRemoving] = useState(false);
  const [undo, setUndo] = useState<Product | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  useEffect(() => {
    if (!brandId) return;
    let cancelled = false;
    authedFetch(`/api/catalog?brand_id=${encodeURIComponent(brandId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setProducts((d.products ?? []).map(fromRow));
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [brandId]);

  const filtered = useMemo(() => {
    const list = products ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }, [products, query]);

  const sorted = useMemo(() => {
    if (sort === "margin") return sortByMargin(filtered, dir);
    const list = [...filtered];
    if (sort === "price") {
      list.sort((a, b) => {
        const av = a.retailPrice ?? -Infinity;
        const bv = b.retailPrice ?? -Infinity;
        return dir === "asc" ? av - bv : bv - av;
      });
    } else {
      list.sort((a, b) =>
        dir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
      );
    }
    return list;
  }, [filtered, sort, dir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const selected = sorted.find((p) => p.id === selectedId) ?? null;

  function toggleSort(key: SortKey) {
    if (sort === key) {
      setDir(dir === "asc" ? "desc" : "asc");
    } else {
      setSort(key);
      setDir(key === "name" ? "asc" : "asc");
    }
    setPage(1);
  }

  /**
   * Removing is a soft delete: the row keeps its costs, prices and guardrails
   * and is stamped `deleted_at`. The list updates immediately, and the write
   * is checked before that is treated as true.
   */
  async function remove(p: Product) {
    setRemoving(true);
    setRemoveError(null);
    try {
      const res = await authedFetch(
        `/api/catalog/product?id=${encodeURIComponent(p.id)}&brand_id=${encodeURIComponent(brandId)}`,
        { method: "DELETE" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // supabase-js never throws, so the route's own error is the only
        // signal that nothing happened. Say so rather than showing it gone.
        setRemoveError(data.message || data.error || t("product.saveFailed"));
        return;
      }
      setProducts((prev) => (prev ?? []).filter((x) => x.id !== p.id));
      if (selectedId === p.id) setSelectedId(null);
      setUndo(p);
    } catch {
      setRemoveError(t("product.saveFailed"));
    } finally {
      setRemoving(false);
      setConfirming(null);
    }
  }

  async function restore(p: Product) {
    setUndo(null);
    const res = await authedFetch(
      `/api/catalog/product?id=${encodeURIComponent(p.id)}&brand_id=${encodeURIComponent(brandId)}&restore=1`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      setRemoveError(t("product.restoreFailed"));
      return;
    }
    setProducts((prev) => [...(prev ?? []), p]);
  }

  const loading = products === null;
  const isEmpty = !loading && (products?.length ?? 0) === 0;
  const noResults = !loading && !isEmpty && sorted.length === 0;

  return (
    <div className="mx-auto flex max-w-[1560px] items-start gap-3 px-4 py-3">
      {/* Top level on purpose: these must not depend on the drawer being open. */}
      {removeError && (
        <div role="alert" className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-pill bg-[#a63232] px-5 py-3 text-sm font-semibold text-white shadow-float">
          {removeError}
          <button type="button" onClick={() => setRemoveError(null)} className="ml-3 underline">{t("common.dismiss")}</button>
        </div>
      )}
      {confirming && (
        <RemoveProductDialog
          name={confirming.name}
          busy={removing}
          onCancel={() => setConfirming(null)}
          onConfirm={() => void remove(confirming)}
        />
      )}
      {undo && (
        <UndoBar
          name={undo.name}
          onUndo={() => void restore(undo)}
          onDismiss={() => setUndo(null)}
        />
      )}

      <main className="flex min-h-[calc(100vh-24px)] min-w-0 flex-1 flex-col rounded-panel border border-rule bg-card p-5 drop-shadow-panel">
        <header className="flex flex-wrap items-start gap-3.5">
          <div>
            <h1 className="flex items-center gap-[9px] text-h2 font-bold">
              {t("nav.knowledge.products")}
              {!loading && (
                <span className="rounded-pill bg-tint-1 px-2.5 py-[3px] text-xs font-bold tabular-nums text-accent">
                  {products?.length ?? 0}
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm font-normal text-muted-2">
              {t("products.intro")}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <label className="flex h-9 w-[230px] items-center gap-2 rounded-tile border border-rule-2 px-3 focus-within:border-accent-line">
              <span className="shrink-0 text-faint">
                <Icon name="search" size={15} />
              </span>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={t("products.searchPlaceholder")}
                aria-label={t("products.search")}
                className="w-full border-0 bg-transparent p-0 text-sm text-ink placeholder:text-faint focus:outline-none"
              />
            </label>
            <Link
              href="/knowledge/products/import"
              className="grid h-9 place-items-center rounded-tile border border-rule-2 px-3 text-sm font-semibold text-ink-2 hover:bg-tile"
            >
              {t("common.import")}
            </Link>
            <Link
              href="/knowledge/products/import"
              className="inline-flex h-9 items-center gap-[7px] rounded-tile bg-grad-mark px-[15px] text-sm font-bold text-white drop-shadow-[0_4px_8px_rgba(232,73,32,.28)]"
            >
              <Icon name="plus" size={14} />
              {t("products.add")}
            </Link>
          </div>
        </header>

        {loading && <p className="mt-8 text-sm text-muted">{t("products.loading")}</p>}

        {isEmpty && (
          <div className="mt-8 rounded-card border border-rule bg-tile p-6">
            <h2 className="text-h3 font-bold">{t("products.none")}</h2>
            <p className="mt-2 max-w-[52ch] text-sm font-medium leading-[1.6] text-ink-2">
              {t("product.emptyBody")}
            </p>
            <div className="mt-4 flex gap-2.5">
              <Link
                href="/knowledge/products/import"
                className="rounded-tile bg-grad-mark px-4 py-2.5 text-sm font-bold text-white"
              >
                {t("products.add")}
              </Link>
              <Link
                href="/knowledge/products/import"
                className="rounded-tile border border-rule-2 bg-white px-4 py-2.5 text-sm font-semibold text-ink-2 hover:bg-tile"
              >
                {t("common.import")}
              </Link>
            </div>
          </div>
        )}

        {noResults && (
          <div className="mt-8 rounded-card border border-rule bg-tile p-6">
            <h2 className="text-h3 font-bold">{t("notes.noMatch", { query })}</h2>
            <p className="mt-2 text-sm font-medium text-ink-2">
              {t("products.noneMatch", { length: products?.length ?? 0 })}
            </p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-4 rounded-tile border border-rule-2 bg-white px-4 py-2.5 text-sm font-semibold text-ink-2 hover:bg-tile"
            >
              {t("products.clearSearch")}
            </button>
          </div>
        )}

        {!loading && !isEmpty && !noResults && (
          <>
            <div className="mt-[18px] overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <caption className="sr-only">
                  {t(dir === "asc" ? "product.sortedAsc" : "product.sortedDesc", { sort: t(`product.sort.${sort}`) })}
                </caption>
                <thead>
                  <tr>
                    <SortHeader label={t("product.colProduct")} active={sort === "name"} dir={dir} onClick={() => toggleSort("name")} />
                    <th scope="col" className="border-b border-rule px-2.5 pb-2.5 text-left text-2xs font-bold tracking-[0.3px] text-muted-2">
                      {t("common.category")}
                    </th>
                    <th scope="col" className="whitespace-nowrap border-b border-rule px-2.5 pb-2.5 text-right text-2xs font-bold tracking-[0.3px] text-muted-2">
                      {t("products.stock")}
                    </th>
                    <th scope="col" className="whitespace-nowrap border-b border-rule px-2.5 pb-2.5 text-right text-2xs font-bold tracking-[0.3px] text-muted-2">
                      {t("common.cost")}
                    </th>
                    <SortHeader label={t("product.colPriceVat")} numeric active={sort === "price"} dir={dir} onClick={() => toggleSort("price")} />
                    <SortHeader label={t("product.colMargin")} numeric active={sort === "margin"} dir={dir} onClick={() => toggleSort("margin")} />
                    <th scope="col" className="border-b border-rule pb-2.5">
                      <span className="sr-only">{t("products.openDetail")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p) => {
                    const m = margin(p);
                    const isSelected = p.id === selectedId;
                    return (
                      <tr
                        key={p.id}
                        ref={(el) => {
                          rowRefs.current[p.id] = el;
                        }}
                        tabIndex={0}
                        aria-selected={isSelected}
                        onClick={() => setSelectedId(p.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId(p.id);
                          }
                        }}
                        className={`cursor-pointer border-b border-rule last:border-b-0 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
                          isSelected ? "bg-tint-3" : "hover:bg-[#fbfaf9]"
                        }`}
                      >
                        <td className={`px-2.5 py-3 align-middle ${isSelected ? "shadow-[inset_3px_0_0_#f0562a]" : ""}`}>
                          <div className="flex min-w-0 items-center gap-3">
                            {p.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.imageUrl}
                                alt=""
                                aria-hidden="true"
                                className="h-[52px] w-[52px] shrink-0 rounded-tile border border-rule object-cover"
                              />
                            ) : (
                              <span
                                aria-hidden="true"
                                className={`grid h-[52px] w-[52px] shrink-0 place-items-center rounded-tile ${categoryStyle(p.category)}`}
                              >
                                <Icon name="bag" size={24} />
                              </span>
                            )}
                            <div className="min-w-0">
                              <div className="text-sm font-bold tracking-[-0.1px]">{p.name}</div>
                              <div className="mt-0.5 max-w-[34ch] truncate text-xs font-normal leading-[1.35] text-muted-2">
                                {p.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2.5 py-3 align-middle">
                          {p.category && (
                            <span className={`inline-block whitespace-nowrap rounded-pill px-[11px] py-1 text-2xs font-bold ${categoryStyle(p.category)}`}>
                              {p.category}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-3 text-right align-middle tabular-nums">
                          {p.stockUnits != null && (
                            <b className="block text-sm font-bold">{p.stockUnits}</b>
                          )}
                          {p.stockStatus ? (
                            <span className={`text-2xs font-semibold ${STOCK_STYLES[p.stockStatus]}`}>
                              {t(STOCK_LABEL_KEYS[p.stockStatus])}
                            </span>
                          ) : (
                            <span className="text-2xs text-faint">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-3 text-right align-middle tabular-nums">
                          <span className="text-sm font-semibold text-ink-2">
                            {p.landedCost != null
                              ? formatMoney(p.landedCost, p.currency)
                              : p.factoryCost != null
                                ? formatMoney(p.factoryCost, p.currency)
                                : "—"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-3 text-right align-middle tabular-nums">
                          <span className="text-sm font-bold text-ink">
                            {p.retailPrice != null ? formatMoney(p.retailPrice, p.currency) : "—"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-3 text-right align-middle tabular-nums">
                          {m ? (
                            <span className="text-sm font-bold">
                              {m.pct.toFixed(0)}%{!m.exact && <span className="text-amber">*</span>}
                              <small className="block text-micro font-semibold tracking-[0.2px] text-muted-2">
                                {formatMoney(m.cash, p.currency)}
                              </small>
                            </span>
                          ) : (
                            // A wrong margin is worse than a blank one.
                            <span className="text-sm font-bold text-faint" title={t("products.noCost")}>
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-2.5 py-3 align-middle">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Stops the row click, which opens the drawer. */}
                            <button
                              type="button"
                              aria-label={t("product.removeName", { name: p.name })}
                              title={t("product.removeName", { name: p.name })}
                              onClick={(e) => { e.stopPropagation(); setConfirming(p); }}
                              className="grid h-7 w-7 place-items-center rounded-[9px] border border-rule-2 bg-white text-muted-2 hover:border-[#f3c9c9] hover:bg-[#fdecec] hover:text-[#a63232] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                            >
                              <Icon name="trash" size={13} />
                            </button>
                            <span
                              aria-hidden="true"
                              className={`grid h-7 w-7 place-items-center rounded-[9px] border ${
                                isSelected
                                  ? "border-accent-line bg-tint-1 text-accent"
                                  : "border-rule-2 bg-white text-ink-2"
                              }`}
                            >
                              <Icon name="chevronRight" size={13} />
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {sorted.some((p) => !margin(p)?.exact) && (
              <p className="mt-3 text-2xs font-medium text-muted">
                <span className="text-amber">*</span> {t("product.estimatedNote")}
              </p>
            )}

            <nav className="mt-auto flex flex-wrap items-center gap-2.5 pt-4" aria-label={t("products.pagination")}>
              <button
                type="button"
                aria-label={t("products.prevPage")}
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
                className="grid h-[30px] min-w-[30px] place-items-center rounded-lg text-muted hover:bg-tile disabled:opacity-40"
              >
                <Icon name="chevronLeft" size={12} />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: pageCount }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === pageCount || Math.abs(n - current) <= 1)
                  .map((n, i, arr) => (
                    <span key={n} className="flex gap-1">
                      {i > 0 && arr[i - 1] !== n - 1 && (
                        <span className="grid h-[30px] min-w-[30px] place-items-center text-xs text-faint">…</span>
                      )}
                      <button
                        type="button"
                        aria-current={n === current ? "page" : undefined}
                        onClick={() => setPage(n)}
                        className={`grid h-[30px] min-w-[30px] place-items-center rounded-lg px-2 text-xs ${
                          n === current ? "bg-tint-1 font-bold text-accent" : "font-semibold text-ink-2 hover:bg-tile"
                        }`}
                      >
                        {n}
                      </button>
                    </span>
                  ))}
              </div>
              <button
                type="button"
                aria-label={t("products.nextPage")}
                disabled={current === pageCount}
                onClick={() => setPage(current + 1)}
                className="grid h-[30px] min-w-[30px] place-items-center rounded-lg text-muted hover:bg-tile disabled:opacity-40"
              >
                <Icon name="chevronRight" size={12} />
              </button>
              <span className="text-xs font-medium text-muted-2">
                {t("product.showing", {
                  from: (current - 1) * PAGE_SIZE + 1,
                  to: Math.min(current * PAGE_SIZE, sorted.length),
                  total: sorted.length,
                })}
              </span>
            </nav>
          </>
        )}
      </main>

      {/* Below 1280px the drawer would crush the table, so it is hidden there. */}
      {selected && (
        <div className="hidden xl:block">
      <ProductDrawer
            product={selected}
            brandId={brandId}
            onClose={() => setSelectedId(null)}
            onSaved={(updated) =>
              setProducts((list) =>
                (list ?? []).map((p) => (p.id === updated.id ? updated : p)),
              )
            }
            returnFocusTo={rowRefs.current[selected.id]}
          />
        </div>
      )}
    </div>
  );
}

function SortHeader({
  label,
  numeric,
  active,
  dir,
  onClick,
}: {
  label: string;
  numeric?: boolean;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th
      scope="col"
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={`whitespace-nowrap border-b border-rule px-2.5 pb-2.5 text-2xs font-bold tracking-[0.3px] text-muted-2 ${
        numeric ? "text-right" : "text-left"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          active ? "text-accent" : "hover:text-ink-2"
        }`}
      >
        {label}
        <span aria-hidden="true" className={active ? "" : "opacity-0"}>
          {dir === "asc" ? "▲" : "▼"}
        </span>
      </button>
    </th>
  );
}
