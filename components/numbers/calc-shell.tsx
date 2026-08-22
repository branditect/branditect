"use client";

import Link from "next/link";
import Icon, { type IconName } from "@/components/icon";

export type Tone = "green" | "lavender" | "orange" | "blue";

/** Each calculator wears the colour it has on the Numbers landing page. */
export const TONE: Record<Tone, { tile: string; num: string; promise: string; go: string; panel: string; ink: string }> = {
  green: {
    tile: "bg-green-wash text-green-ink", num: "bg-good", promise: "text-green-ink",
    go: "bg-green-wash text-green-ink border border-green-line hover:bg-[#ddf0e5]",
    panel: "border-green-line bg-green-wash", ink: "text-green-ink",
  },
  lavender: {
    tile: "bg-lavender text-lav-ink", num: "bg-[#7b5ea7]", promise: "text-lav-ink",
    go: "bg-lavender text-lav-ink border border-lav-line hover:bg-[#e0d3f4]",
    panel: "border-lav-line bg-lavender", ink: "text-lav-ink",
  },
  orange: {
    tile: "bg-tint-2 text-accent-dark", num: "bg-accent", promise: "text-accent-dark",
    go: "bg-tint-1 text-accent-dark border border-accent-line hover:bg-tint-2",
    panel: "border-accent-line bg-tint-1", ink: "text-accent-dark",
  },
  blue: {
    tile: "bg-blue-wash text-blue-ink", num: "bg-[#4a72b8]", promise: "text-blue-ink",
    go: "bg-blue-wash text-blue-ink border border-blue-line hover:bg-[#dde8fb]",
    panel: "border-blue-line bg-blue-wash", ink: "text-blue-ink",
  },
};

export const fieldClass =
  "w-full rounded-lg border border-rule-2 bg-white px-2.5 py-2 text-sm font-semibold tabular-nums text-ink-2 focus:border-accent-line focus:outline-none focus:ring-2 focus:ring-tint-1";

/** Blank means "not recorded" and stays null. Accepts either decimal separator. */
export const toNum = (s: string): number | null => {
  const t = s.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isNaN(n) ? null : n;
};
export const numStr = (n: number | null | undefined) => (n == null ? "" : String(n));
export const clean = (v: string) => v.replace(/[^0-9.,-]/g, "");

export function Field({
  label, value, onChange, suffix, hint, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  suffix?: string; hint?: string; placeholder?: string;
}) {
  const id = `f-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_128px] items-center gap-3">
      <label htmlFor={id} className="text-sm font-medium text-ink-2">
        {label}
        {hint && <span className="mt-0.5 block text-micro font-medium text-muted">{hint}</span>}
      </label>
      <div className="flex items-center gap-1.5">
        <input id={id} inputMode="decimal" value={value} placeholder={placeholder ?? "—"}
          onChange={(e) => onChange(clean(e.target.value))} className={fieldClass} />
        {suffix && <span className="w-6 shrink-0 text-2xs font-semibold text-muted">{suffix}</span>}
      </div>
    </div>
  );
}

export function CalcShell({
  n, tone, title, promise, children,
}: {
  n: number; tone: Tone; title: string; promise: string; children: React.ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div className="mx-auto flex max-w-shell flex-col gap-[18px] px-4 pb-12 pt-[22px]">
      <header className="flex flex-wrap items-start gap-3">
        <div className="min-w-0">
          <Link href="/numbers" className="mb-1 inline-flex items-center gap-1 text-2xs font-semibold text-accent">
            <Icon name="chevronLeft" size={11} /> Numbers
          </Link>
          <div className="flex items-center gap-[11px]">
            <span className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-tile ${t.tile}`}>
              <Icon name="numbers" size={18} />
              <span className={`absolute -left-1.5 -top-1.5 grid h-[18px] w-[18px] place-items-center rounded-full text-micro font-bold text-white ${t.num}`}>
                {n}
              </span>
            </span>
            <div>
              <h1 className="text-display font-bold leading-[1.15]">{title}</h1>
              <div className={`mt-0.5 text-xs font-bold ${t.promise}`}>{promise}</div>
            </div>
          </div>
        </div>
        <span className="ml-auto shrink-0 rounded-pill bg-lavender px-2.5 py-[3px] text-micro font-extrabold uppercase tracking-[0.9px] text-lav-ink">
          Sandbox
        </span>
      </header>
      {children}
      <p className="text-2xs font-medium leading-[1.6] text-muted">
        Nothing here is saved. These figures live on the product card — use{" "}
        <b className="text-ink-2">Apply to product</b> and press save there.
      </p>
    </div>
  );
}

/**
 * The Apply handoff. Visually dominant on purpose: the risk this whole
 * sandbox design creates is that people explore, get their answer, and never
 * write it back — leaving Studio's guardrails running on stale costs.
 */
export function ApplyPanel({
  tone, productId, productName, disabled, children, fields,
}: {
  tone: Tone; productId: string | null; productName: string | null;
  disabled?: boolean; children: React.ReactNode;
  fields: Record<string, string | number>;
}) {
  const t = TONE[tone];
  const query = new URLSearchParams(
    Object.entries(fields).reduce<Record<string, string>>((a, [k, v]) => {
      a[k] = String(v);
      return a;
    }, {}),
  );
  if (productId) query.set("product", productId);

  return (
    <div className={`rounded-card border p-3.5 ${t.panel}`}>
      {children}
      {productId ? (
        <Link href={`/knowledge/products?${query.toString()}`}
          className="mt-3 flex items-center justify-center gap-[7px] rounded-tile bg-grad-mark p-2.5 text-sm font-bold text-white drop-shadow-[0_5px_10px_rgba(232,73,32,.3)] hover:brightness-[1.03]"
          aria-disabled={disabled}>
          Apply to {productName}
          <Icon name="arrow" size={14} />
        </Link>
      ) : (
        <p className={`mt-3 text-2xs font-medium leading-[1.5] ${t.ink} opacity-80`}>
          Pick a product above to apply this. Without one this is a quick calculation — useful for
          pricing something you haven&apos;t added yet, and nothing is lost by staying here.
        </p>
      )}
    </div>
  );
}

export function ProductPicker({
  products, value, onChange, label = "Prefill from",
}: {
  products: { id: string; name: string }[];
  value: string; onChange: (v: string) => void; label?: string;
}) {
  if (products.length === 0) {
    return (
      <p className="rounded-card border border-rule bg-tile px-3.5 py-3 text-xs font-medium leading-[1.55] text-muted">
        No products yet, so there is nothing to prefill from — this is a quick calculation. That is
        a normal way to use it: work out the numbers first, add the product after.
      </p>
    );
  }
  return (
    <label className="block">
      <span className="text-micro font-extrabold uppercase tracking-[0.8px] text-muted-2">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${fieldClass} mt-1.5`}>
        <option value="">Quick calculation — no product</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </label>
  );
}

export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-panel border border-rule bg-card p-[18px] drop-shadow-panel">
      <h2 className="text-h3 font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function Readout({
  tone, label, value, sub, warn,
}: {
  tone: Tone; label: string; value: string; sub?: React.ReactNode; warn?: boolean;
}) {
  const t = TONE[tone];
  return (
    <div className={`rounded-tile border p-3.5 ${warn ? "border-accent-line bg-tint-1" : t.panel}`}>
      <div className={`text-micro font-extrabold uppercase tracking-[0.8px] opacity-75 ${warn ? "text-accent-dark" : t.ink}`}>
        {label}
      </div>
      <div className={`text-[24px] font-bold leading-[1.15] tracking-[-0.7px] tabular-nums ${warn ? "text-accent-dark" : t.ink}`}>
        {value}
      </div>
      {sub && (
        <p className={`mt-1 text-micro font-medium leading-[1.45] opacity-80 ${warn ? "text-accent-dark" : t.ink}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

export const ICONS: Record<Tone, IconName> = {
  green: "bag", lavender: "target", orange: "numbers", blue: "numbers",
};
