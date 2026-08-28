"use client";

/**
 * Studio ▸ Write — rebuilt from branditect-ui/spec/studio-write.md.
 *
 * This renders inside app/(app)/layout.tsx. The sidebar stays; .wrap is 1180px
 * because that is the space beside it. Do not make this full-screen.
 *
 * The brief stays on screen while drafts appear beside it — writing is
 * iterating on the brief, and a wizard that hides the brief behind the result
 * forces a back-navigation on every attempt.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Icon, { type IconName } from "@/components/icon";
import { useBrand } from "@/lib/useBrand";
import {
  FORMATS,
  findFormat,
  isThinBrief,
  wordCount,
  type Draft,
  type FormatId,
  type Length,
} from "@/lib/studio-write";
import s from "@/components/studio/write.module.css";

interface Product {
  id: string;
  name: string;
}

/** A draft in flight, with whatever it already knows about itself. */
type Slot =
  | { state: "writing" }
  | { state: "done"; draft: Draft }
  | { state: "failed"; reason: string };

const LENGTHS: { id: Length; label: string }[] = [
  { id: "short", label: "Short" },
  { id: "medium", label: "Medium" },
  { id: "long", label: "Long" },
];

export default function WritePage() {
  const { brandId, loading: brandLoading } = useBrand();

  // ── the brief
  const [format, setFormat] = useState<FormatId>("ad");
  const [formatOther, setFormatOther] = useState("");
  const [brief, setBrief] = useState("");
  const [productId, setProductId] = useState("");
  const [length, setLength] = useState<Length>("medium");
  const [count, setCount] = useState<1 | 3>(3);

  // ── the output
  const [slots, setSlots] = useState<Slot[]>([]);
  const [ranAt, setRanAt] = useState<string | null>(null);
  const [ranWith, setRanWith] = useState<string>("");
  const [tone, setTone] = useState<string | null>(null);
  const [missing, setMissing] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const otherRef = useRef<HTMLInputElement>(null);

  const def = findFormat(format)!;

  useEffect(() => {
    if (brandLoading || !brandId || brandId === "default") return;
    let live = true;
    fetch(`/api/catalog?brand_id=${encodeURIComponent(brandId)}`)
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d) => {
        if (!live) return;
        const rows = Array.isArray(d.products) ? d.products : [];
        setProducts(rows.map((p: Product) => ({ id: p.id, name: p.name })).filter((p: Product) => p.name));
      })
      .catch(() => {
        /* the picker is optional — a missing catalogue is not an error here */
      });
    return () => {
      live = false;
    };
  }, [brandId, brandLoading]);

  const productName = useMemo(
    () => products.find((p) => p.id === productId)?.name ?? null,
    [products, productId]
  );

  const canWrite = brief.trim().length > 0 && (format !== "other" || formatOther.trim().length > 0);

  const generate = useCallback(
    async (howMany: 1 | 3) => {
      if (!canWrite || generating) return;
      setGenerating(true);
      setMissing("");
      setSlots(Array.from({ length: howMany }, () => ({ state: "writing" }) as Slot));
      setRanAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setRanWith(
        [format === "other" ? formatOther.trim() : def.label, productName].filter(Boolean).join(" · ")
      );

      try {
        const res = await fetch("/api/copy-architect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand_id: brandId,
            format,
            format_other: formatOther.trim() || null,
            brief: brief.trim(),
            product_id: productId || null,
            length,
            drafts: howMany,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          const reason = typeof data?.error === "string" ? data.error : "That didn't work.";
          // The brief is never lost on a failure.
          setSlots(Array.from({ length: howMany }, () => ({ state: "failed", reason }) as Slot));
          return;
        }

        const returned: Draft[] = Array.isArray(data.drafts) ? data.drafts : [];
        setTone(typeof data.tone === "string" ? data.tone : null);
        setMissing(typeof data.missing === "string" ? data.missing : "");
        setSlots(returned.map((draft) => ({ state: "done", draft }) as Slot));
      } catch (err) {
        const reason = err instanceof Error ? err.message : "That didn't work.";
        setSlots(Array.from({ length: howMany }, () => ({ state: "failed", reason }) as Slot));
      } finally {
        setGenerating(false);
      }
    },
    [brandId, brief, canWrite, def.label, format, formatOther, generating, length, productId, productName]
  );

  const copy = useCallback((text: string, i: number) => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(i);
        window.setTimeout(() => setCopied(null), 1600);
      },
      () => {
        /* clipboard denied — the body is selectable */
      }
    );
  }, []);

  const hasOutput = slots.length > 0;

  return (
    <div className={s.wrap}>
      <div className={s.head}>
        <div>
          <div className={s.kick}>Studio</div>
          <h1>Write</h1>
          <p className={s.sub}>
            Two answers and you have a draft. Everything it writes obeys your strategy, your tone of
            voice and your real product facts.
          </p>
        </div>
      </div>

      <div className={s.cols}>
        {/* ═══════════ BRIEF ═══════════ */}
        <aside className={s.brief}>
          <div className={s.step}>
            <span className={s.n}>1</span>
            <h3>What are we writing?</h3>
          </div>

          <div className={s.fmts}>
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={[
                  s.fmt,
                  s[f.tone],
                  f.id === "other" ? s.other : "",
                  format === f.id ? s.on : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-pressed={format === f.id}
                onClick={() => {
                  setFormat(f.id);
                  if (f.id === "other") window.setTimeout(() => otherRef.current?.focus(), 0);
                }}
              >
                {f.id === "other" ? (
                  <Icon name={f.icon as IconName} size={14} />
                ) : (
                  <span className={s.ic}>
                    <Icon name={f.icon as IconName} size={14} />
                  </span>
                )}
                <span className={s.t}>{f.label}</span>
              </button>
            ))}
          </div>

          {format === "other" && (
            <input
              ref={otherRef}
              className={s.otherInput}
              value={formatOther}
              onChange={(e) => setFormatOther(e.target.value)}
              placeholder="What are we writing? A press note, a video script…"
              aria-label="What are we writing?"
            />
          )}

          <div className={`${s.step} ${s.stepTop}`}>
            <span className={s.n}>2</span>
            <h3>What&rsquo;s it about?</h3>
          </div>
          <textarea
            className={s.ta}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="One or two lines is enough. Say what happened and who it's for."
            aria-label="What's it about?"
          />
          <div className={s.egs}>
            {def.examples.map((eg) => (
              <button key={eg} type="button" className={s.eg} onClick={() => setBrief(eg)}>
                {eg}
              </button>
            ))}
          </div>
          <p className={s.eghint}>
            Tap an example to fill it in, then edit. These change with the format you picked.
          </p>

          <div className={`${s.step} ${s.stepTop}`}>
            <span className={s.n}>3</span>
            <h3>Options</h3>
            <span className={s.opt}>optional</span>
          </div>
          <div className={s.opts}>
            <div className={s.orow}>
              <span className={s.k}>About a product</span>
              <select
                className={s.sel}
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                aria-label="About a product"
              >
                <option value="">No particular product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={s.orow}>
              <span className={s.k}>Length</span>
              <div className={s.seg} role="group" aria-label="Length">
                {LENGTHS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className={length === l.id ? s.on : undefined}
                    aria-pressed={length === l.id}
                    onClick={() => setLength(l.id)}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={s.orow}>
              <span className={s.k}>Drafts</span>
              <div className={s.seg} role="group" aria-label="How many drafts">
                {([1, 3] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={count === c ? s.on : undefined}
                    aria-pressed={count === c}
                    onClick={() => setCount(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            className={s.gen}
            disabled={!canWrite || generating}
            onClick={() => generate(count)}
          >
            <Icon name="spark" size={17} />
            {generating ? "Writing…" : "Write it"}
          </button>

          <div className={s.source}>
            <Icon name="book" size={14} />
            <div>
              Writes from{" "}
              <b>
                your strategy, tone of voice, Boundaries and{" "}
                {products.length === 1 ? "1 product record" : `${products.length} product records`}
              </b>
              . It won&rsquo;t invent a fact that isn&rsquo;t in there. If something&rsquo;s missing
              it says so instead of guessing.
            </div>
          </div>
        </aside>

        {/* ═══════════ DRAFTS ═══════════ */}
        <main>
          <div className={s.outhead}>
            <h2>Drafts</h2>
            {ranAt && <span className={s.meta}>{[ranWith, ranAt].filter(Boolean).join(" · ")}</span>}
            {hasOutput && (
              <button
                type="button"
                className={s.re}
                disabled={generating || !canWrite}
                onClick={() => generate(count)}
              >
                <Icon name="redo" size={13} />
                Write {count} more
              </button>
            )}
          </div>

          {!hasOutput && (
            <div className={s.empty}>Pick a format and say what it&rsquo;s about.</div>
          )}

          {slots.map((slot, i) => (
            <article
              key={i}
              className={[s.draft, slot.state === "failed" ? s.failed : ""].filter(Boolean).join(" ")}
            >
              <div className={s.dtop}>
                <span className={s.dtag}>Draft {i + 1}</span>
                <span className={s.dlen}>
                  {slot.state === "done"
                    ? `${wordCount(slot.draft.body)} words`
                    : slot.state === "writing"
                      ? "writing…"
                      : "didn't finish"}
                </span>
                <div className={s.dacts}>
                  {slot.state === "done" ? (
                    <>
                      <button type="button" className={s.act} onClick={() => copy(slot.draft.body, i)}>
                        <Icon name="copy" size={13} />
                        {copied === i ? "Copied" : "Copy"}
                      </button>
                      <button
                        type="button"
                        className={s.act}
                        disabled={generating}
                        onClick={() => generate(1)}
                      >
                        <Icon name="redo" size={13} />
                        Again
                      </button>
                    </>
                  ) : slot.state === "failed" ? (
                    <button
                      type="button"
                      className={s.act}
                      disabled={generating}
                      onClick={() => generate(count)}
                    >
                      <Icon name="redo" size={13} />
                      Retry
                    </button>
                  ) : (
                    <button type="button" className={s.act} disabled>
                      <Icon name="copy" size={13} />
                      Copy
                    </button>
                  )}
                </div>
              </div>

              {slot.state === "done" && <div className={s.body}>{slot.draft.body}</div>}

              {slot.state === "writing" && (
                <>
                  <span className={s.sk} style={{ height: 15, width: "72%" }} />
                  <span className={s.sk} style={{ height: 15, width: "94%", marginTop: 9 }} />
                  <span className={s.sk} style={{ height: 15, width: "56%", marginTop: 9 }} />
                </>
              )}

              {slot.state === "failed" && <div className={s.body}>{slot.reason}</div>}

              <div className={s.dfoot}>
                {slot.state === "writing" && (
                  <span className={`${s.chipsrc} ${s.warn}`}>
                    Checking every claim against your product records…
                  </span>
                )}
                {slot.state === "done" && (
                  <>
                    {tone ? (
                      <span className={s.chipsrc}>Tone: {tone}</span>
                    ) : (
                      <span className={`${s.chipsrc} ${s.warn}`}>
                        No tone of voice yet, using plain, neutral copy.{" "}
                        <Link href="/brand/tone-of-voice">Set one →</Link>
                      </span>
                    )}
                    {slot.draft.provenance.map((p, j) => (
                      <span key={j} className={s.chipsrc}>
                        Fact: {p.claim}, from {p.source}
                      </span>
                    ))}
                    {isThinBrief(brief) && (
                      <span className={`${s.chipsrc} ${s.warn}`}>A fuller brief gets better copy.</span>
                    )}
                    {missing && <span className={`${s.chipsrc} ${s.warn}`}>{missing}</span>}
                  </>
                )}
              </div>
            </article>
          ))}
        </main>
      </div>
    </div>
  );
}
