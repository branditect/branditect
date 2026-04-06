"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const INDUSTRIES = [
  { emoji: "💻", label: "Tech & SaaS" },
  { emoji: "🛒", label: "E-commerce" },
  { emoji: "🧘", label: "Health & Wellness" },
  { emoji: "🍽", label: "Food & Beverage" },
  { emoji: "💼", label: "Professional Services" },
  { emoji: "✨", label: "Fashion & Beauty" },
  { emoji: "📚", label: "Education" },
  { emoji: "🏠", label: "Real Estate" },
  { emoji: "◈", label: "Other" },
];

const LOGO_SLOTS = [
  { key: "primary", label: "Primary Logo" },
  { key: "dark-bg", label: "Dark Background Version" },
  { key: "icon-mark", label: "Icon / Mark Only" },
  { key: "white", label: "White Version" },
];

const STRATEGY_OPTIONS = [
  {
    value: "questionnaire",
    icon: "✦",
    title: "Answer our brand questionnaire",
    desc: "38 strategic questions that build your complete brand foundation. Takes 15-30 minutes.",
  },
  {
    value: "paste",
    icon: "📋",
    title: "Paste existing strategy",
    desc: "Already have a brand strategy? Paste it and we'll structure it.",
  },
  {
    value: "pdf",
    icon: "📄",
    title: "Upload a PDF",
    desc: "Upload your brand guidelines or strategy document.",
  },
  {
    value: "skip",
    icon: "⏭",
    title: "Skip for now",
    desc: "You can always set this up later from the Brand Library.",
  },
];

const MODULE_CARDS = [
  { icon: "📊", title: "Dashboard", desc: "Your brand command centre at a glance." },
  { icon: "✦", title: "Create", desc: "Generate on-brand content in seconds." },
  { icon: "📖", title: "Brand Library", desc: "Voice, visuals, and strategy in one place." },
  { icon: "🗂", title: "Asset Library", desc: "All your logos, images, and files organised." },
  { icon: "🖼", title: "Image Architect", desc: "AI-powered image generation for your brand." },
  { icon: "💼", title: "Business Tools", desc: "Pricing, finance, and operations support." },
];

const STEPS = [
  { num: 1, title: "Brand Basics", subtitle: "Name, website & industry" },
  { num: 2, title: "Logo Upload", subtitle: "Your brand visuals" },
  { num: 3, title: "Brand Colors", subtitle: "Your color palette" },
  { num: 4, title: "Brand Strategy", subtitle: "How you position your brand" },
  { num: 5, title: "All Done", subtitle: "Your workspace is ready" },
];

/* ------------------------------------------------------------------ */
/*  Helper: generate a brand ID                                       */
/* ------------------------------------------------------------------ */

function makeBrandId(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function OnboardingPage() {
  const router = useRouter();

  /* ---- state ---- */
  const [step, setStep] = useState(1);

  // Step 1
  const [brandName, setBrandName] = useState("");
  const [website, setWebsite] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");

  // Step 2
  const [logoPreviews, setLogoPreviews] = useState<Record<string, string>>({});
  const [logoUploaded, setLogoUploaded] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Step 3 (colors)
  const [brandColors, setBrandColors] = useState<{ hex: string; name: string }[]>([]);
  const [newColorHex, setNewColorHex] = useState("#E8562A");
  const [newColorName, setNewColorName] = useState("");

  // Step 4 (strategy)
  const [strategyMethod, setStrategyMethod] = useState("");
  const [strategyText, setStrategyText] = useState("");
  const [strategyFile, setStrategyFile] = useState<File | null>(null);
  const strategyFileRef = useRef<HTMLInputElement | null>(null);

  // General
  const [submitting, setSubmitting] = useState(false);

  /* ---- brand id (lazy) ---- */
  const brandIdRef = useRef("");
  const getBrandId = useCallback(() => {
    if (!brandIdRef.current) brandIdRef.current = makeBrandId(brandName);
    return brandIdRef.current;
  }, [brandName]);

  /* ---- logo handling ---- */
  function handleLogoSelect(slotKey: string, file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreviews((prev) => ({ ...prev, [slotKey]: e.target?.result as string }));
    };
    reader.readAsDataURL(file);

    // Upload immediately
    const brandId = getBrandId();
    const ext = file.name.split(".").pop() || "png";
    const path = `${brandId}/${slotKey}.${ext}`;
    supabase.storage
      .from("brand-logos")
      .upload(path, file, { upsert: true })
      .then(({ error }) => {
        if (!error) setLogoUploaded((prev) => ({ ...prev, [slotKey]: true }));
      });
  }

  /* ---- strategy PDF upload ---- */
  async function uploadStrategyPdf(file: File) {
    const brandId = getBrandId();
    await supabase.storage.from("brand-strategy").upload(`${brandId}/strategy.pdf`, file, { upsert: true });
  }

  /* ---- submit ---- */
  async function handleSubmit() {
    setSubmitting(true);
    try {
      const brandId = getBrandId();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (strategyFile) await uploadStrategyPdf(strategyFile);

      // Get primary logo URL if uploaded
      let logoUrl = null;
      if (logoUploaded["primary"]) {
        const { data: urlData } = supabase.storage.from("brand-logos").getPublicUrl(`${brandId}/primary.png`);
        logoUrl = urlData?.publicUrl || null;
      }

      await supabase.from("brands").insert({
        user_id: user?.id,
        brand_id: brandId,
        brand_name: brandName,
        website: website || null,
        industry: selectedIndustry,
        strategy_method: strategyMethod || "skip",
        strategy_text: strategyText || null,
        logo_url: logoUrl,
        colors: brandColors.length > 0 ? brandColors : null,
        onboarding_completed: true,
      });

      setStep(5);
    } catch (err) {
      console.error("Onboarding submit error:", err);
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Render helpers                                                   */
  /* ---------------------------------------------------------------- */

  function renderStep1() {
    return (
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl text-ink mb-1">Brand Basics</h2>
        <p className="text-muted text-sm mb-8">Tell us a little about your brand to get started.</p>

        {/* Brand name */}
        <label className="block text-sm font-medium text-dark mb-1.5">What&apos;s your brand called?</label>
        <input
          type="text"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          placeholder="e.g. Acme Inc."
          className="w-full rounded-xl border border-light bg-white px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-orange mb-6"
        />

        {/* Website */}
        <label className="block text-sm font-medium text-dark mb-1.5">Website URL</label>
        <input
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-xl border border-light bg-white px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-orange mb-6"
        />

        {/* Industry */}
        <label className="block text-sm font-medium text-dark mb-3">Industry</label>
        <div className="grid grid-cols-3 gap-2.5 mb-8">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind.label}
              type="button"
              onClick={() => setSelectedIndustry(ind.label)}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-4 text-sm transition-all ${
                selectedIndustry === ind.label
                  ? "border-brand-orange bg-brand-orange-pale text-ink"
                  : "border-light bg-white text-mid hover:border-muted"
              }`}
            >
              <span className="text-xl">{ind.emoji}</span>
              <span>{ind.label}</span>
            </button>
          ))}
        </div>

        <button
          disabled={!brandName.trim()}
          onClick={() => setStep(2)}
          className="rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold px-8 py-3 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue →
        </button>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl text-ink mb-1">Upload your brand logos</h2>
        <p className="text-muted text-sm mb-8">Add your logo variants. You can always add more later.</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {LOGO_SLOTS.map((slot) => {
            const preview = logoPreviews[slot.key];
            const uploaded = logoUploaded[slot.key];
            return (
              <button
                key={slot.key}
                type="button"
                onClick={() => fileInputRefs.current[slot.key]?.click()}
                className="relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-light bg-white p-8 text-center hover:border-brand-orange transition-colors group"
              >
                {preview ? (
                  <img src={preview} alt={slot.label} className="max-h-16 max-w-[120px] object-contain" />
                ) : (
                  <span className="text-3xl text-muted group-hover:text-brand-orange transition-colors">+</span>
                )}
                <span className="text-xs text-muted">{slot.label}</span>
                {uploaded && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px]">
                    ✓
                  </span>
                )}
                <input
                  ref={(el) => { fileInputRefs.current[slot.key] = el; }}
                  type="file"
                  accept="image/*,.svg,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoSelect(slot.key, file);
                  }}
                />
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setStep(3)}
            className="rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold px-8 py-3 text-sm transition-colors"
          >
            Continue →
          </button>
          <button
            onClick={() => setStep(3)}
            className="text-sm text-muted hover:text-brand-orange transition-colors"
          >
            Skip for now →
          </button>
        </div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl text-ink mb-1">Brand Colors</h2>
        <p className="text-muted text-sm mb-8">Add your brand colors. You can always update these later.</p>

        {/* Color list */}
        <div className="flex flex-wrap gap-3 mb-6">
          {brandColors.map((c, i) => (
            <div key={i} className="flex items-center gap-2 bg-white border border-light rounded-xl px-3 py-2">
              <div className="w-8 h-8 rounded-lg border border-light" style={{ background: c.hex }} />
              <div>
                <div className="text-xs font-semibold text-ink">{c.name || "Unnamed"}</div>
                <div className="font-mono text-[0.65rem] text-muted">{c.hex}</div>
              </div>
              <button onClick={() => setBrandColors(prev => prev.filter((_, idx) => idx !== i))} className="text-muted hover:text-red-500 text-sm ml-1">×</button>
            </div>
          ))}
          {brandColors.length === 0 && (
            <p className="text-sm text-muted">No colors added yet.</p>
          )}
        </div>

        {/* Add color form */}
        <div className="flex items-end gap-3 mb-8 bg-white border border-light rounded-xl p-4">
          <div>
            <label className="block text-xs font-medium text-dark mb-1">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
              />
              <input
                type="text"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                className="w-24 rounded-lg border border-light px-3 py-2 text-sm font-mono text-ink outline-none focus:ring-2 focus:ring-brand-orange"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-dark mb-1">Color name</label>
            <input
              type="text"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              placeholder="e.g. Primary Orange, Dark Navy"
              className="w-full rounded-lg border border-light px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-orange"
            />
          </div>
          <button
            onClick={() => {
              if (newColorHex) {
                setBrandColors(prev => [...prev, { hex: newColorHex, name: newColorName || newColorHex }]);
                setNewColorHex("#000000");
                setNewColorName("");
              }
            }}
            className="rounded-lg bg-brand-orange text-white px-4 py-2 text-sm font-semibold hover:bg-brand-orange-hover transition-colors shrink-0"
          >
            Add
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setStep(4)} className="rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold px-8 py-3 text-sm transition-colors">
            Continue →
          </button>
          <button onClick={() => setStep(4)} className="text-sm text-muted hover:text-brand-orange transition-colors">
            Skip for now →
          </button>
        </div>
      </div>
    );
  }

  function renderStep4() {
    return (
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl text-ink mb-1">How would you like to set up your brand strategy?</h2>
        <p className="text-muted text-sm mb-8">Choose one option below. You can change this later.</p>

        <div className="flex flex-col gap-3 mb-8">
          {STRATEGY_OPTIONS.map((opt) => {
            const selected = strategyMethod === opt.value;
            return (
              <div key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    setStrategyMethod(opt.value);
                    if (opt.value !== "paste") setStrategyText("");
                    if (opt.value !== "pdf") setStrategyFile(null);
                  }}
                  className={`w-full flex items-start gap-4 rounded-xl border p-5 text-left transition-all ${
                    selected
                      ? "border-brand-orange bg-brand-orange-pale"
                      : "border-light bg-white hover:border-muted"
                  }`}
                >
                  <span className="text-xl mt-0.5 shrink-0">{opt.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-ink">{opt.title}</div>
                    <div className="text-xs text-muted mt-0.5 leading-relaxed">{opt.desc}</div>
                  </div>
                </button>

                {/* Expandable: paste textarea */}
                {selected && opt.value === "paste" && (
                  <textarea
                    value={strategyText}
                    onChange={(e) => setStrategyText(e.target.value)}
                    rows={6}
                    placeholder="Paste your brand strategy here..."
                    className="mt-2 w-full rounded-xl border border-light bg-white px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-orange"
                  />
                )}

                {/* Expandable: pdf upload */}
                {selected && opt.value === "pdf" && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => strategyFileRef.current?.click()}
                      className="rounded-xl border border-dashed border-light bg-white px-4 py-3 text-sm text-muted hover:border-brand-orange transition-colors w-full text-center"
                    >
                      {strategyFile ? strategyFile.name : "Click to select a PDF file"}
                    </button>
                    <input
                      ref={strategyFileRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setStrategyFile(file);
                          setStrategyMethod("pdf");
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold px-8 py-3 text-sm transition-colors disabled:opacity-60"
        >
          {submitting ? "Creating workspace..." : "Create my workspace →"}
        </button>
      </div>
    );
  }

  function renderStep5() {
    return (
      <div className="flex flex-col items-center justify-center flex-1">
        {/* Dark hero card */}
        <div className="bg-[#0F0F0F] rounded-2xl px-10 py-12 flex flex-col items-center text-center mb-10 w-full max-w-md">
          {/* Logo mark */}
          <div className="w-12 h-12 rounded-lg bg-brand-orange flex items-center justify-center text-white font-display text-xl mb-6">
            B
          </div>
          <h2 className="font-display text-2xl text-white mb-2">
            Branditect for {brandName} is ready.
          </h2>
          <p className="text-sm text-[#888]">Your brand workspace has been created.</p>
        </div>

        {/* Module cards */}
        <div className="grid grid-cols-3 gap-3 max-w-2xl w-full mb-10">
          {MODULE_CARDS.map((mod) => (
            <div
              key={mod.title}
              className="rounded-xl border border-light bg-white p-5 flex flex-col items-start"
            >
              <span className="text-xl mb-2">{mod.icon}</span>
              <div className="text-sm font-semibold text-ink mb-0.5">{mod.title}</div>
              <div className="text-xs text-muted leading-relaxed">{mod.desc}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold px-10 py-3.5 text-sm transition-colors"
        >
          Open my workspace →
        </button>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Main render                                                      */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex h-screen bg-pale">
      {/* Left sidebar — step nav */}
      <aside className="w-72 bg-white border-r border-light flex flex-col shrink-0">
        <div className="px-6 pt-8 pb-6 border-b border-light">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-brand-orange flex items-center justify-center text-white font-display text-xs">
              B
            </div>
            <span className="font-display text-lg text-ink tracking-tight">Branditect</span>
          </div>
        </div>

        <nav className="flex-1 px-6 py-6">
          <ul className="space-y-5">
            {STEPS.map((s) => {
              const isActive = step === s.num;
              const isCompleted = step > s.num;
              return (
                <li key={s.num} className="flex items-start gap-3">
                  {/* Numbered circle */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5 ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-brand-orange text-white"
                        : "bg-light text-muted"
                    }`}
                  >
                    {isCompleted ? "✓" : s.num}
                  </div>
                  <div>
                    <div
                      className={`text-sm leading-tight ${
                        isActive ? "font-bold text-ink" : isCompleted ? "font-medium text-ink" : "text-muted"
                      }`}
                    >
                      {s.title}
                    </div>
                    <div className="text-xs text-muted mt-0.5">{s.subtitle}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Back button (steps 2-3 only) */}
        {step > 1 && step < 4 && (
          <div className="px-6 pb-6">
            <button
              onClick={() => setStep(step - 1)}
              className="text-sm text-muted hover:text-ink transition-colors"
            >
              ← Back
            </button>
          </div>
        )}
      </aside>

      {/* Right panel */}
      <main className="flex-1 overflow-y-auto p-10 flex flex-col">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </main>
    </div>
  );
}
