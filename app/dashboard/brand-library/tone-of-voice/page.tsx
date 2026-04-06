"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

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
  brand_id: "vetra",
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
      const res = await fetch("/api/tone?brand_id=vetra");
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
  }, []);

  useEffect(() => {
    fetchTone();
  }, [fetchTone]);

  /* ---------------------------------------------------------------- */
  /*  Save helper                                                      */
  /* ---------------------------------------------------------------- */

  const saveTone = async (fields: Partial<ToneData>) => {
    setSaving(true);
    try {
      await fetch("/api/tone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: "vetra", ...fields }),
      });
      setToneData((prev) => (prev ? { ...prev, ...fields } : { ...EMPTY_TONE, ...fields }));
    } catch {
      // silent
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
          } catch {
            // parse errors in stream are non-fatal
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
        setDraft({ pillars: toneData.pillars?.length ? JSON.parse(JSON.stringify(toneData.pillars)) : [{ icon: "🎯", name: "", desc: "", bullets: ["", "", ""] }] });
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
        setDraft({ touchpoints: toneData.touchpoints?.length ? JSON.parse(JSON.stringify(toneData.touchpoints)) : [{ icon: "🌐", name: "", badge: "", bad: "", good: "" }] });
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
    <span className="text-muted italic text-sm">{text}</span>
  );

  const editBtn = (section: EditingSection) => (
    <button
      onClick={() => openEdit(section)}
      className="absolute top-4 right-4 bg-pale hover:bg-light text-ink text-xs font-mono px-3 py-1.5 rounded-lg transition-colors"
    >
      Edit
    </button>
  );

  /* ---------------------------------------------------------------- */
  /*  LOADING                                                          */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-brand-orange border-t-transparent rounded-full" />
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
              <h2 className="font-display text-2xl text-ink mb-2">
                Set up your brand tone of voice
              </h2>
              <p className="text-muted text-sm mb-6">
                Choose how you&apos;d like to define your brand&apos;s voice.
              </p>

              <div className="flex flex-col gap-3">
                {/* Option A */}
                <button
                  onClick={() => setEntryMode("paste")}
                  className="flex items-start gap-4 text-left border border-light rounded-xl p-4 hover:border-brand-orange hover:bg-brand-orange-pale/30 transition-colors"
                >
                  <span className="text-brand-orange text-xl mt-0.5">✦</span>
                  <div>
                    <p className="font-semibold text-ink text-sm">Paste writing samples</p>
                    <p className="text-muted text-xs mt-0.5">
                      Paste examples of your brand writing and we&apos;ll extract your tone automatically.
                    </p>
                  </div>
                </button>

                {/* Option B */}
                <button
                  onClick={() => alert("Coming soon")}
                  className="flex items-start gap-4 text-left border border-light rounded-xl p-4 hover:border-brand-orange hover:bg-brand-orange-pale/30 transition-colors"
                >
                  <span className="text-brand-orange text-xl mt-0.5">◇</span>
                  <div>
                    <p className="font-semibold text-ink text-sm">Pull from brand strategy</p>
                    <p className="text-muted text-xs mt-0.5">
                      Use your saved brand strategy to auto-populate tone guidelines.
                    </p>
                  </div>
                </button>

                {/* Option C */}
                <button
                  onClick={handleBuildManually}
                  className="flex items-start gap-4 text-left border border-light rounded-xl p-4 hover:border-brand-orange hover:bg-brand-orange-pale/30 transition-colors"
                >
                  <span className="text-brand-orange text-xl mt-0.5">☰</span>
                  <div>
                    <p className="font-semibold text-ink text-sm">Build manually</p>
                    <p className="text-muted text-xs mt-0.5">
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
                className="text-muted text-xs font-mono mb-4 hover:text-ink transition-colors"
              >
                &larr; Back
              </button>
              <h2 className="font-display text-2xl text-ink mb-2">
                Paste writing samples
              </h2>
              <p className="text-muted text-sm mb-4">
                Paste examples of your brand writing below. The more, the better.
              </p>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={8}
                placeholder="Paste your website copy, emails, social posts, taglines..."
                className="w-full border border-light rounded-xl p-4 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
              />
              {genProgress && (
                <p className="text-xs text-brand-orange font-mono mt-2">{genProgress}</p>
              )}
              <button
                onClick={handleGenerate}
                disabled={generating || !pastedText.trim()}
                className="mt-4 w-full bg-brand-orange text-white font-semibold text-sm py-3 rounded-xl hover:bg-brand-orange/90 disabled:opacity-50 transition-colors"
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
            className="text-muted hover:text-ink text-sm font-mono transition-colors"
          >
            &larr; Brand Library
          </Link>
          <h1 className="font-display text-[1.5rem] text-ink mt-3">Brand Tone of Voice</h1>
          <p className="text-muted text-sm mt-1">Vetra</p>
        </div>

        {/* Section 1: Expression */}
        <section className="relative bg-ink text-white rounded-2xl p-8 mb-8">
          <p className="font-mono text-brand-orange text-[0.65rem] tracking-widest uppercase mb-3">
            YOUR BRAND EXPRESSION
          </p>
          {td.expression_label ? (
            <>
              <h2 className="font-display italic text-3xl mb-3">{td.expression_label}</h2>
              <p className="text-white/80 text-sm leading-relaxed max-w-xl">
                {td.expression_text}
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display italic text-3xl mb-3 text-white/30">
                Your expression here
              </h2>
              {placeholder("Not defined yet — click edit to add")}
            </>
          )}
          <button
            onClick={() => openEdit("expression")}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white text-xs font-mono px-3 py-1.5 rounded-lg transition-colors"
          >
            Edit
          </button>
        </section>

        {/* Section 2: Tone Pillars */}
        <section className="relative mb-8">
          <p className="font-mono text-muted text-[0.65rem] tracking-widest uppercase mb-4">
            TONE PILLARS
          </p>
          {pillars.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pillars.map((p, i) => (
                <div key={i} className="bg-white border border-light rounded-xl p-5">
                  <span className="text-xl mb-2 block">{p.icon}</span>
                  <h3 className="font-semibold text-ink text-sm">{p.name}</h3>
                  <p className="text-muted text-xs mt-1 mb-3">{p.desc}</p>
                  {p.bullets?.length > 0 && (
                    <ul className="space-y-1">
                      {p.bullets.map((b, j) => (
                        <li key={j} className="text-xs text-dark flex items-start gap-1.5">
                          <span className="text-brand-orange mt-0.5">&#x2022;</span> {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-light rounded-xl p-8 text-center">
              {placeholder("No tone pillars defined yet — click edit to add")}
            </div>
          )}
          {editBtn("pillars")}
        </section>

        {/* Section 3: Do & Don't */}
        <section className="relative mb-8">
          <p className="font-mono text-muted text-[0.65rem] tracking-widest uppercase mb-4">
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
          <p className="font-mono text-muted text-[0.65rem] tracking-widest uppercase mb-4">
            BRAND VOCABULARY
          </p>
          <div className="bg-white border border-light rounded-xl p-6 space-y-5">
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
          <p className="font-mono text-muted text-[0.65rem] tracking-widest uppercase mb-4">
            CHANNEL TOUCHPOINTS
          </p>
          {touchpoints.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {touchpoints.map((tp, i) => (
                <div key={i} className="bg-white border border-light rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{tp.icon}</span>
                    <h3 className="font-semibold text-ink text-sm">{tp.name}</h3>
                    <span className="ml-auto bg-brand-orange-pale text-brand-orange text-[0.6rem] font-mono px-2 py-0.5 rounded-full">
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
            <div className="bg-white border border-light rounded-xl p-8 text-center">
              {placeholder("No touchpoints defined yet — click edit to add")}
            </div>
          )}
          {editBtn("touchpoints")}
        </section>

        {/* Section 6: Quick Checklist */}
        <section className="relative mb-8">
          <p className="font-mono text-muted text-[0.65rem] tracking-widest uppercase mb-4">
            QUICK CHECKLIST
          </p>
          <div className="bg-white border border-light rounded-xl p-6">
            <ul className="space-y-3">
              {checklist.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <button
                    onClick={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                      checked[i]
                        ? "bg-brand-orange border-brand-orange text-white"
                        : "border-light hover:border-brand-orange-mid"
                    }`}
                  >
                    {checked[i] && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <span className={`text-sm ${checked[i] ? "text-muted line-through" : "text-ink"}`}>
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
            <h2 className="font-display text-xl text-ink mb-5">
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
                  <label className="text-xs font-mono text-muted block mb-1">Expression label</label>
                  <input
                    type="text"
                    value={draft.expression_label || ""}
                    onChange={(e) => setDraft((d) => ({ ...d, expression_label: e.target.value }))}
                    placeholder="e.g. Bold & Direct"
                    className="w-full border border-light rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted block mb-1">Expression text</label>
                  <textarea
                    value={draft.expression_text || ""}
                    onChange={(e) => setDraft((d) => ({ ...d, expression_text: e.target.value }))}
                    rows={4}
                    placeholder="Describe how your brand sounds..."
                    className="w-full border border-light rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
                  />
                </div>
              </div>
            )}

            {/* ---- Pillars ---- */}
            {editing === "pillars" && (
              <div className="space-y-6">
                {(draft.pillars || []).map((p, i) => (
                  <div key={i} className="border border-light rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={p.icon}
                        onChange={(e) => {
                          const arr = [...(draft.pillars || [])];
                          arr[i] = { ...arr[i], icon: e.target.value };
                          setDraft((d) => ({ ...d, pillars: arr }));
                        }}
                        className="w-12 border border-light rounded-lg px-2 py-1 text-center text-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                      />
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => {
                          const arr = [...(draft.pillars || [])];
                          arr[i] = { ...arr[i], name: e.target.value };
                          setDraft((d) => ({ ...d, pillars: arr }));
                        }}
                        placeholder="Pillar name"
                        className="flex-1 border border-light rounded-lg px-3 py-1 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
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
                      className="w-full border border-light rounded-lg px-3 py-1 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                    />
                    <div className="space-y-1">
                      <label className="text-xs font-mono text-muted">Bullets (one per line)</label>
                      <textarea
                        value={(p.bullets || []).join("\n")}
                        onChange={(e) => {
                          const arr = [...(draft.pillars || [])];
                          arr[i] = { ...arr[i], bullets: e.target.value.split("\n") };
                          setDraft((d) => ({ ...d, pillars: arr }));
                        }}
                        rows={3}
                        className="w-full border border-light rounded-lg px-3 py-1 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setDraft((d) => ({ ...d, pillars: [...(d.pillars || []), { icon: "🎯", name: "", desc: "", bullets: [""] }] }))}
                  className="text-brand-orange text-xs font-mono hover:underline"
                >
                  + Add pillar
                </button>
              </div>
            )}

            {/* ---- Dos ---- */}
            {editing === "dos" && (
              <div className="space-y-3">
                <label className="text-xs font-mono text-muted">One per line</label>
                <textarea
                  value={(draft.dos || []).join("\n")}
                  onChange={(e) => setDraft((d) => ({ ...d, dos: e.target.value.split("\n") }))}
                  rows={8}
                  placeholder={"Use active voice\nBe specific\n..."}
                  className="w-full border border-light rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
                />
              </div>
            )}

            {/* ---- Donts ---- */}
            {editing === "donts" && (
              <div className="space-y-3">
                <label className="text-xs font-mono text-muted">One per line</label>
                <textarea
                  value={(draft.donts || []).join("\n")}
                  onChange={(e) => setDraft((d) => ({ ...d, donts: e.target.value.split("\n") }))}
                  rows={8}
                  placeholder={"Don't use passive voice\nDon't be vague\n..."}
                  className="w-full border border-light rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
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
                    className="w-full border border-light rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
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
                    className="w-full border border-light rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
                  />
                </div>
              </div>
            )}

            {/* ---- Touchpoints ---- */}
            {editing === "touchpoints" && (
              <div className="space-y-6">
                {(draft.touchpoints || []).map((tp, i) => (
                  <div key={i} className="border border-light rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tp.icon}
                        onChange={(e) => {
                          const arr = [...(draft.touchpoints || [])];
                          arr[i] = { ...arr[i], icon: e.target.value };
                          setDraft((d) => ({ ...d, touchpoints: arr }));
                        }}
                        className="w-12 border border-light rounded-lg px-2 py-1 text-center text-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                      />
                      <input
                        type="text"
                        value={tp.name}
                        onChange={(e) => {
                          const arr = [...(draft.touchpoints || [])];
                          arr[i] = { ...arr[i], name: e.target.value };
                          setDraft((d) => ({ ...d, touchpoints: arr }));
                        }}
                        placeholder="Channel name"
                        className="flex-1 border border-light rounded-lg px-3 py-1 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
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
                        className="w-24 border border-light rounded-lg px-2 py-1 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
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
                          className="w-full border border-light rounded-lg px-2 py-1 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
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
                          className="w-full border border-light rounded-lg px-2 py-1 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      touchpoints: [...(d.touchpoints || []), { icon: "🌐", name: "", badge: "", bad: "", good: "" }],
                    }))
                  }
                  className="text-brand-orange text-xs font-mono hover:underline"
                >
                  + Add touchpoint
                </button>
              </div>
            )}

            {/* ---- Checklist ---- */}
            {editing === "checklist" && (
              <div className="space-y-3">
                <label className="text-xs font-mono text-muted">One item per line</label>
                <textarea
                  value={(draft.checklist || []).join("\n")}
                  onChange={(e) => setDraft((d) => ({ ...d, checklist: e.target.value.split("\n") }))}
                  rows={8}
                  placeholder="Does it sound like us?\nWould we say this out loud?\n..."
                  className="w-full border border-light rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
                />
              </div>
            )}

            {/* ---- Modal footer ---- */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-light">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm text-muted hover:text-ink transition-colors"
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
                className="px-5 py-2 bg-brand-orange text-white text-sm font-semibold rounded-xl hover:bg-brand-orange/90 disabled:opacity-50 transition-colors"
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
