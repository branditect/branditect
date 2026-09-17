"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useBrand } from "@/lib/useBrand";
import { supabase } from "@/lib/supabase";
import { authedFetch } from "@/lib/authed-fetch";
import { useT } from "@/lib/i18n/use-t.tsx";
import type { StringKey } from "@/lib/i18n/index.ts";
// The strategy document's stylesheet, used as-is. Tone of voice is the same
// document in a different chapter, and a second copy of these rules is how
// two pages that should look identical stop looking identical.
import s from "@/components/strategy/strategy.module.css";
import { I, Ico } from "@/components/strategy/icons";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Pillar {
  icon: string;
  name: string;
  desc: string;
  bullets: string[];
}

interface Touchpoint {
  icon: string;
  name: string;
  badge: string;
  bad: string;
  good: string;
}

interface ToneData {
  id?: string;
  brand_id: string;
  setup_complete: boolean;
  expression_label: string;
  expression_text: string;
  pillars: Pillar[];
  dos: string[];
  donts: string[];
  vocab_yes: string[];
  vocab_no: string[];
  touchpoints: Touchpoint[];
  checklist?: string[];
}

type EditingSection =
  | null
  | "expression"
  | "pillars"
  | "dos"
  | "donts"
  | "vocab"
  | "touchpoints"
  | "checklist";

/** The edit modal's title per section. The section ids stay the identity. */
const EDIT_TITLE: Record<Exclude<EditingSection, null>, StringKey> = {
  expression: "tone.sec.expression",
  pillars: "tone.sec.pillars",
  dos: "tone.sec.dos",
  donts: "tone.sec.donts",
  vocab: "tone.sec.vocab",
  touchpoints: "tone.sec.touchpoints",
  checklist: "tone.sec.checklist",
};

/* Stored with the brand's tone as data, so it stays English: it is the
   brand's checklist once saved, not interface copy. */
const DEFAULT_CHECKLIST = [
  "Does it sound like us?",
  "Would we say this out loud?",
  "Is it clear without jargon?",
  "Does it match our pillar guidelines?",
  "Would our audience feel spoken to, not at?",
  "Is the message concise and purposeful?",
];

/** The five parts that hold content. The checklist has a default and is not one. */
const TONE_PARTS = 5;

const EMPTY_TONE: ToneData = {
  brand_id: "default",
  setup_complete: true,
  expression_label: "",
  expression_text: "",
  pillars: [],
  dos: [],
  donts: [],
  vocab_yes: [],
  vocab_no: [],
  touchpoints: [],
  checklist: DEFAULT_CHECKLIST,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ToneOfVoicePage() {
  const t = useT();
  const { brandId, brandName, loading: brandLoading } = useBrand();
  const [loading, setLoading] = useState(true);
  const [toneData, setToneData] = useState<ToneData | null>(null);
  const [showEntry, setShowEntry] = useState(false);
  const [editing, setEditing] = useState<EditingSection>(null);
  const [saving, setSaving] = useState(false);

  // Entry modal sub-state
  const [entryMode, setEntryMode] = useState<"menu" | "paste">("menu");
  const [pastedText, setPastedText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState("");

  // Edit form drafts
  const [draft, setDraft] = useState<Partial<ToneData>>({});

  // Checked items for checklist (client-only visual)
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  /* ---------------------------------------------------------------- */
  /*  Fetch on mount                                                   */
  /* ---------------------------------------------------------------- */

  const fetchTone = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authedFetch(`/api/tone?brand_id=${brandId}`);
      const json = await res.json();
      if (json.tone && json.tone.setup_complete) {
        setToneData(json.tone as ToneData);
        setShowEntry(false);
      } else {
        setShowEntry(true);
      }
    } catch {
      setShowEntry(true);
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    if (!brandLoading && brandId !== "default") fetchTone();
  }, [fetchTone, brandLoading, brandId]);

  /* ---------------------------------------------------------------- */
  /*  Save helper                                                      */
  /* ---------------------------------------------------------------- */

  const saveTone = async (fields: Partial<ToneData>) => {
    setSaving(true);
    try {
      // Destructure out brand_id so it can't override the correct brandId from useBrand
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { brand_id: _ignored, ...safeFields } = fields as ToneData;
      const res = await authedFetch("/api/tone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brandId, ...safeFields }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Save failed" }));
        console.error("Tone save failed:", err);
      }
      setToneData((prev) => (prev ? { ...prev, ...fields } : { ...EMPTY_TONE, ...fields }));
    } catch (err) {
      console.error("Tone save error:", err);
    } finally {
      setSaving(false);
      setEditing(null);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Entry: Generate from paste                                       */
  /* ---------------------------------------------------------------- */

  const handleGenerate = async () => {
    if (!pastedText.trim()) return;
    setGenerating(true);
    setGenProgress(t("tone.progress.analysing"));
    try {
      const res = await fetch("/api/tone/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pastedText }),
      });

      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalTone: Partial<ToneData> | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.chunk) {
              setGenProgress(t("tone.progress.generating"));
            }
            if (payload.done && payload.tone) {
              finalTone = payload.tone;
            }
            if (payload.done && payload.error) {
              throw new Error(payload.error);
            }
          } catch (e) {
            // Re-throw real errors, ignore JSON parse errors from partial chunks
            if (e instanceof Error && e.message && !e.message.includes("JSON")) throw e;
          }
        }
      }

      if (finalTone) {
        const full = {
          ...EMPTY_TONE,
          ...finalTone,
          setup_complete: true,
          checklist: DEFAULT_CHECKLIST,
        };
        await saveTone(full);
        setToneData(full);
        setShowEntry(false);
      }
    } catch {
      setGenProgress(t("tone.progress.failed"));
    } finally {
      setGenerating(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Entry: Build manually                                            */
  /* ---------------------------------------------------------------- */

  const handleBuildManually = async () => {
    await saveTone(EMPTY_TONE);
    setToneData({ ...EMPTY_TONE });
    setShowEntry(false);
  };

  /* ---------------------------------------------------------------- */
  /*  Entry: Pull from saved brand strategy                            */
  /* ---------------------------------------------------------------- */

  const handlePullFromStrategy = async () => {
    if (!brandId) return;
    setGenerating(true);
    setGenProgress(t("tone.progress.loadingStrategy"));
    try {
      const { data, error } = await supabase
        .from("brand_strategies")
        .select("generated_strategy")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        setGenProgress(t("tone.progress.noStrategy"));
        return;
      }

      let strategy: Record<string, unknown>;
      try {
        strategy = JSON.parse(data[0].generated_strategy);
      } catch {
        setGenProgress(t("tone.progress.oldFormat"));
        return;
      }

      type Pair = { do?: string; dont?: string };
      type StrategyPillar = { title?: string; text?: string };

      // The strategy now writes the document model, so these keys moved:
      //   messagingPillars → pillars ({title,text} → {title,body})
      //   archetype        → pyramid.essence
      //   voiceDescription → pyramid.benefits
      //   alwaysUse/neverUse → boundaries.wordsUsed/wordsAvoided
      // Both spellings are read so a strategy generated before the change still
      // fills this screen instead of silently producing an empty tone.
      const pyramid = (strategy.pyramid ?? {}) as Record<string, unknown>;
      const boundaries = (strategy.boundaries ?? {}) as Record<string, unknown>;
      const rawPillars = (strategy.pillars ?? strategy.messagingPillars ?? []) as StrategyPillar[];

      const pillars: Pillar[] = (rawPillars || []).map((p) => ({
        icon: "◆",
        name: p.title || "",
        desc: (p as { body?: string; text?: string }).body || p.text || "",
        bullets: ["", "", ""],
      }));

      // voiceDoDont has no home in the document model on purpose: do/don't pairs
      // belong to Tone of Voice and are generated by its own route. An empty
      // array here means "not set yet", not "lost".
      // voice is a real field on the strategy now, fed by "How would you
      // describe the way you write?". The legacy voiceDoDont is still read so a
      // strategy generated before that question existed keeps working.
      const voice = (strategy.voice ?? {}) as { description?: string; doSay?: string[]; dontSay?: string[] };
      const voiceDoDont = (strategy.voiceDoDont as Pair[]) || [];

      const tone: ToneData = {
        ...EMPTY_TONE,
        brand_id: brandId,
        setup_complete: true,
        expression_label: (pyramid.essence as string) || (strategy.archetype as string) || "",
        expression_text: voice.description || (pyramid.benefits as string) || (strategy.voiceDescription as string) || "",
        pillars,
        dos: voice.doSay?.length ? voice.doSay : voiceDoDont.map((p) => p.do || "").filter(Boolean),
        donts: voice.dontSay?.length ? voice.dontSay : voiceDoDont.map((p) => p.dont || "").filter(Boolean),
        vocab_yes: ((boundaries.wordsUsed ?? strategy.alwaysUse) as string[]) || [],
        vocab_no: ((boundaries.wordsAvoided ?? strategy.neverUse) as string[]) || [],
        touchpoints: [],
        checklist: DEFAULT_CHECKLIST,
      };

      setGenProgress(t("tone.progress.pulling"));
      await saveTone(tone);
      setToneData(tone);
      setShowEntry(false);
    } catch (e) {
      console.error("Pull-from-strategy failed:", e);
      setGenProgress(t("tone.progress.pullFailed"));
    } finally {
      setGenerating(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Open edit modal                                                  */
  /* ---------------------------------------------------------------- */

  const openEdit = (section: EditingSection) => {
    if (!toneData) return;
    switch (section) {
      case "expression":
        setDraft({ expression_label: toneData.expression_label, expression_text: toneData.expression_text });
        break;
      case "pillars":
        setDraft({ pillars: toneData.pillars?.length ? JSON.parse(JSON.stringify(toneData.pillars)) : [{ icon: "", name: "", desc: "", bullets: ["", "", ""] }] });
        break;
      case "dos":
        setDraft({ dos: [...(toneData.dos || [])] });
        break;
      case "donts":
        setDraft({ donts: [...(toneData.donts || [])] });
        break;
      case "vocab":
        setDraft({ vocab_yes: [...(toneData.vocab_yes || [])], vocab_no: [...(toneData.vocab_no || [])] });
        break;
      case "touchpoints":
        setDraft({ touchpoints: toneData.touchpoints?.length ? JSON.parse(JSON.stringify(toneData.touchpoints)) : [{ icon: "", name: "", badge: "", bad: "", good: "" }] });
        break;
      case "checklist":
        setDraft({ checklist: [...(toneData.checklist || DEFAULT_CHECKLIST)] });
        break;
    }
    setEditing(section);
  };

  /* ---------------------------------------------------------------- */
  /*  Render helpers                                                   */
  /* ---------------------------------------------------------------- */

  /* ---------------------------------------------------------------- */
  /*  LOADING                                                          */
  /* ---------------------------------------------------------------- */

  if (loading || brandLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  ENTRY MODAL                                                      */
  /* ---------------------------------------------------------------- */

  if (showEntry) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4">
          {entryMode === "menu" ? (
            <>
              <h2 className="font-semibold text-2xl text-on-surface mb-2">
                {t("tone.setUp")}
              </h2>
              <p className="text-outline text-sm mb-6">
                {t("tone.chooseHow")}
              </p>

              <div className="flex flex-col gap-3">
                {/* Option A */}
                <button
                  onClick={() => setEntryMode("paste")}
                  className="flex items-start gap-4 text-left border border-outline-variant/15 rounded-xl p-4 hover:border-primary hover:bg-primary-fixed/30 transition-colors"
                >
                  <span className="text-primary text-sm font-bold mt-0.5">*</span>
                  <div>
                    <p className="font-headline font-bold text-on-surface text-sm">{t("tone.pasteSamples")}</p>
                    <p className="text-outline text-xs mt-0.5">
                      {t("tone.pasteSamplesHelp")}
                    </p>
                  </div>
                </button>

                {/* Option B */}
                <button
                  onClick={handlePullFromStrategy}
                  disabled={generating}
                  className="flex items-start gap-4 text-left border border-outline-variant/15 rounded-xl p-4 hover:border-primary hover:bg-primary-fixed/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="text-primary text-xl mt-0.5">◇</span>
                  <div>
                    <p className="font-headline font-bold text-on-surface text-sm">{t("tone.fromStrategy")}</p>
                    <p className="text-outline text-xs mt-0.5">
                      {t("tone.fromStrategyHelp")}
                    </p>
                  </div>
                </button>
                {entryMode === "menu" && genProgress && (
                  <p className="text-xs text-primary font-mono mt-1">{genProgress}</p>
                )}

                {/* Option C */}
                <button
                  onClick={handleBuildManually}
                  className="flex items-start gap-4 text-left border border-outline-variant/15 rounded-xl p-4 hover:border-primary hover:bg-primary-fixed/30 transition-colors"
                >
                  <span className="text-primary text-xl mt-0.5">☰</span>
                  <div>
                    <p className="font-headline font-bold text-on-surface text-sm">{t("tone.manual")}</p>
                    <p className="text-outline text-xs mt-0.5">
                      {t("tone.manualHelp")}
                    </p>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setEntryMode("menu")}
                className="text-outline text-xs font-mono mb-4 hover:text-on-surface transition-colors"
              >
                {t("onboarding.back")}
              </button>
              <h2 className="font-semibold text-2xl text-on-surface mb-2">
                {t("tone.pasteSamples")}
              </h2>
              <p className="text-outline text-sm mb-4">
                {t("tone.pasteSamplesIntro")}
              </p>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={8}
                placeholder={t("tone.pastePlaceholder")}
                className="w-full border border-outline-variant/15 rounded-xl p-4 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
              />
              {genProgress && (
                <p className="text-xs text-primary font-mono mt-2">{genProgress}</p>
              )}
              <button
                onClick={handleGenerate}
                disabled={generating || !pastedText.trim()}
                className="mt-4 w-full bg-primary text-white font-headline font-bold shadow-lg shadow-primary/20 text-sm py-3 rounded-xl hover:brightness-110 disabled:opacity-50 transition-colors"
              >
                {generating ? t("tone.generatingEllipsis") : t("tone.generateTone")}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  MAIN PAGE                                                        */
  /* ---------------------------------------------------------------- */

  const td = toneData || EMPTY_TONE;
  const pillars: Pillar[] = td.pillars || [];
  const dos: string[] = td.dos || [];
  const donts: string[] = td.donts || [];
  const vocabYes: string[] = td.vocab_yes || [];
  const vocabNo: string[] = td.vocab_no || [];
  const touchpoints: Touchpoint[] = td.touchpoints || [];
  const checklist: string[] = td.checklist || DEFAULT_CHECKLIST;

  // The same thing the strategy's chip says: how much of this document
  // exists. Five parts, not six — the checklist ships with a default, so
  // counting it would report a page as written that has nothing in it.
  const definedCount = [
    td.expression_label || td.expression_text,
    pillars.length,
    dos.length || donts.length,
    vocabYes.length || vocabNo.length,
    touchpoints.length,
  ].filter(Boolean).length;

  return (
    <>
      {/* The page reads as the same document as Brand ▸ Strategy: the same
          header, the same numbered sections with a why-line under the title,
          the same panels, and the expression on the same orange card that
          carries Brand core. It renders from the strategy's own stylesheet so
          the two cannot drift — one file, both documents. */}
      <div className={s.wrap}>
        <header className={s.top}>
          <div>
            <div className={s.topTitle}>{t("tone.title")}</div>
            <div className={s.metarow}>
              <span className={s.chip}><Ico d={I.brain} size={12} /> {brandName}</span>
              <span className={s.chip}><Ico d={I.check} size={12} /> {t("tone.definedCount", { filled: definedCount, total: TONE_PARTS })}</span>
            </div>
          </div>
          <div className={s.hbtns}>
            <Link href="/brand/strategy" className={`${s.hbtn} ${s.ghost}`}>
              <Ico d={I.arr} size={15} /> {t("tone.seeStrategy")}
            </Link>
          </div>
        </header>

        {/* 01 — the expression. The orange card, for the same reason Brand core
            is: it is the thing itself, and everything below is how to do it. */}
        <section className={s.sec}>
          <div className={s.sechead}>
            <span className={s.secno}>01</span>
            <h2>{t("tone.sec.expression")}</h2>
            <span className={s.why}>{t("tone.why.expression")}</span>
            <button type="button" className={s.edit} onClick={() => openEdit("expression")}>
              <Ico d={I.pen} size={13} /> {t("common.edit")}
            </button>
          </div>
          <div className={`${s.panel} ${s.core} ${s.expr}`}>
            <h3
              contentEditable
              suppressContentEditableWarning
              onBlur={e => {
                const val = e.currentTarget.textContent || '';
                if (val !== td.expression_label) saveTone({ ...toneData!, expression_label: val });
              }}
            >
              {td.expression_label || t("tone.expressionPlaceholder")}
            </h3>
            <p
              contentEditable
              suppressContentEditableWarning
              onBlur={e => {
                const val = e.currentTarget.textContent || '';
                if (val !== td.expression_text) saveTone({ ...toneData!, expression_text: val });
              }}
            >
              {td.expression_text || t("tone.expressionTextPlaceholder")}
            </p>
          </div>
        </section>

        {/* 02 — the pillars, as the strategy's pillar cards. */}
        <section className={s.sec}>
          <div className={s.sechead}>
            <span className={s.secno}>02</span>
            <h2>{t("tone.sec.pillars")}</h2>
            <span className={s.why}>{t("tone.why.pillars")}</span>
            <button type="button" className={s.edit} onClick={() => openEdit("pillars")}>
              <Ico d={I.pen} size={13} /> {t("common.edit")}
            </button>
          </div>
          {pillars.length > 0 ? (
            <div className={s.grid3}>
              {pillars.map((p, i) => (
                <div key={i} className={`${s.panel} ${s.pil}`}>
                  <span className={s.pico}><Ico d={I.spark} size={19} /></span>
                  <div
                    className={s.t}
                    contentEditable suppressContentEditableWarning
                    onBlur={e => {
                      const newPillars = [...pillars]; newPillars[i] = { ...newPillars[i], name: e.currentTarget.textContent || '' };
                      saveTone({ ...toneData!, pillars: newPillars });
                    }}
                  >{p.name}</div>
                  <div
                    className={s.v}
                    contentEditable suppressContentEditableWarning
                    onBlur={e => {
                      const newPillars = [...pillars]; newPillars[i] = { ...newPillars[i], desc: e.currentTarget.textContent || '' };
                      saveTone({ ...toneData!, pillars: newPillars });
                    }}
                  >{p.desc}</div>
                  {p.bullets?.length > 0 && (
                    <ul className={s.pbul}>
                      {p.bullets.map((b, j) => (
                        <li key={j}>
                          <span>&#x2022;</span>
                          <span
                            contentEditable suppressContentEditableWarning
                            onBlur={e => {
                              const newPillars = [...pillars]; const newBullets = [...newPillars[i].bullets]; newBullets[j] = e.currentTarget.textContent || '';
                              newPillars[i] = { ...newPillars[i], bullets: newBullets };
                              saveTone({ ...toneData!, pillars: newPillars });
                            }}
                          >{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={`${s.panel} ${s.empty}`}>
              <div className={s.t}>{t("tone.sec.pillars")}</div>
              <div className={s.v}>{t("tone.noPillars")}</div>
            </div>
          )}
        </section>

        {/* 03 — do and don't, in the boundaries columns. */}
        <section className={s.sec}>
          <div className={s.sechead}>
            <span className={s.secno}>03</span>
            <h2>{t("tone.doAndDont")}</h2>
            <span className={s.why}>{t("tone.why.doAndDont")}</span>
            <button type="button" className={s.edit} onClick={() => openEdit("dos")}>
              <Ico d={I.pen} size={13} /> {t("common.edit")}
            </button>
          </div>
          <div className={`${s.panel} ${s.bnd} ${s.grid2}`}>
            <div className={`${s.bcol} ${s.bcolYes}`}>
              <div className={s.k}><Ico d={I.check} size={14} /> {t("tone.do")}
                <button type="button" className={s.colEdit} onClick={() => openEdit("dos")}>
                  <Ico d={I.pen} size={12} /> {t("common.edit")}
                </button>
              </div>
              {dos.length > 0 ? (
                <ul>{dos.map((d, i) => (<li key={i}><span>&#10003;</span>{d}</li>))}</ul>
              ) : (
                <ul><li><span>—</span>{t("tone.noItems")}</li></ul>
              )}
            </div>
            <div className={`${s.bcol} ${s.bcolNo}`}>
              <div className={s.k}><Ico d={I.x} size={14} /> {t("tone.dont")}
                <button type="button" className={s.colEdit} onClick={() => openEdit("donts")}>
                  <Ico d={I.pen} size={12} /> {t("common.edit")}
                </button>
              </div>
              {donts.length > 0 ? (
                <ul>{donts.map((d, i) => (<li key={i}><span>&#10007;</span>{d}</li>))}</ul>
              ) : (
                <ul><li><span>—</span>{t("tone.noItems")}</li></ul>
              )}
            </div>
          </div>
        </section>

        {/* 04 — the words, as the strategy's word chips: struck through is the
            fastest way to read "never this". */}
        <section className={s.sec}>
          <div className={s.sechead}>
            <span className={s.secno}>04</span>
            <h2>{t("tone.sec.vocab")}</h2>
            <span className={s.why}>{t("tone.why.vocab")}</span>
            <button type="button" className={s.edit} onClick={() => openEdit("vocab")}>
              <Ico d={I.pen} size={13} /> {t("common.edit")}
            </button>
          </div>
          <div className={s.panel}>
            <div className={s.vocabk}>{t("tone.alwaysUse")}</div>
            {vocabYes.length > 0 ? (
              <div className={s.words}>{vocabYes.map((w, i) => (<span key={i} className={`${s.w} ${s.wOk}`}>{w}</span>))}</div>
            ) : <p className={s.none}>{t("tone.noWords")}</p>}
            <div className={`${s.vocabk} ${s.vocabkNo}`}>{t("tone.neverUse")}</div>
            {vocabNo.length > 0 ? (
              <div className={s.words}>{vocabNo.map((w, i) => (<span key={i} className={`${s.w} ${s.wNo}`}>{w}</span>))}</div>
            ) : <p className={s.none}>{t("tone.noWords")}</p>}
          </div>
        </section>

        {/* 05 — the same line in each channel, wrong beside right. */}
        <section className={s.sec}>
          <div className={s.sechead}>
            <span className={s.secno}>05</span>
            <h2>{t("tone.sec.touchpoints")}</h2>
            <span className={s.why}>{t("tone.why.touchpoints")}</span>
            <button type="button" className={s.edit} onClick={() => openEdit("touchpoints")}>
              <Ico d={I.pen} size={13} /> {t("common.edit")}
            </button>
          </div>
          {touchpoints.length > 0 ? (
            <div className={s.grid2}>
              {touchpoints.map((tp, i) => (
                <div key={i} className={`${s.panel} ${s.tp}`}>
                  <div className={s.tphead}>
                    <span className={s.tpico}><Ico d={I.chat} size={15} /></span>
                    <span className={s.tpname}>{tp.name}</span>
                    {tp.badge && <span className={s.tpbadge}>{tp.badge}</span>}
                  </div>
                  <div className={s.tprow}>
                    <div className={s.tpNo}>
                      <div className={s.k}>{t("tone.wrong")}</div>
                      <p>{tp.bad}</p>
                    </div>
                    <div className={s.tpYes}>
                      <div className={s.k}>{t("tone.right")}</div>
                      <p>{tp.good}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`${s.panel} ${s.empty}`}>
              <div className={s.t}>{t("tone.sec.touchpoints")}</div>
              <div className={s.v}>{t("tone.noTouchpoints")}</div>
            </div>
          )}
        </section>

        {/* 06 — the checklist, ticked in the browser and never stored: it is a
            question to ask before sending, not a record of anything. */}
        <section className={s.sec}>
          <div className={s.sechead}>
            <span className={s.secno}>06</span>
            <h2>{t("tone.sec.checklist")}</h2>
            <span className={s.why}>{t("tone.why.checklist")}</span>
            <button type="button" className={s.edit} onClick={() => openEdit("checklist")}>
              <Ico d={I.pen} size={13} /> {t("common.edit")}
            </button>
          </div>
          <div className={s.panel}>
            {checklist.map((item, i) => (
              <label key={i} className={s.check}>
                <input
                  type="checkbox"
                  checked={!!checked[i]}
                  onChange={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                />
                <span className={checked[i] ? s.checkDone : undefined}>{item}</span>
              </label>
            ))}
          </div>
        </section>
      </div>

      {/* ---- EDIT MODALS ---- */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto">
            <h2 className="font-semibold text-xl text-on-surface mb-5">
              {t("tone.editTitle", { section: t(EDIT_TITLE[editing]) })}
            </h2>

            {/* ---- Expression ---- */}
            {editing === "expression" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-outline block mb-1">{t("tone.expressionLabel")}</label>
                  <input
                    type="text"
                    value={draft.expression_label || ""}
                    onChange={(e) => setDraft((d) => ({ ...d, expression_label: e.target.value }))}
                    placeholder={t("tone.exampleName")}
                    className="w-full border border-outline-variant/15 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-outline block mb-1">{t("tone.expressionText")}</label>
                  <textarea
                    value={draft.expression_text || ""}
                    onChange={(e) => setDraft((d) => ({ ...d, expression_text: e.target.value }))}
                    rows={4}
                    placeholder={t("tone.describeSound")}
                    className="w-full border border-outline-variant/15 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
                  />
                </div>
              </div>
            )}

            {/* ---- Pillars ---- */}
            {editing === "pillars" && (
              <div className="space-y-6">
                {(draft.pillars || []).map((p, i) => (
                  <div key={i} className="border border-outline-variant/15 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => {
                          const arr = [...(draft.pillars || [])];
                          arr[i] = { ...arr[i], name: e.target.value };
                          setDraft((d) => ({ ...d, pillars: arr }));
                        }}
                        placeholder={t("tone.pillarName")}
                        className="flex-1 border border-outline-variant/15 rounded-lg px-3 py-1 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                      />
                      <button
                        onClick={() => {
                          const arr = (draft.pillars || []).filter((_, j) => j !== i);
                          setDraft((d) => ({ ...d, pillars: arr }));
                        }}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        &#10005;
                      </button>
                    </div>
                    <input
                      type="text"
                      value={p.desc}
                      onChange={(e) => {
                        const arr = [...(draft.pillars || [])];
                        arr[i] = { ...arr[i], desc: e.target.value };
                        setDraft((d) => ({ ...d, pillars: arr }));
                      }}
                      placeholder={t("common.description")}
                      className="w-full border border-outline-variant/15 rounded-lg px-3 py-1 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                    />
                    <div className="space-y-1">
                      <label className="text-xs font-mono text-outline">{t("tone.bullets")}</label>
                      <textarea
                        value={(p.bullets || []).join("\n")}
                        onChange={(e) => {
                          const arr = [...(draft.pillars || [])];
                          arr[i] = { ...arr[i], bullets: e.target.value.split("\n") };
                          setDraft((d) => ({ ...d, pillars: arr }));
                        }}
                        rows={3}
                        className="w-full border border-outline-variant/15 rounded-lg px-3 py-1 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setDraft((d) => ({ ...d, pillars: [...(d.pillars || []), { icon: "", name: "", desc: "", bullets: [""] }] }))}
                  className="text-primary text-xs font-mono hover:underline"
                >
                  {t("tone.addPillar")}
                </button>
              </div>
            )}

            {/* ---- Dos ---- */}
            {editing === "dos" && (
              <div className="space-y-3">
                <label className="text-xs font-mono text-outline">{t("common.onePerLine")}</label>
                <textarea
                  value={(draft.dos || []).join("\n")}
                  onChange={(e) => setDraft((d) => ({ ...d, dos: e.target.value.split("\n") }))}
                  rows={8}
                  placeholder={t("tone.dosPlaceholder")}
                  className="w-full border border-outline-variant/15 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
                />
              </div>
            )}

            {/* ---- Donts ---- */}
            {editing === "donts" && (
              <div className="space-y-3">
                <label className="text-xs font-mono text-outline">{t("common.onePerLine")}</label>
                <textarea
                  value={(draft.donts || []).join("\n")}
                  onChange={(e) => setDraft((d) => ({ ...d, donts: e.target.value.split("\n") }))}
                  rows={8}
                  placeholder={t("tone.dontsPlaceholder")}
                  className="w-full border border-outline-variant/15 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
                />
              </div>
            )}

            {/* ---- Vocab ---- */}
            {editing === "vocab" && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-mono text-green-700 block mb-1">{t("tone.alwaysUseField")}</label>
                  <textarea
                    value={(draft.vocab_yes || []).join(", ")}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        vocab_yes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      }))
                    }
                    rows={3}
                    placeholder={t("tone.alwaysExample")}
                    className="w-full border border-outline-variant/15 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-red-600 block mb-1">{t("tone.neverUseField")}</label>
                  <textarea
                    value={(draft.vocab_no || []).join(", ")}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        vocab_no: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      }))
                    }
                    rows={3}
                    placeholder={t("tone.neverExample")}
                    className="w-full border border-outline-variant/15 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
                  />
                </div>
              </div>
            )}

            {/* ---- Touchpoints ---- */}
            {editing === "touchpoints" && (
              <div className="space-y-6">
                {(draft.touchpoints || []).map((tp, i) => (
                  <div key={i} className="border border-outline-variant/15 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tp.name}
                        onChange={(e) => {
                          const arr = [...(draft.touchpoints || [])];
                          arr[i] = { ...arr[i], name: e.target.value };
                          setDraft((d) => ({ ...d, touchpoints: arr }));
                        }}
                        placeholder={t("tone.channelName")}
                        className="flex-1 border border-outline-variant/15 rounded-lg px-3 py-1 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                      />
                      <input
                        type="text"
                        value={tp.badge}
                        onChange={(e) => {
                          const arr = [...(draft.touchpoints || [])];
                          arr[i] = { ...arr[i], badge: e.target.value };
                          setDraft((d) => ({ ...d, touchpoints: arr }));
                        }}
                        placeholder={t("tone.badge")}
                        className="w-24 border border-outline-variant/15 rounded-lg px-2 py-1 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                      />
                      <button
                        onClick={() => {
                          const arr = (draft.touchpoints || []).filter((_, j) => j !== i);
                          setDraft((d) => ({ ...d, touchpoints: arr }));
                        }}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        &#10005;
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-mono text-red-500 block mb-1">{t("tone.wrongExample")}</label>
                        <textarea
                          value={tp.bad}
                          onChange={(e) => {
                            const arr = [...(draft.touchpoints || [])];
                            arr[i] = { ...arr[i], bad: e.target.value };
                            setDraft((d) => ({ ...d, touchpoints: arr }));
                          }}
                          rows={2}
                          className="w-full border border-outline-variant/15 rounded-lg px-2 py-1 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-mono text-green-600 block mb-1">{t("tone.rightExample")}</label>
                        <textarea
                          value={tp.good}
                          onChange={(e) => {
                            const arr = [...(draft.touchpoints || [])];
                            arr[i] = { ...arr[i], good: e.target.value };
                            setDraft((d) => ({ ...d, touchpoints: arr }));
                          }}
                          rows={2}
                          className="w-full border border-outline-variant/15 rounded-lg px-2 py-1 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      touchpoints: [...(d.touchpoints || []), { icon: "", name: "", badge: "", bad: "", good: "" }],
                    }))
                  }
                  className="text-primary text-xs font-mono hover:underline"
                >
                  {t("tone.addTouchpoint")}
                </button>
              </div>
            )}

            {/* ---- Checklist ---- */}
            {editing === "checklist" && (
              <div className="space-y-3">
                <label className="text-xs font-mono text-outline">{t("tone.oneItemPerLine")}</label>
                <textarea
                  value={(draft.checklist || []).join("\n")}
                  onChange={(e) => setDraft((d) => ({ ...d, checklist: e.target.value.split("\n") }))}
                  rows={8}
                  placeholder={t("tone.checklistPlaceholder")}
                  className="w-full border border-outline-variant/15 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
                />
              </div>
            )}

            {/* ---- Modal footer ---- */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-light">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm text-outline hover:text-on-surface transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => {
                  // Clean up empty strings from arrays before saving
                  const cleaned: Partial<ToneData> = { ...draft };
                  if (cleaned.dos) cleaned.dos = cleaned.dos.filter((s) => s.trim());
                  if (cleaned.donts) cleaned.donts = cleaned.donts.filter((s) => s.trim());
                  if (cleaned.checklist) cleaned.checklist = cleaned.checklist.filter((s) => s.trim());
                  if (cleaned.pillars) {
                    cleaned.pillars = cleaned.pillars.map((p) => ({
                      ...p,
                      bullets: p.bullets.filter((b) => b.trim()),
                    }));
                  }
                  saveTone(cleaned);
                }}
                disabled={saving}
                className="px-5 py-2 bg-brand-orange text-white text-sm font-semibold rounded-xl hover:brightness-110 disabled:opacity-50 transition-colors"
              >
                {saving ? t("import.saving") : t("settings.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
