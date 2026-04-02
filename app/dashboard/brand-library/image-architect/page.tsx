"use client";

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Datapoint {
  n: string;
  label: string;
  value: string;
}

interface DNA {
  headline: string;
  datapoints: Datapoint[];
}

interface PromptResult {
  prompt: string;
  negativePrompt: string;
  tip: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const LOADING_MESSAGES = [
  "Reading lighting and colour across all images…",
  "Detecting composition, grain, and lens feel…",
  "Identifying mood, culture, and photographer references…",
  "Cross-referencing 30 visual dimensions…",
];

const FORMAT_OPTIONS = [
  { label: "Square 1:1", value: "1:1" },
  { label: "Portrait 9:16", value: "9:16" },
  { label: "Landscape 16:9", value: "16:9" },
  { label: "Portrait 4:5", value: "4:5" },
];

const GENDER_OPTIONS = ["Woman", "Man", "Non-binary", "Gender-fluid", "Group"];

const MOOD_PRESETS = [
  { label: "Joyful + Social", desc: "Warm, inclusive energy with natural laughter and genuine connection. Friends-at-golden-hour feeling." },
  { label: "Confident + Bold", desc: "Strong, self-assured presence. Direct gaze, powerful stance, unapologetic ownership of space." },
  { label: "Playful + Expressive", desc: "Carefree movement, bright eyes, spontaneous gesture. Mid-action, unposed, full of life." },
];

const LOCATION_OPTIONS = ["City", "Home", "Office", "Beach", "Nature", "Studio", "Event"];

const FREE_GENERATORS = ["Google Gemini", "ChatGPT + DALL·E 3", "Adobe Firefly", "Ideogram", "Microsoft Designer"];
const ADVANCED_GENERATORS = ["Midjourney", "Flux via Fal.ai", "Leonardo.ai", "Stable Diffusion XL", "Runway ML"];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function resizeImageToBase64(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width;
      let h = img.height;
      if (w > h && w > maxSize) { h = (h / w) * maxSize; w = maxSize; }
      else if (h > maxSize) { w = (w / h) * maxSize; h = maxSize; }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve(dataUrl.split(",")[1]); // base64 only
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function ImageArchitectPage() {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 state
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [analysing, setAnalysing] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [dna, setDna] = useState<DNA | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Step 2 state
  const [format, setFormat] = useState("");
  const [formatOther, setFormatOther] = useState("");
  const [subject, setSubject] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [genderOther, setGenderOther] = useState("");
  const [action, setAction] = useState("");
  const [wardrobe, setWardrobe] = useState("");
  const [mood, setMood] = useState("");
  const [moodText, setMoodText] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [locationText, setLocationText] = useState("");
  const [other, setOther] = useState("");
  const [generating, setGenerating] = useState(false);
  const [promptResult, setPromptResult] = useState<PromptResult | null>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  /* ---- Step 1: File handling ---- */

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const valid = Array.from(newFiles).filter((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase();
      return ["jpg", "jpeg", "png", "webp"].includes(ext || "") && f.size <= 8 * 1024 * 1024;
    });

    setFiles((prev) => {
      const combined = [...prev, ...valid].slice(0, 10);
      setPreviews(combined.map((f) => URL.createObjectURL(f)));
      return combined;
    });
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setPreviews(next.map((f) => URL.createObjectURL(f)));
      return next;
    });
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = "";
  }, [addFiles]);

  /* ---- Step 1: Analyse ---- */

  const analyse = useCallback(async () => {
    if (files.length < 4) return;
    setAnalysing(true);
    setAnalysisError(null);
    setDna(null);

    // Cycle loading messages
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(msgIndex);
    }, 2000);

    try {
      const base64Images = await Promise.all(files.map((f) => resizeImageToBase64(f, 600)));

      const res = await fetch("/api/brand/analyse-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: base64Images }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setDna(data);

      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("brand_visual_dna").insert({
        brand_id: "vetra",
        user_id: user?.id || null,
        headline: data.headline,
        datapoints: data.datapoints,
        reference_image_urls: [],
      });
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      clearInterval(msgInterval);
      setAnalysing(false);
    }
  }, [files]);

  /* ---- Step 2: Generate prompt ---- */

  const generatePrompt = useCallback(async () => {
    if (!subject.trim() || !dna) return;
    setGenerating(true);
    setPromptError(null);
    setPromptResult(null);

    try {
      const inputs = {
        format: format || formatOther || "not specified",
        subject,
        age: age || "not specified",
        gender: gender || genderOther || "not specified",
        action: action || "not specified",
        wardrobe: wardrobe || "not specified",
        mood: moodText || mood || "not specified",
        location: locationText || locations.join(", ") || "not specified",
        other: other || "none",
      };

      const res = await fetch("/api/brand/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs, dna }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setPromptResult(data);
    } catch (err) {
      setPromptError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }, [subject, dna, format, formatOther, age, gender, genderOther, action, wardrobe, mood, moodText, locations, locationText, other]);

  const copyText = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Header */}
      <div className="px-8 pt-7 pb-4 border-b border-light shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/dashboard/brand-library" className="text-muted hover:text-ink text-[0.75rem]">
            ← Brand Library
          </Link>
        </div>
        <h1 className="font-display text-[1.5rem] text-ink tracking-tight mb-1">
          Brand Image Architect
        </h1>
        <p className="text-[0.78rem] text-muted">
          Upload reference images to extract your visual DNA, then generate on-brand image prompts.
        </p>

        {/* Step indicator */}
        <div className="flex items-center gap-4 mt-4">
          <div className={`flex items-center gap-2 ${step === 1 ? "text-brand-orange" : "text-muted"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[0.65rem] font-mono font-medium ${step === 1 ? "bg-brand-orange text-white" : dna ? "bg-brand-orange-pale text-brand-orange" : "bg-pale text-muted"}`}>1</div>
            <span className="font-mono text-[0.65rem] uppercase tracking-wide">Upload & Analyse</span>
          </div>
          <div className="w-8 h-px bg-light" />
          <div className={`flex items-center gap-2 ${step === 2 ? "text-brand-orange" : "text-muted"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[0.65rem] font-mono font-medium ${step === 2 ? "bg-brand-orange text-white" : "bg-pale text-muted"}`}>2</div>
            <span className="font-mono text-[0.65rem] uppercase tracking-wide">Prompt Architect</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-6">

        {/* ══════════════════════════════════════════════════════════ */}
        {/*  STEP 1 — Upload & Analyse                                */}
        {/* ══════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div>
            {!dna && (
              <>
                {/* Upload zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-all py-10 mb-4 ${
                    dragOver ? "border-brand-orange bg-brand-orange-pale" : "border-light bg-pale/40 hover:border-brand-orange hover:bg-brand-orange-pale/40"
                  }`}
                >
                  <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" multiple className="hidden" onChange={handleFileChange} />
                  <svg className="h-10 w-10 text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                  <span className="font-mono text-[0.7rem] tracking-wide uppercase text-muted">Drop brand reference images here</span>
                  <span className="font-mono text-[0.55rem] text-muted/60 mt-1">JPG, PNG, WEBP · Max 8MB each · 4-10 images</span>
                </div>

                {/* Thumbnail grid */}
                {files.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {previews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-pale group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`ref ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[0.6rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Counter */}
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-[0.65rem] text-muted">
                    {files.length} image{files.length !== 1 ? "s" : ""} selected
                    {files.length < 4 && ` — need at least ${4 - files.length} more to analyse`}
                  </span>
                  <button
                    onClick={analyse}
                    disabled={files.length < 4 || analysing}
                    className="px-6 py-2.5 rounded-lg bg-brand-orange text-white font-mono text-[0.7rem] uppercase tracking-wide hover:bg-brand-orange-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {analysing ? "Analysing…" : "Analyse visual DNA"}
                  </button>
                </div>
              </>
            )}

            {/* Loading state */}
            {analysing && (
              <div className="flex flex-col items-center py-16">
                <div className="h-8 w-8 rounded-full border-2 border-brand-orange border-t-transparent animate-spin mb-4" />
                <p className="text-[0.82rem] text-ink font-medium mb-1">Analysing your brand images…</p>
                <p className="font-mono text-[0.65rem] text-brand-orange">{LOADING_MESSAGES[loadingMsg]}</p>
              </div>
            )}

            {/* Error */}
            {analysisError && (
              <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-[0.78rem] text-red-600 mb-4">
                {analysisError}
              </div>
            )}

            {/* DNA Results */}
            {dna && (
              <div>
                {/* Headline */}
                <div className="bg-ink rounded-lg p-6 mb-6">
                  <div className="font-mono text-[0.55rem] tracking-wider uppercase text-white/40 mb-2">Visual DNA Headline</div>
                  <p className="font-display text-xl text-white italic leading-relaxed">{dna.headline}</p>
                </div>

                {/* 30 datapoints grid */}
                <div className="font-mono text-[0.55rem] tracking-wider uppercase text-muted mb-3">30-Point Visual DNA</div>
                <div className="grid grid-cols-3 gap-2.5 mb-8">
                  {dna.datapoints.map((dp) => (
                    <div key={dp.n} className="bg-white border border-light rounded-lg p-3 hover:border-brand-orange/30 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[0.55rem] text-brand-orange font-medium">{dp.n}</span>
                        <span className="font-mono text-[0.55rem] text-muted uppercase tracking-wide">{dp.label}</span>
                      </div>
                      <p className="text-[0.78rem] text-ink">{dp.value}</p>
                    </div>
                  ))}
                </div>

                {/* Continue button */}
                <div className="flex justify-center">
                  <button
                    onClick={() => setStep(2)}
                    className="px-8 py-3 rounded-lg bg-brand-orange text-white font-medium text-[0.88rem] hover:bg-brand-orange-hover transition-all"
                  >
                    Continue to Prompt Architect →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/*  STEP 2 — Prompt Architect                                */}
        {/* ══════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div>
            {!promptResult ? (
              <div className="max-w-3xl">
                {/* Field 1: Content format */}
                <FieldSection label="Content Format">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {FORMAT_OPTIONS.map((opt) => (
                      <Chip key={opt.value} label={opt.label} active={format === opt.value} onClick={() => setFormat(format === opt.value ? "" : opt.value)} />
                    ))}
                  </div>
                  <input value={formatOther} onChange={(e) => { setFormatOther(e.target.value); setFormat(""); }} placeholder="Other format or size" className="form-input" />
                </FieldSection>

                {/* Field 2: Subject */}
                <FieldSection label="Subject" required>
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Who or what is in the image? (e.g. a confident young woman · a group of three friends · a person mid-action)" className="form-input" />
                </FieldSection>

                {/* Field 3: Age + Gender */}
                <FieldSection label="Age Range and Gender">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-mono text-[0.5rem] text-muted uppercase block mb-1">Age Range</label>
                      <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. early 20s · teens · 30s · young adult" className="form-input" />
                    </div>
                    <div>
                      <label className="font-mono text-[0.5rem] text-muted uppercase block mb-1">Gender</label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {GENDER_OPTIONS.map((g) => (
                          <Chip key={g} label={g} active={gender === g} onClick={() => setGender(gender === g ? "" : g)} />
                        ))}
                      </div>
                      <input value={genderOther} onChange={(e) => { setGenderOther(e.target.value); setGender(""); }} placeholder="Or write your own (e.g. two women and a man)" className="form-input" />
                    </div>
                  </div>
                </FieldSection>

                {/* Field 4: Action */}
                <FieldSection label="Action">
                  <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. laughing while scrolling phone · dancing at a festival · sitting at a rooftop café at sunset · running through city streets" className="form-input" />
                  <p className="font-mono text-[0.5rem] text-muted/70 mt-1">Be specific — the more detail, the better the result</p>
                </FieldSection>

                {/* Field 5: Wardrobe */}
                <FieldSection label="Wardrobe and Colours">
                  <input value={wardrobe} onChange={(e) => setWardrobe(e.target.value)} placeholder="e.g. bright orange oversized hoodie · all-white linen · bold yellow streetwear · black minimalist" className="form-input" />
                </FieldSection>

                {/* Field 6: Mood */}
                <FieldSection label="Mood and Energy">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {MOOD_PRESETS.map((m) => (
                      <Chip key={m.label} label={m.label} active={mood === m.label} onClick={() => { setMood(mood === m.label ? "" : m.label); setMoodText(mood === m.label ? "" : m.desc); }} />
                    ))}
                  </div>
                  <input value={moodText} onChange={(e) => { setMoodText(e.target.value); setMood(""); }} placeholder="Or describe the mood in your own words…" className="form-input" />
                </FieldSection>

                {/* Field 7: Location */}
                <FieldSection label="Location and Setting">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {LOCATION_OPTIONS.map((loc) => (
                      <Chip
                        key={loc}
                        label={loc}
                        active={locations.includes(loc)}
                        onClick={() => setLocations((prev) => prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc])}
                      />
                    ))}
                  </div>
                  <input value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder="Describe the specific location (e.g. rooftop Miami sunset · neon-lit Tokyo crossing · minimalist white studio)" className="form-input" />
                </FieldSection>

                {/* Field 8: Other */}
                <FieldSection label="Other Requests">
                  <textarea value={other} onChange={(e) => setOther(e.target.value)} rows={3} placeholder="Anything else? The wildcard field — e.g. 3 girls dressed as pumpkins by a campfire · product in frame · specific prop · unusual angle · text overlay space" className="form-input resize-y" />
                  <p className="font-mono text-[0.5rem] text-muted/70 mt-1">No wrong answers — the stranger the request, the more this field matters</p>
                </FieldSection>

                {/* Generate button */}
                {promptError && (
                  <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-[0.78rem] text-red-600 mb-4">
                    {promptError}
                  </div>
                )}
                <button
                  onClick={generatePrompt}
                  disabled={!subject.trim() || generating}
                  className="w-full py-4 rounded-lg bg-brand-orange text-white font-medium text-[0.9rem] hover:bg-brand-orange-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Generating…
                    </>
                  ) : (
                    "Generate on-brand prompt"
                  )}
                </button>
              </div>
            ) : (
              /* ---- Prompt Results ---- */
              <div className="max-w-3xl">
                {/* Main prompt */}
                <div className="bg-[#0A0A0F] rounded-lg p-6 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[0.55rem] tracking-wider uppercase text-white/40">Generated Prompt</span>
                    <button
                      onClick={() => copyText(promptResult.prompt, "prompt")}
                      className="px-3 py-1 rounded bg-white/10 font-mono text-[0.55rem] uppercase text-white/60 hover:bg-white/20 transition-all"
                    >
                      {copied === "prompt" ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                  <p className="font-mono text-[0.82rem] text-white leading-[1.8] whitespace-pre-wrap">{promptResult.prompt}</p>
                </div>

                {/* Negative prompt */}
                <div className="bg-white border border-light rounded-lg p-5 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[0.55rem] tracking-wider uppercase text-muted">Negative Prompt</span>
                    <button
                      onClick={() => copyText(promptResult.negativePrompt, "neg")}
                      className="px-2 py-0.5 rounded bg-pale font-mono text-[0.5rem] uppercase text-muted hover:text-ink transition-all border border-light"
                    >
                      {copied === "neg" ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                  <p className="font-mono text-[0.75rem] text-muted leading-relaxed">{promptResult.negativePrompt}</p>
                </div>

                {/* Generators */}
                <div className="bg-white border border-light rounded-lg p-5 mb-4">
                  <div className="mb-4">
                    <span className="font-mono text-[0.55rem] tracking-wider uppercase text-muted block mb-2">Free Generators</span>
                    <div className="flex flex-wrap gap-2">
                      {FREE_GENERATORS.map((g) => (
                        <span key={g} className="px-3 py-1.5 rounded-full bg-green-50 border border-green-200 font-mono text-[0.6rem] text-green-700">{g}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-mono text-[0.55rem] tracking-wider uppercase text-muted block mb-2">Advanced Generators</span>
                    <div className="flex flex-wrap gap-2">
                      {ADVANCED_GENERATORS.map((g) => (
                        <span key={g} className="px-3 py-1.5 rounded-full bg-brand-orange-pale border border-brand-orange-mid font-mono text-[0.6rem] text-brand-orange">{g}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tip */}
                <div className="bg-brand-orange-pale border border-brand-orange-mid rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[0.85rem]">💡</span>
                    <span className="font-mono text-[0.55rem] tracking-wider uppercase text-brand-orange">Platform Recommendation</span>
                  </div>
                  <p className="text-[0.78rem] text-dark leading-relaxed">{promptResult.tip}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setPromptResult(null)}
                    className="px-6 py-2.5 rounded-lg border border-light text-mid font-mono text-[0.65rem] uppercase tracking-wide hover:border-brand-orange hover:text-brand-orange transition-all"
                  >
                    ← Edit inputs
                  </button>
                  <button
                    onClick={() => { setPromptResult(null); setSubject(""); setAction(""); setWardrobe(""); setMoodText(""); setOther(""); }}
                    className="px-6 py-2.5 rounded-lg bg-brand-orange text-white font-mono text-[0.65rem] uppercase tracking-wide hover:bg-brand-orange-hover transition-all"
                  >
                    Generate another
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global styles for form inputs */}
      <style jsx global>{`
        .form-input {
          width: 100%;
          border: 1px solid #E5E5E5;
          border-radius: 0.5rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.82rem;
          color: #1A1A1A;
          background: white;
          outline: none;
          transition: border-color 0.15s;
          font-family: var(--font-dm-sans), sans-serif;
        }
        .form-input:focus {
          border-color: #E8562A;
        }
        .form-input::placeholder {
          color: #9A9A9A;
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function FieldSection({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="font-mono text-[0.58rem] tracking-[0.1em] uppercase text-muted block mb-1.5">
        {label}{required && <span className="text-brand-orange ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-[5px] rounded-full font-mono text-[0.62rem] tracking-wide border transition-all ${
        active
          ? "bg-brand-orange text-white border-brand-orange"
          : "bg-white text-muted border-light hover:border-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
