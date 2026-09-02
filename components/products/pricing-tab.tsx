"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import Icon from "@/components/icon";
import { formatMoney } from "@/lib/products";
import {
  GROUPS, LINES, PRESETS, PRESET_LABELS, contributionMargin, cogsTotal,
  grossMargin, groupTotal, toggleLine, visibleLines,
  type CustomLine, type LineGroup, type LineId, type Preset, type Values,
} from "@/lib/pricing-lines";

const fieldClass =
  "w-full rounded-lg border border-rule-2 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-2 focus:border-accent-line focus:outline-none focus:ring-2 focus:ring-tint-1";

const GROUP_TONE: Record<LineGroup, string> = {
  in: "bg-grad-more", goods: "bg-grad-numbers", sell: "bg-grad-images",
};

/**
 * The Pricing tab.
 *
 * A line belongs to one group and a group carries its own total, because a
 * fixed list of five fields asked a digital product for freight. Turning a line
 * off hides it and stops it asking; it never deletes the value, since there is
 * no undo on a form field.
 *
 * Every number here comes from lib/pricing-lines.ts, which imports the
 * formulas from lib/numbers.ts rather than restating them.
 */
export default function PricingTab({
  currency, track, values, visible, custom, notes,
  onValue, onVisible, onCustom, onNotes,
}: {
  currency: string;
  track: string | null;
  values: Values;
  visible: string[] | null;
  custom: CustomLine[];
  notes: string;
  onValue: (column: string, raw: string) => void;
  onVisible: (next: LineId[]) => void;
  onCustom: (next: CustomLine[]) => void;
  onNotes: (v: string) => void;
}) {
  const shown = useMemo(() => visibleLines(visible, track), [visible, track]);
  const [adding, setAdding] = useState<LineGroup | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  const gross = grossMargin(shown, values, custom);
  const contrib = contributionMargin(shown, values, custom);
  const cogs = cogsTotal(shown, values, custom);
  const money = (n: number) => formatMoney(n, currency);

  const addCustom = useCallback((group: LineGroup) => {
    const label = newLabel.trim();
    if (!label) return;
    const raw = newValue.replace(",", ".");
    const num = raw === "" ? null : Number(raw);
    onCustom([...custom, { label, value: Number.isFinite(num as number) ? (num as number) : null, group }]);
    setNewLabel(""); setNewValue(""); setAdding(null);
  }, [newLabel, newValue, custom, onCustom]);

  const activePreset = (Object.keys(PRESETS) as Preset[])
    .find((p) => PRESETS[p].length === shown.length && PRESETS[p].every((id) => shown.includes(id)));

  return (
    <>
      {/* ── the two margins ── */}
      <section className="[&+&]:mt-[22px]">
        <div className="grid grid-cols-2 gap-2.5">
          <MarginCard
            label="Gross margin" tone="good" money={money}
            result={gross}
            note="Net of tax, against cost of goods."
          />
          <MarginCard
            label="Contribution" tone="lav" money={money}
            result={contrib}
            note="After cost to sell as well."
          />
        </div>
        {gross?.assumedNoTax && (
          <p className="mt-2 rounded-tile bg-amber-wash px-3 py-2 text-2xs font-medium leading-[1.5] text-amber">
            No tax rate recorded, so both figures assume zero. A missing rate treated as zero reads
            the gross price as net and flatters the margin.
          </p>
        )}
      </section>

      {/* ── which lines this product uses ── */}
      <section className="mt-[22px]">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold tracking-[-0.15px]">Lines on this product</h4>
          <div className="ml-auto flex gap-1">
            {(Object.keys(PRESETS) as Preset[]).map((p) => (
              <button
                key={p} type="button"
                onClick={() => onVisible([...PRESETS[p]])}
                aria-pressed={activePreset === p}
                className={`rounded-pill px-2.5 py-1 text-micro font-bold ${
                  activePreset === p ? "bg-ink text-white" : "bg-tile text-muted hover:text-ink-2"
                }`}
              >
                {PRESET_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-1 text-2xs font-medium leading-[1.5] text-muted">
          Turning one off hides the row and stops it asking. The number you typed stays put.
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {LINES.map((l) => {
            const on = shown.includes(l.id);
            return (
              <button
                key={l.id} type="button"
                aria-pressed={on}
                onClick={() => onVisible(toggleLine(shown, l.id))}
                className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-micro font-bold ${
                  on ? "border-accent-line bg-tint-1 text-accent-dark" : "border-rule-2 bg-white text-muted"
                }`}
              >
                {on && <Icon name="check" size={10} />}
                {l.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── the groups ── */}
      {GROUPS.map((g) => {
        const lines = LINES.filter((l) => l.group === g.id && shown.includes(l.id));
        const mine = custom.filter((c) => c.group === g.id);
        if (!lines.length && !mine.length && adding !== g.id) {
          return (
            <section key={g.id} className="mt-[22px]">
              <GroupHeader g={g} total={null} money={money} />
              <button type="button" onClick={() => setAdding(g.id)}
                className="mt-2 text-2xs font-bold text-accent-dark hover:underline">
                + Add your own line
              </button>
            </section>
          );
        }
        const total = groupTotal(g.id, shown, values, custom);
        return (
          <section key={g.id} className="mt-[22px]">
            <GroupHeader g={g} total={total} money={money} />
            <div className="mt-2 grid grid-cols-[128px_minmax(0,1fr)] items-start gap-x-3 gap-y-2">
              {lines.map((l) => (
                <PriceField
                  key={l.id} label={l.label}
                  value={String(values[l.column] ?? "")}
                  suffix={l.hint === "%" ? "%" : currency}
                  hint={l.hint && l.hint !== "%" ? l.hint : undefined}
                  onChange={(v) => onValue(l.column, v)}
                />
              ))}
              {mine.map((c, i) => (
                <CustomField
                  key={`${c.label}-${i}`} line={c} suffix={currency}
                  onChange={(v) => onCustom(custom.map((x) => (x === c ? { ...x, value: v } : x)))}
                  onRemove={() => onCustom(custom.filter((x) => x !== c))}
                />
              ))}
              {g.id === "in" && (
                <>
                  <dt className="pt-1.5 text-xs font-medium text-muted">Net price</dt>
                  <dd className="m-0 pt-1.5 text-xs font-semibold tabular-nums text-ink-2">
                    {gross ? money(gross.cash + (cogs ?? 0)) : "—"}
                  </dd>
                </>
              )}
            </div>

            {adding === g.id ? (
              <div className="mt-2.5 rounded-card border border-rule bg-tile p-2.5">
                <div className="grid grid-cols-[minmax(0,1fr)_86px] gap-2">
                  <input autoFocus value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="What is it called?" aria-label="Line name" className={fieldClass} />
                  <input value={newValue} onChange={(e) => setNewValue(e.target.value.replace(/[^0-9.,-]/g, ""))}
                    placeholder="0.00" aria-label="Line value" inputMode="decimal"
                    className={`${fieldClass} tabular-nums`} />
                </div>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => addCustom(g.id)} disabled={!newLabel.trim()}
                    className="rounded-tile bg-grad-mark px-3 py-1.5 text-2xs font-bold text-white disabled:opacity-50">
                    Add it
                  </button>
                  <button type="button" onClick={() => { setAdding(null); setNewLabel(""); setNewValue(""); }}
                    className="text-2xs font-bold text-muted hover:text-ink-2">Cancel</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setAdding(g.id)}
                className="mt-2 text-2xs font-bold text-accent-dark hover:underline">
                + Add your own line
              </button>
            )}
          </section>
        );
      })}

      {/* ── notes: the same field as Description, because it is one ── */}
      <section className="mt-[22px]">
        <h4 className="text-sm font-bold tracking-[-0.15px]">Notes</h4>
        <div className="mt-2 grid grid-cols-[104px_minmax(0,1fr)] items-start gap-x-3 gap-y-2">
          <label htmlFor="f-pricing-notes" className="pt-1.5 text-xs font-medium text-muted">
            Pricing notes
          </label>
          <div>
            <textarea
              id="f-pricing-notes" rows={3} value={notes}
              onChange={(e) => onNotes(e.target.value)}
              placeholder="never quote below 26.00 on the webshop, it undercuts our own resellers"
              className={`${fieldClass} resize-y leading-[1.5]`}
            />
            <p className="mt-1 text-2xs font-medium text-muted">
              Studio reads this and follows it. {notes.length} characters.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-[22px]">
        <p className="text-xs font-medium leading-[1.6] text-muted">
          Floor price, maximum discount and minimum margin now live in{" "}
          <Link href="/numbers/pricing" className="font-semibold text-accent-dark underline underline-offset-2">
            Numbers ▸ Pricing &amp; offers
          </Link>
          . Same limits, same enforcement, the room this app keeps pricing rules in.
        </p>
      </section>
    </>
  );
}

function GroupHeader({
  g, total, money,
}: { g: { id: LineGroup; label: string; note: string }; total: number | null; money: (n: number) => string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`grid h-6 w-6 place-items-center rounded-tile ${GROUP_TONE[g.id]}`} aria-hidden="true">
        <Icon name="check" size={11} />
      </span>
      <div className="min-w-0">
        <h4 className="text-sm font-bold tracking-[-0.15px]">{g.label}</h4>
        <p className="text-2xs font-medium text-muted">{g.note}</p>
      </div>
      {/* A configurable list is only readable if the home has a number. */}
      <b className="ml-auto shrink-0 text-sm font-bold tabular-nums">
        {total == null ? <span className="text-faint">—</span> : money(total)}
      </b>
    </div>
  );
}

function PriceField({
  label, value, suffix, hint, onChange,
}: { label: string; value: string; suffix: string; hint?: string; onChange: (v: string) => void }) {
  const id = `pl-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <>
      <label htmlFor={id} className="pt-1.5 text-xs font-medium text-muted">
        {label}
        {hint && <span className="mt-0.5 block text-micro font-normal text-faint">{hint}</span>}
      </label>
      <div className="flex items-center gap-1.5">
        <input id={id} inputMode="decimal" value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.,-]/g, ""))}
          className={`${fieldClass} tabular-nums`} />
        <span className="shrink-0 text-2xs font-semibold text-muted">{suffix}</span>
      </div>
    </>
  );
}

function CustomField({
  line, suffix, onChange, onRemove,
}: { line: CustomLine; suffix: string; onChange: (v: number | null) => void; onRemove: () => void }) {
  return (
    <>
      <span className="pt-1.5 text-xs font-medium text-muted">{line.label}</span>
      <div className="flex items-center gap-1.5">
        <input inputMode="decimal" value={line.value == null ? "" : String(line.value)}
          aria-label={line.label}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.,-]/g, "").replace(",", ".");
            onChange(raw === "" ? null : Number(raw));
          }}
          className={`${fieldClass} tabular-nums`} />
        <span className="shrink-0 text-2xs font-semibold text-muted">{suffix}</span>
        <button type="button" onClick={onRemove} aria-label={`Remove ${line.label}`}
          className="shrink-0 text-muted-2 hover:text-accent-dark">
          <Icon name="close" size={11} />
        </button>
      </div>
    </>
  );
}

function MarginCard({
  label, tone, result, note, money,
}: {
  label: string; tone: "good" | "lav"; note: string; money: (n: number) => string;
  result: { pct: number; cash: number } | null;
}) {
  const bar = tone === "good" ? "bg-good" : "bg-lav-ink";
  return (
    <div className="rounded-card border border-rule bg-tile px-3 py-[11px]">
      <div className="text-micro font-extrabold uppercase tracking-[0.7px] text-muted-2">{label}</div>
      {result ? (
        <>
          <div className="mt-1 flex items-baseline gap-2">
            <b className="text-[22px] font-bold tracking-[-0.6px] tabular-nums">{result.pct.toFixed(1)}%</b>
            <span className="text-2xs font-semibold text-muted">{money(result.cash)}</span>
          </div>
          <div className="relative mt-2 h-1.5 overflow-hidden rounded-pill bg-rule-2">
            <i className={`absolute inset-y-0 left-0 block rounded-pill ${result.pct < 0 ? "bg-accent" : bar}`}
              style={{ width: `${Math.max(0, Math.min(100, result.pct))}%` }} />
          </div>
        </>
      ) : (
        // A blank figure is better than a fabricated one.
        <div className="mt-1 text-[22px] font-bold tracking-[-0.6px] text-faint">—</div>
      )}
      <p className="mt-1.5 text-micro font-medium leading-[1.45] text-muted">{note}</p>
    </div>
  );
}
