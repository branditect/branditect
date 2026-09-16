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
import { authedFetch } from "@/lib/authed-fetch";
import { useT } from "@/lib/i18n/use-t.tsx";
import type { StringKey } from "@/lib/i18n/index.ts";

interface Product {
  id: string;
  name: string;
}

/** A draft in flight, with whatever it already knows about itself. */
type Slot =
  | { state: "writing" }
  | { state: "done"; draft: Draft }
  | { state: "failed"; reason: string };

const LENGTHS: { id: Length; label: StringKey }[] = [
  { id: "short", label: "wr.short" },
  { id: "medium", label: "wr.medium" },
  { id: "long", label: "wr.long" },
];

export default function WritePage() {
  const t = useT();
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
    authedFetch(`/api/catalog?brand_id=${encodeURIComponent(brandId)}`)
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
        [format === "other" ? formatOther.trim() : t(def.labelKey), productName].filter(Boolean).join(" · ")
      );

      try {
        const res = await authedFetch("/api/copy-architect", {
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
          const reason = typeof data?.error === "string" ? data.error : t("ci.didntWork");
          // The brief is never lost on a failure.
          setSlots(Array.from({ length: howMany }, () => ({ state: "failed", reason }) as Slot));
          return;
        }

        const returned: Draft[] = Array.isArray(data.drafts) ? data.drafts : [];
        setTone(typeof data.tone === "string" ? data.tone : null);
        setMissing(typeof data.missing === "string" ? data.missing : "");
        setSlots(returned.map((draft) => ({ state: "done", draft }) as Slot));
      } catch (err) {
        const reason = err instanceof Error ? err.message : t("ci.didntWork");
        setSlots(Array.from({ length: howMany }, () => ({ state: "failed", reason }) as Slot));
      } finally {
        setGenerating(false);
      }
    },
    [brandId, brief, canWrite, def.labelKey, format, formatOther, generating, length, productId, productName, t]
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
          <div className={s.kick}>{t("nav.studio")}</div>
          <h1>{t("nav.studio.write")}</h1>
          <p className={s.sub}>{t("wr.lede")}</p>
        </div>
      </div>

      <div className={s.cols}>
        {/* ═══════════ BRIEF ═══════════ */}
        <aside className={s.brief}>
          <div className={s.step}>
            <span className={s.n}>1</span>
            <h3>{t("wr.whatAreWeWriting")}</h3>
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
                <span className={s.t}>{t(f.labelKey)}</span>
              </button>
            ))}
          </div>

          {format === "other" && (
            <input
              ref={otherRef}
              className={s.otherInput}
              value={formatOther}
              onChange={(e) => setFormatOther(e.target.value)}
              placeholder={t("wr.whatPlaceholder")}
              aria-label={t("wr.whatAreWeWriting")}
            />
          )}

          <div className={`${s.step} ${s.stepTop}`}>
            <span className={s.n}>2</span>
            <h3>{t("wr.whatsItAbout")}</h3>
          </div>
          <textarea
            className={s.ta}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder={t("wr.aboutHelp")}
            aria-label={t("wr.whatsItAbout")}
          />
          <div className={s.egs}>
            {def.exampleKeys.map((k) => (
              <button key={k} type="button" className={s.eg} onClick={() => setBrief(t(k))}>
                {t(k)}
              </button>
            ))}
          </div>
          <p className={s.eghint}>{t("wr.tapExample")}</p>

          <div className={`${s.step} ${s.stepTop}`}>
            <span className={s.n}>3</span>
            <h3>{t("wr.options")}</h3>
            <span className={s.opt}>{t("write.optional")}</span>
          </div>
          <div className={s.opts}>
            <div className={s.orow}>
              <span className={s.k}>{t("wr.aboutAProduct")}</span>
              <select
                className={s.sel}
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                aria-label={t("wr.aboutAProduct")}
              >
                <option value="">{t("wr.noParticularProduct")}</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={s.orow}>
              <span className={s.k}>{t("common.length")}</span>
              <div className={s.seg} role="group" aria-label={t("common.length")}>
                {LENGTHS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className={length === l.id ? s.on : undefined}
                    aria-pressed={length === l.id}
                    onClick={() => setLength(l.id)}
                  >
                    {t(l.label)}
                  </button>
                ))}
              </div>
            </div>
            <div className={s.orow}>
              <span className={s.k}>{t("wr.drafts")}</span>
              <div className={s.seg} role="group" aria-label={t("wr.howManyDrafts")}>
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
            {generating ? t("wr.writing") : t("wr.writeIt")}
          </button>

          <div className={s.source}>
            <Icon name="book" size={14} />
            <div>
              {/* One sentence, with the sources in bold where the translator
                  put {sources}. Split, never assembled from pieces. */}
              {(() => {
                const [before, after = ""] = t("write.writesFrom").split("{sources}");
                return (
                  <>
                    {before}
                    <b>
                      {products.length === 1
                        ? t("write.sourcesOne")
                        : t("write.sourcesMany", { count: products.length })}
                    </b>
                    {after}
                  </>
                );
              })()}
            </div>
          </div>
        </aside>

        {/* ═══════════ DRAFTS ═══════════ */}
        <main>
          <div className={s.outhead}>
            <h2>{t("wr.drafts")}</h2>
            {ranAt && <span className={s.meta}>{[ranWith, ranAt].filter(Boolean).join(" · ")}</span>}
            {hasOutput && (
              <button
                type="button"
                className={s.re}
                disabled={generating || !canWrite}
                onClick={() => generate(count)}
              >
                <Icon name="redo" size={13} />
                {t("wr.writeMore", { count })}
              </button>
            )}
          </div>

          {!hasOutput && (
            <div className={s.empty}>{t("wr.pickFormat")}</div>
          )}

          {slots.map((slot, i) => (
            <article
              key={i}
              className={[s.draft, slot.state === "failed" ? s.failed : ""].filter(Boolean).join(" ")}
            >
              <div className={s.dtop}>
                <span className={s.dtag}>{t("write.draftN", { n: i + 1 })}</span>
                <span className={s.dlen}>
                  {slot.state === "done"
                    ? t("write.words", { count: wordCount(slot.draft.body) })
                    : slot.state === "writing"
                      ? t("write.writingLower")
                      : t("wr.didntFinish")}
                </span>
                <div className={s.dacts}>
                  {slot.state === "done" ? (
                    <>
                      <button type="button" className={s.act} onClick={() => copy(slot.draft.body, i)}>
                        <Icon name="copy" size={13} />
                        {copied === i ? t("wr.copied") : t("common.copy")}
                      </button>
                      <button
                        type="button"
                        className={s.act}
                        disabled={generating}
                        onClick={() => generate(1)}
                      >
                        <Icon name="redo" size={13} />
                        {t("common.again")}
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
                      {t("common.retry")}
                    </button>
                  ) : (
                    <button type="button" className={s.act} disabled>
                      <Icon name="copy" size={13} />
                      {t("common.copy")}
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
                    {t("wr.checkingClaims")}
                  </span>
                )}
                {slot.state === "done" && (
                  <>
                    {tone ? (
                      <span className={s.chipsrc}>{t("write.tone", { tone })}</span>
                    ) : (
                      <span className={`${s.chipsrc} ${s.warn}`}>
                        {t("wr.noTone")}{" "}
                        <Link href="/brand/tone-of-voice">{t("wr.setOne")}</Link>
                      </span>
                    )}
                    {slot.draft.provenance.map((p, j) => (
                      <span key={j} className={s.chipsrc}>
                        {t("wr.fact", { claim: p.claim, source: p.source })}
                      </span>
                    ))}
                    {isThinBrief(brief) && (
                      <span className={`${s.chipsrc} ${s.warn}`}>{t("write.thinBrief")}</span>
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
