"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useBrand } from "@/lib/useBrand";

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

const DEFAULT_CHECKLIST = [
  "Does it sound like us?",
  "Would we say this out loud?",
  "Is it clear without jargon?",
  "Does it match our pillar guidelines?",
  "Would our audience feel spoken to, not at?",
  "Is the message concise and purposeful?",
];

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
      const res = await fetch(`/api/tone?brand_id=${brandId}`);
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
      const res = await fetch("/api/tone", {
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
    setGenProgress("Analysing your writing samples...");
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
              setGenProgress("Generating tone guidelines...");
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
      setGenProgress("Generation failed. Please try again.");
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

  const placeholder = (text: string) => (
    <span className="text-outline italic text-sm">{text}</span>
  );

  const editBtn = (section: EditingSection) => (
    <button
      onClick={() => openEdit(section)}
      className="absolute top-4 right-4 bg-surface-container-low hover:bg-light text-on-surface text-xs font-mono px-3 py-1.5 rounded-lg transition-colors"
    >
      Edit
    </button>
  );

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
                Set up your brand tone of voice
              </h2>
              <p className="text-outline text-sm mb-6">
                Choose how you&apos;d like to define your brand&apos;s voice.
              </p>

              <div className="flex flex-col gap-3">
                {/* Option A */}
                <button
                  onClick={() => setEntryMode("paste")}
                  className="flex items-start gap-4 text-left border border-outline-variant/15 rounded-xl p-4 hover:border-primary hover:bg-primary-fixed/30 transition-colors"
                >
                  <span className="text-primary text-sm font-bold mt-0.5">*</span>
                  <div>
                    <p className="font-headline font-bold text-on-surface text-sm">Paste writing samples</p>
                    <p className="text-outline text-xs mt-0.5">
                      Paste examples of your brand writing and we&apos;ll extract your tone automatically.
                    </p>
                  </div>
                </button>

                {/* Option B */}
                <button
                  onClick={() => alert("Coming soon")}
                  className="flex items-start gap-4 text-left border border-outline-variant/15 rounded-xl p-4 hover:border-primary hover:bg-primary-fixed/30 transition-colors"
                >
                  <span className="text-primary text-xl mt-0.5">◇</span>
                  <div>
                    <p className="font-headline font-bold text-on-surface text-sm">Pull from brand strategy</p>
                    <p className="text-outline text-xs mt-0.5">
                      Use your saved brand strategy to auto-populate tone guidelines.
                    </p>
                  </div>
                </button>

                {/* Option C */}
                <button
                  onClick={handleBuildManually}
                  className="flex items-start gap-4 text-left border border-outline-variant/15 rounded-xl p-4 hover:border-primary hover:bg-primary-fixed/30 transition-colors"
                >
                  <span className="text-primary text-xl mt-0.5">☰</span>
                  <div>
                    <p className="font-headline font-bold text-on-surface text-sm">Build manually</p>
                    <p className="text-outline text-xs mt-0.5">
                      Define each aspect of your tone step by step.
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
                &larr; Back
              </button>
              <h2 className="font-semibold text-2xl text-on-surface mb-2">
                Paste writing samples
              </h2>
              <p className="text-outline text-sm mb-4">
                Paste examples of your brand writing below. The more, the better.
              </p>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={8}
                placeholder="Paste your website copy, emails, social posts, taglines..."
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
                {generating ? "Generating..." : "Generate tone"}
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

  return (
    <>
      <div className="max-w-4xl mx-auto pb-24">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/brand-library"
            className="text-outline hover:text-on-surface text-sm font-mono transition-colors"
          >
            &larr; Brand Library
          </Link>
          <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight mt-3">Brand Tone of Voice</h1>
          <p className="text-outline text-sm mt-1">{brandName}</p>
        </div>

        {/* Section 1: Expression */}
        <section className="bg-surface-container-lowest rounded-2xl p-8 mb-8 shadow-sm border border-outline-variant/10">
          <p className="font-body text-primary text-[10px] font-extrabold tracking-widest uppercase mb-4">
            YOUR BRAND EXPRESSION
          </p>
          <h2
            contentEditable
            suppressContentEditableWarning
            onBlur={e => {
              const val = e.currentTarget.textContent || '';
              if (val !== td.expression_label) {
                saveTone({ ...toneData!, expression_label: val });
              }
            }}
            className="font-headline font-extrabold italic text-3xl mb-4 text-on-surface outline-none focus:bg-surface-container-low/50 rounded-lg px-1 -mx-1 transition-colors"
          >
            {td.expression_label || 'Your expression here'}
          </h2>
          <p
            contentEditable
            suppressContentEditableWarning
            onBlur={e => {
              const val = e.currentTarget.textContent || '';
              if (val !== td.expression_text) {
                saveTone({ ...toneData!, expression_text: val });
              }
            }}
            className="text-on-surface-variant text-sm leading-relaxed max-w-xl outline-none focus:bg-surface-container-low/50 rounded-lg px-1 -mx-1 transition-colors"
          >
            {td.expression_text || 'Click to describe your brand expression...'}
          </p>
        </section>

        {/* Section 2: Tone Pillars */}
        <section className="relative mb-8">
          <p className="font-body text-on-surface-variant text-[10px] font-extrabold tracking-widest uppercase mb-4">
            TONE PILLARS
          </p>
          {pillars.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pillars.map((p, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-2xl shadow-sm p-6 border border-outline-variant/10">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-xs font-headline font-extrabold text-primary">{p.name?.[0] || 'P'}</div>
                  <h3
                    contentEditable suppressContentEditableWarning
                    onBlur={e => {
                      const newPillars = [...pillars]; newPillars[i] = { ...newPillars[i], name: e.currentTarget.textContent || '' };
                      saveTone({ ...toneData!, pillars: newPillars });
                    }}
                    className="font-headline font-bold text-on-surface text-base outline-none focus:bg-surface-container-low/50 rounded-lg px-1 -mx-1"
                  >{p.name}</h3>
                  <p
                    contentEditable suppressContentEditableWarning
                    onBlur={e => {
                      const newPillars = [...pillars]; newPillars[i] = { ...newPillars[i], desc: e.currentTarget.textContent || '' };
                      saveTone({ ...toneData!, pillars: newPillars });
                    }}
                    className="text-on-surface-variant text-xs mt-2 mb-4 outline-none focus:bg-surface-container-low/50 rounded-lg px-1 -mx-1"
                  >{p.desc}</p>
                  {p.bullets?.length > 0 && (
                    <ul className="space-y-2">
                      {p.bullets.map((b, j) => (
                        <li key={j} className="text-sm text-on-surface flex items-start gap-2">
                          <span className="text-primary mt-0.5 text-xs">&#x2022;</span>
                          <span
                            contentEditable suppressContentEditableWarning
                            onBlur={e => {
                              const newPillars = [...pillars]; const newBullets = [...newPillars[i].bullets]; newBullets[j] = e.currentTarget.textContent || '';
                              newPillars[i] = { ...newPillars[i], bullets: newBullets };
                              saveTone({ ...toneData!, pillars: newPillars });
                            }}
                            className="outline-none focus:bg-surface-container-low/50 rounded px-0.5 -mx-0.5 flex-1"
                          >{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-8 text-center">
              {placeholder("No tone pillars defined yet — click edit to add")}
            </div>
          )}
          {editBtn("pillars")}
        </section>

        {/* Section 3: Do & Don't */}
        <section className="relative mb-8">
          <p className="font-body text-on-surface-variant text-[10px] font-extrabold tracking-widest uppercase mb-4">
            DO &amp; DON&apos;T
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dos */}
            <div className="relative bg-green-50 border border-green-200 rounded-xl p-5">
              <h3 className="font-semibold text-green-800 text-sm mb-3">Do</h3>
              {dos.length > 0 ? (
                <ul className="space-y-2">
                  {dos.map((d, i) => (
                    <li key={i} className="text-xs text-green-800 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">&#10003;</span> {d}
                    </li>
                  ))}
                </ul>
              ) : (
                placeholder("No items yet")
              )}
              <button
                onClick={() => openEdit("dos")}
                className="absolute top-3 right-3 bg-green-100 hover:bg-green-200 text-green-800 text-xs font-mono px-2.5 py-1 rounded-lg transition-colors"
              >
                Edit
              </button>
            </div>
            {/* Donts */}
            <div className="relative bg-red-50 border border-red-200 rounded-xl p-5">
              <h3 className="font-semibold text-red-700 text-sm mb-3">Don&apos;t</h3>
              {donts.length > 0 ? (
                <ul className="space-y-2">
                  {donts.map((d, i) => (
                    <li key={i} className="text-xs text-red-700 flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">&#10007;</span> {d}
                    </li>
                  ))}
                </ul>
              ) : (
                placeholder("No items yet")
              )}
              <button
                onClick={() => openEdit("donts")}
                className="absolute top-3 right-3 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-mono px-2.5 py-1 rounded-lg transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        </section>

        {/* Section 4: Brand Vocabulary */}
        <section className="relative mb-8">
          <p className="font-body text-on-surface-variant text-[10px] font-extrabold tracking-widest uppercase mb-4">
            BRAND VOCABULARY
          </p>
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-6 space-y-5">
            <div>
              <p className="text-xs font-semibold text-green-700 mb-2">Always use</p>
              {vocabYes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {vocabYes.map((w, i) => (
                    <span
                      key={i}
                      className="bg-green-50 text-green-700 border border-green-200 text-xs px-3 py-1 rounded-full"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              ) : (
                placeholder("No words defined")
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-red-600 mb-2">Never use</p>
              {vocabNo.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {vocabNo.map((w, i) => (
                    <span
                      key={i}
                      className="bg-red-50 text-red-600 border border-red-200 text-xs px-3 py-1 rounded-full"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              ) : (
                placeholder("No words defined")
              )}
            </div>
          </div>
          {editBtn("vocab")}
        </section>

        {/* Section 5: Touchpoints */}
        <section className="relative mb-8">
          <p className="font-body text-on-surface-variant text-[10px] font-extrabold tracking-widest uppercase mb-4">
            CHANNEL TOUCHPOINTS
          </p>
          {touchpoints.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {touchpoints.map((tp, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-2xl shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-md bg-surface-container-high flex items-center justify-center text-[10px] font-headline font-bold text-on-surface-variant">{tp.name?.[0] || 'T'}</div>
                    <h3 className="font-headline font-bold text-on-surface text-sm">{tp.name}</h3>
                    <span className="ml-auto bg-primary-fixed text-primary text-[0.6rem] font-mono px-2 py-0.5 rounded-full">
                      {tp.badge}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[0.6rem] font-mono text-red-500 mb-1">&#10060; Wrong</p>
                      <p className="text-xs text-red-600/80 italic">{tp.bad}</p>
                    </div>
                    <div>
                      <p className="text-[0.6rem] font-mono text-green-600 mb-1">&#9989; Right</p>
                      <p className="text-xs text-green-700/80 italic">{tp.good}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-8 text-center">
              {placeholder("No touchpoints defined yet — click edit to add")}
            </div>
          )}
          {editBtn("touchpoints")}
        </section>

        {/* Section 6: Quick Checklist */}
        <section className="relative mb-8">
          <p className="font-body text-on-surface-variant text-[10px] font-extrabold tracking-widest uppercase mb-4">
            QUICK CHECKLIST
          </p>
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-6">
            <ul className="space-y-3">
              {checklist.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <button
                    onClick={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                      checked[i]
                        ? "bg-brand-orange border-primary text-white"
                        : "border-light hover:border-primary-mid"
                    }`}
                  >
                    {checked[i] && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <span className={`text-sm ${checked[i] ? "text-outline line-through" : "text-on-surface"}`}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {editBtn("checklist")}
        </section>
      </div>

      {/* ---- EDIT MODALS ---- */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto">
            <h2 className="font-semibold text-xl text-on-surface mb-5">
              Edit &mdash;{" "}
              {editing === "expression" && "Brand Expression"}
              {editing === "pillars" && "Tone Pillars"}
              {editing === "dos" && "Do's"}
              {editing === "donts" && "Don'ts"}
              {editing === "vocab" && "Brand Vocabulary"}
              {editing === "touchpoints" && "Channel Touchpoints"}
              {editing === "checklist" && "Quick Checklist"}
            </h2>

            {/* ---- Expression ---- */}
            {editing === "expression" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-outline block mb-1">Expression label</label>
                  <input
                    type="text"
                    value={draft.expression_label || ""}
                    onChange={(e) => setDraft((d) => ({ ...d, expression_label: e.target.value }))}
                    placeholder="e.g. Bold & Direct"
                    className="w-full border border-outline-variant/15 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-outline block mb-1">Expression text</label>
                  <textarea
                    value={draft.expression_text || ""}
                    onChange={(e) => setDraft((d) => ({ ...d, expression_text: e.target.value }))}
                    rows={4}
                    placeholder="Describe how your brand sounds..."
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
                        placeholder="Pillar name"
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
                      placeholder="Description"
                      className="w-full border border-outline-variant/15 rounded-lg px-3 py-1 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                    />
                    <div className="space-y-1">
                      <label className="text-xs font-mono text-outline">Bullets (one per line)</label>
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
                  + Add pillar
                </button>
              </div>
            )}

            {/* ---- Dos ---- */}
            {editing === "dos" && (
              <div className="space-y-3">
                <label className="text-xs font-mono text-outline">One per line</label>
                <textarea
                  value={(draft.dos || []).join("\n")}
                  onChange={(e) => setDraft((d) => ({ ...d, dos: e.target.value.split("\n") }))}
                  rows={8}
                  placeholder={"Use active voice\nBe specific\n..."}
                  className="w-full border border-outline-variant/15 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
                />
              </div>
            )}

            {/* ---- Donts ---- */}
            {editing === "donts" && (
              <div className="space-y-3">
                <label className="text-xs font-mono text-outline">One per line</label>
                <textarea
                  value={(draft.donts || []).join("\n")}
                  onChange={(e) => setDraft((d) => ({ ...d, donts: e.target.value.split("\n") }))}
                  rows={8}
                  placeholder={"Don't use passive voice\nDon't be vague\n..."}
                  className="w-full border border-outline-variant/15 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
                />
              </div>
            )}

            {/* ---- Vocab ---- */}
            {editing === "vocab" && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-mono text-green-700 block mb-1">Always use (comma-separated)</label>
                  <textarea
                    value={(draft.vocab_yes || []).join(", ")}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        vocab_yes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      }))
                    }
                    rows={3}
                    placeholder="innovative, partner, empower, ..."
                    className="w-full border border-outline-variant/15 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-red-600 block mb-1">Never use (comma-separated)</label>
                  <textarea
                    value={(draft.vocab_no || []).join(", ")}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        vocab_no: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      }))
                    }
                    rows={3}
                    placeholder="synergy, leverage, utilize, ..."
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
                        placeholder="Channel name"
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
                        placeholder="Badge"
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
                        <label className="text-xs font-mono text-red-500 block mb-1">Wrong example</label>
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
                        <label className="text-xs font-mono text-green-600 block mb-1">Right example</label>
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
                  + Add touchpoint
                </button>
              </div>
            )}

            {/* ---- Checklist ---- */}
            {editing === "checklist" && (
              <div className="space-y-3">
                <label className="text-xs font-mono text-outline">One item per line</label>
                <textarea
                  value={(draft.checklist || []).join("\n")}
                  onChange={(e) => setDraft((d) => ({ ...d, checklist: e.target.value.split("\n") }))}
                  rows={8}
                  placeholder="Does it sound like us?\nWould we say this out loud?\n..."
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
                Cancel
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
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
