"use client";

export interface Spec { id?: string; key: string; value: string }

/** Max 2000. Studio quotes specs verbatim, so a long one is a smell, not a limit. */
const KEY_MAX = 60;
const VALUE_MAX = 200;

export function SpecsEditor({
  specs, loading, onChange,
}: {
  specs: Spec[];
  loading: boolean;
  onChange: (next: Spec[]) => void;
}) {
  function update(i: number, patch: Partial<Spec>) {
    onChange(specs.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  }

  if (loading) {
    return <p className="py-2 text-xs font-medium text-muted">Loading specifications…</p>;
  }

  return (
    <>
      {specs.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {specs.map((s, i) => (
            <div key={s.id ?? `new-${i}`} className="grid grid-cols-[104px_minmax(0,1fr)_28px] items-start gap-1.5">
              <input
                aria-label={`Specification ${i + 1} name`}
                value={s.key}
                maxLength={KEY_MAX}
                placeholder="Absorbency"
                onChange={(e) => update(i, { key: e.target.value })}
                className="h-8 rounded-tile border border-rule bg-card px-2.5 text-xs font-semibold text-ink outline-none focus:border-accent focus:ring-2 focus:ring-tint-1"
              />
              <input
                aria-label={`Specification ${i + 1} value`}
                value={s.value}
                maxLength={VALUE_MAX}
                placeholder="8.4 L/kg"
                onChange={(e) => update(i, { value: e.target.value })}
                className="h-8 rounded-tile border border-rule bg-card px-2.5 font-mono text-xs text-ink-2 outline-none focus:border-accent focus:ring-2 focus:ring-tint-1"
              />
              <button
                type="button"
                aria-label={`Remove ${s.key || `specification ${i + 1}`}`}
                onClick={() => onChange(specs.filter((_, j) => j !== i))}
                className="grid h-8 w-7 place-items-center rounded-tile text-muted-2 hover:bg-tile hover:text-accent-dark"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => onChange([...specs, { key: "", value: "" }])}
        className={`${specs.length ? "mt-2" : ""} rounded-tile border border-dashed border-accent-line px-3 py-2 text-xs font-bold text-accent hover:bg-tint-1`}
      >
        + Add specification
      </button>

      <p className="mt-2 text-2xs font-medium text-muted">
        Structured facts Studio can quote verbatim — spec tables, comparison blocks, ad claims.
        A row with no name is discarded.
      </p>
    </>
  );
}

const DESC_MAX = 2000;

/**
 * Its own control rather than the shared Field: 196px minimum so the writing
 * area is a paragraph rather than two lines, and a counter, because this is the
 * field Studio writes from and length is a real constraint on it.
 */
export function DescriptionField({
  value, onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const over = value.length > DESC_MAX * 0.9;
  return (
    <>
      <label htmlFor="f-description" className="pt-1.5 text-xs font-medium text-muted">
        Description
      </label>
      <div>
        <textarea
          id="f-description"
          value={value}
          maxLength={DESC_MAX}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[196px] w-full resize-y rounded-tile border border-rule bg-card px-2.5 py-2 text-xs leading-[1.55] text-ink outline-none focus:border-accent focus:ring-2 focus:ring-tint-1"
        />
        <div className="mt-1 flex items-baseline gap-3">
          <span className="text-2xs font-medium text-muted">
            Studio writes from this. Facts, not adjectives — it will find its own.
          </span>
          <span className={`ml-auto font-mono text-2xs ${over ? "text-accent-dark" : "text-faint"}`}>
            {value.length} / {DESC_MAX}
          </span>
        </div>
      </div>
    </>
  );
}
