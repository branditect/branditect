"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Screen = "entry" | "category" | "questions" | "output";
type Category = "products" | "services";

interface QuestionDef {
  section: string;
  question: string;
  placeholder: string;
}

interface AttachedImage {
  base64: string;
  type: string;
  name: string;
}

/* ------------------------------------------------------------------ */
/*  Questions                                                          */
/* ------------------------------------------------------------------ */

const QUESTIONS: QuestionDef[] = [
  // Founding Vision (5)
  { section: "Founding Vision", question: "What is the founding story behind your brand? What moment or experience sparked it?", placeholder: "Tell us the origin story..." },
  { section: "Founding Vision", question: "What core problem does your brand exist to solve?", placeholder: "Describe the problem in one or two sentences..." },
  { section: "Founding Vision", question: "If your brand fully succeeds, what does the world look like in 10 years?", placeholder: "Paint the vision..." },
  { section: "Founding Vision", question: "What is your personal connection to this problem or space?", placeholder: "Why does this matter to you personally..." },
  { section: "Founding Vision", question: "Beyond profit, what is the deeper motivation driving this brand?", placeholder: "What keeps you going on hard days..." },

  // Your Offering (9)
  { section: "Your Offering", question: "Describe what you offer in exactly 7 words.", placeholder: "Seven words, no more, no less..." },
  { section: "Your Offering", question: "Now describe it in one full sentence.", placeholder: "One clear sentence..." },
  { section: "Your Offering", question: "Complete this: 'We are the first to...'", placeholder: "We are the first to..." },
  { section: "Your Offering", question: "Complete this: 'We are the only ones who...'", placeholder: "We are the only ones who..." },
  { section: "Your Offering", question: "Give your 30-second elevator pitch.", placeholder: "Imagine you're in a lift with your dream investor..." },
  { section: "Your Offering", question: "What are the unique features or capabilities of your offering?", placeholder: "List the features that matter most..." },
  { section: "Your Offering", question: "What is your single strongest competitive advantage?", placeholder: "The one thing nobody can match..." },
  { section: "Your Offering", question: "How does your delivery or experience differ from competitors?", placeholder: "Describe what feels different..." },
  { section: "Your Offering", question: "What are your non-negotiables — things you will never compromise on?", placeholder: "The lines you will not cross..." },

  // Competitive Landscape (4)
  { section: "Competitive Landscape", question: "Who are your top 3 competitors and what is each one's biggest weakness?", placeholder: "Competitor 1: ...\nCompetitor 2: ...\nCompetitor 3: ..." },
  { section: "Competitive Landscape", question: "What unique assets or capabilities do you have that competitors don't?", placeholder: "Your unfair advantages..." },
  { section: "Competitive Landscape", question: "What are the most common complaints customers have about your category?", placeholder: "The frustrations people have with existing options..." },
  { section: "Competitive Landscape", question: "How does your brand challenge the norms or conventions of your industry?", placeholder: "Where you break the rules..." },

  // Your Audience (5)
  { section: "Your Audience", question: "Describe your ideal customer in vivid detail — who are they, what do they care about?", placeholder: "Age, role, values, lifestyle, pain points..." },
  { section: "Your Audience", question: "What beliefs does your ideal customer already hold that make them receptive to your brand?", placeholder: "They already believe that..." },
  { section: "Your Audience", question: "Describe the before and after transformation your customer experiences.", placeholder: "Before: ...\nAfter: ..." },
  { section: "Your Audience", question: "Who is explicitly NOT your target customer? Who do you exclude?", placeholder: "We are not for people who..." },
  { section: "Your Audience", question: "What emotional benefits does your customer get beyond the functional ones?", placeholder: "They feel..." },

  // Brand Identity (7)
  { section: "Brand Identity", question: "What personality traits should your brand embody?", placeholder: "e.g. Bold, playful, intellectual, warm..." },
  { section: "Brand Identity", question: "Pick three adjectives that describe how your brand should feel.", placeholder: "Three words..." },
  { section: "Brand Identity", question: "What emotional response should someone have when they see your visual brand?", placeholder: "They should feel..." },
  { section: "Brand Identity", question: "How should your visual approach differ from others in your industry?", placeholder: "While others look ..., we look ..." },
  { section: "Brand Identity", question: "Name 2-3 brands (in any industry) whose identity or aesthetic inspires you and why.", placeholder: "Brand 1: ... because ...\nBrand 2: ... because ..." },
  { section: "Brand Identity", question: "If your brand were a person at a party, how would they behave?", placeholder: "They would be the one who..." },
  { section: "Brand Identity", question: "How would your brand-as-person dress?", placeholder: "Describe their style..." },

  // Brand Voice (5)
  { section: "Brand Voice", question: "How does your brand communicate — formal, casual, irreverent, authoritative?", placeholder: "Describe the communication style..." },
  { section: "Brand Voice", question: "What language or slang does your community use that your brand should speak?", placeholder: "Words, phrases, references they use..." },
  { section: "Brand Voice", question: "Write a sample social media post in your ideal brand voice.", placeholder: "Write an example post..." },
  { section: "Brand Voice", question: "What words or phrases should your brand NEVER use?", placeholder: "Banned words and why..." },
  { section: "Brand Voice", question: "How should the tone shift across channels (website vs social vs email vs support)?", placeholder: "Website: ...\nSocial: ...\nEmail: ...\nSupport: ..." },

  // Validation & Risks (3)
  { section: "Validation & Risks", question: "What evidence do you have that your brand or offering works? (testimonials, data, traction)", placeholder: "Share proof points..." },
  { section: "Validation & Risks", question: "Beyond revenue, what metrics define success for your brand?", placeholder: "Community size, NPS, cultural impact..." },
  { section: "Validation & Risks", question: "What are the primary challenges or risks your brand faces in the next 12 months?", placeholder: "The biggest threats..." },
];

const SECTIONS = Array.from(new Set(QUESTIONS.map((q) => q.section)));

const GENERATION_STAGES = [
  "Positioning framework",
  "Audience personas",
  "Messaging architecture",
  "Brand voice & tone",
  "Risks & opportunities",
];

/* ------------------------------------------------------------------ */
/*  Markdown parser                                                    */
/* ------------------------------------------------------------------ */

function parseMarkdown(md: string): string {
  let html = md
    // Escape HTML entities first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="my-6 border-t border-light" />');

  // Headings
  html = html.replace(
    /^#### (.+)$/gm,
    '<h4 class="text-base font-semibold text-dark mt-4 mb-2 font-sans">$1</h4>'
  );
  html = html.replace(
    /^### (.+)$/gm,
    '<h3 class="text-lg font-semibold text-brand-orange mt-5 mb-2 font-sans">$1</h3>'
  );
  html = html.replace(
    /^## (.+)$/gm,
    '<h2 class="text-xl font-bold text-ink mt-8 mb-3 font-sans">$1</h2>'
  );
  html = html.replace(
    /^# (.+)$/gm,
    '<h1 class="text-3xl font-display text-ink mb-6 pb-3 border-b-2 border-brand-orange">$1</h1>'
  );

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Process lists and paragraphs line by line
  const lines = html.split("\n");
  const processed: string[] = [];
  let inUl = false;
  let inOl = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bulletMatch = line.match(/^[\-\*] (.+)$/);
    const numberMatch = line.match(/^\d+\. (.+)$/);

    if (bulletMatch) {
      if (!inUl) {
        processed.push('<ul class="list-disc pl-6 space-y-1 my-3 text-dark">');
        inUl = true;
      }
      processed.push(`<li>${bulletMatch[1]}</li>`);
    } else if (numberMatch) {
      if (!inOl) {
        processed.push(
          '<ol class="list-decimal pl-6 space-y-1 my-3 text-dark">'
        );
        inOl = true;
      }
      processed.push(`<li>${numberMatch[1]}</li>`);
    } else {
      if (inUl) {
        processed.push("</ul>");
        inUl = false;
      }
      if (inOl) {
        processed.push("</ol>");
        inOl = false;
      }
      // Wrap plain text lines in paragraphs (skip empty lines and already-tagged lines)
      if (line.trim() && !line.trim().startsWith("<")) {
        processed.push(`<p class="my-2 text-dark leading-relaxed">${line}</p>`);
      } else if (line.trim().startsWith("<")) {
        processed.push(line);
      }
    }
  }
  if (inUl) processed.push("</ul>");
  if (inOl) processed.push("</ol>");

  return processed.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function BrandStrategyPage() {
  const [screen, setScreen] = useState<Screen>("entry");
  const [category, setCategory] = useState<Category | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [images, setImages] = useState<AttachedImage[]>([]);
  const [generatedStrategy, setGeneratedStrategy] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState(0);
  const [existingText, setExistingText] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on question change
  useEffect(() => {
    if (screen === "questions" && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentIndex, screen]);

  /* ---- helpers ---- */

  const questionKey = (q: QuestionDef) => `${q.section}|${q.question}`;

  const answeredCountForSection = (section: string) =>
    QUESTIONS.filter(
      (q) => q.section === section && answers[questionKey(q)]?.trim()
    ).length;

  const totalForSection = (section: string) =>
    QUESTIONS.filter((q) => q.section === section).length;

  const totalAnswered = Object.values(answers).filter((a) => a?.trim()).length;

  const currentQuestion = QUESTIONS[currentIndex];
  const currentSection = currentQuestion?.section;

  /* ---- image handling ---- */

  const handleImageAttach = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      Array.from(files).forEach((file) => {
        if (images.length >= 3) return;
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(",")[1];
          setImages((prev) => [
            ...prev.slice(0, 2),
            { base64, type: file.type, name: file.name },
          ]);
        };
        reader.readAsDataURL(file);
      });
      e.target.value = "";
    },
    [images.length]
  );

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  /* ---- generation ---- */

  const generate = async (fromExisting?: boolean) => {
    setIsGenerating(true);
    setGenerationStage(0);
    setError("");

    // Simulate stage progression
    const interval = setInterval(() => {
      setGenerationStage((prev) => {
        if (prev < GENERATION_STAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 3000);

    try {
      const payload: Record<string, unknown> = {
        answers,
        category: category || "general",
      };
      if (fromExisting && existingText.trim()) {
        payload.existingText = existingText;
      }
      if (images.length > 0) {
        payload.images = images.map((img) => ({
          base64: img.base64,
          type: img.type,
        }));
      }

      const res = await fetch("/api/brand-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setGeneratedStrategy(data.strategy);
      setScreen("output");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  /* ---- save ---- */

  const saveToSupabase = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase.from("brand_strategies").insert({
        brand_id: "vetra",
        user_id: user?.id || null,
        category,
        answers,
        generated_strategy: generatedStrategy,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save. Please try again.");
    }
  };

  /* ---- copy & download ---- */

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedStrategy);
  };

  const downloadMd = () => {
    const blob = new Blob([generatedStrategy], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "brand-strategy.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---- navigation ---- */

  const goToQuestionsBySection = (section: string) => {
    const idx = QUESTIONS.findIndex((q) => q.section === section);
    if (idx >= 0) setCurrentIndex(idx);
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="flex flex-col h-full">
      {/* Back link */}
      <div className="px-8 pt-6 pb-2">
        <Link
          href="/dashboard"
          className="text-sm text-muted hover:text-brand-orange transition-colors"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ---- ENTRY SCREEN ---- */}
      {screen === "entry" && (
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="max-w-3xl w-full space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-display text-ink mb-3">
                Brand Strategy
              </h1>
              <p className="text-lg text-muted font-sans">
                Build a comprehensive, AI-powered brand strategy document.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option A: paste existing */}
              <div className="rounded-2xl border border-light bg-pale p-6 space-y-4">
                <h2 className="text-lg font-bold text-ink font-sans">
                  I already have a brand strategy
                </h2>
                <p className="text-sm text-muted">
                  Paste your existing strategy and we will refine, restructure,
                  and strengthen it.
                </p>
                <textarea
                  value={existingText}
                  onChange={(e) => setExistingText(e.target.value)}
                  rows={6}
                  placeholder="Paste your existing strategy here..."
                  className="w-full rounded-xl border border-light bg-white px-4 py-3 text-sm text-dark placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent resize-none font-sans"
                />
                <button
                  onClick={() => generate(true)}
                  disabled={!existingText.trim()}
                  className="w-full rounded-xl bg-brand-orange text-white font-semibold py-3 text-sm hover:bg-brand-orange-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-sans"
                >
                  Generate Strategy
                </button>
              </div>

              {/* Option B: build from scratch */}
              <div className="rounded-2xl border border-light bg-pale p-6 space-y-4 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-ink font-sans">
                    Build from scratch
                  </h2>
                  <p className="text-sm text-muted mt-2">
                    Answer our guided questionnaire and we will craft a
                    comprehensive strategy from your answers.
                  </p>
                </div>
                <div>
                  <div className="text-xs text-muted mb-3 font-mono">
                    38 questions across 7 sections
                  </div>
                  <button
                    onClick={() => setScreen("category")}
                    className="w-full rounded-xl bg-brand-orange text-white font-semibold py-3 text-sm hover:bg-brand-orange-hover transition-colors font-sans"
                  >
                    Start Questionnaire
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- CATEGORY SCREEN ---- */}
      {screen === "category" && (
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="max-w-xl w-full space-y-8 text-center">
            <div>
              <h1 className="text-3xl font-display text-ink mb-3">
                What does your brand offer?
              </h1>
              <p className="text-muted font-sans">
                This helps us tailor the strategy framework.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setCategory("products");
                  setScreen("questions");
                }}
                className="rounded-2xl border-2 border-light bg-white p-8 hover:border-brand-orange hover:bg-brand-orange-pale transition-all group"
              >
                <div className="text-3xl mb-3">&#9634;</div>
                <div className="font-bold text-ink text-lg font-sans group-hover:text-brand-orange transition-colors">
                  Physical or Digital Products
                </div>
                <div className="text-sm text-muted mt-1 font-sans">
                  E-commerce, SaaS, apps, physical goods
                </div>
              </button>

              <button
                onClick={() => {
                  setCategory("services");
                  setScreen("questions");
                }}
                className="rounded-2xl border-2 border-light bg-white p-8 hover:border-brand-orange hover:bg-brand-orange-pale transition-all group"
              >
                <div className="text-3xl mb-3">&#9672;</div>
                <div className="font-bold text-ink text-lg font-sans group-hover:text-brand-orange transition-colors">
                  Services
                </div>
                <div className="text-sm text-muted mt-1 font-sans">
                  Consulting, agency, freelance, professional services
                </div>
              </button>
            </div>

            <button
              onClick={() => setScreen("entry")}
              className="text-sm text-muted hover:text-brand-orange transition-colors font-sans"
            >
              &larr; Go back
            </button>
          </div>
        </div>
      )}

      {/* ---- QUESTIONS SCREEN ---- */}
      {screen === "questions" && !isGenerating && (
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <aside className="w-72 border-r border-light bg-pale overflow-y-auto shrink-0 flex flex-col">
            <div className="p-5 space-y-1">
              <h2 className="text-sm font-bold text-ink font-sans uppercase tracking-wider mb-4">
                Sections
              </h2>
              {SECTIONS.map((section) => {
                const answered = answeredCountForSection(section);
                const total = totalForSection(section);
                const isActive = section === currentSection;
                return (
                  <button
                    key={section}
                    onClick={() => goToQuestionsBySection(section)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-sans transition-colors ${
                      isActive
                        ? "bg-brand-orange-pale text-brand-orange font-semibold"
                        : "text-dark hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{section}</span>
                      <span
                        className={`text-xs font-mono ${
                          answered === total
                            ? "text-green-600"
                            : "text-muted"
                        }`}
                      >
                        {answered}/{total}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-1.5 h-1 rounded-full bg-light overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-orange transition-all duration-300"
                        style={{
                          width: `${total > 0 ? (answered / total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto p-5 border-t border-light space-y-3">
              <div className="text-xs text-muted font-mono">
                {totalAnswered} / {QUESTIONS.length} answered
              </div>
              <button
                onClick={() => generate(false)}
                disabled={totalAnswered < 1}
                className="w-full rounded-xl bg-brand-orange text-white font-semibold py-2.5 text-sm hover:bg-brand-orange-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-sans"
              >
                Generate Strategy Now
              </button>
            </div>
          </aside>

          {/* Main question area */}
          <div className="flex-1 flex flex-col p-8 overflow-y-auto">
            <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col">
              {/* Section & progress */}
              <div className="mb-2">
                <span className="text-xs font-mono text-brand-orange uppercase tracking-wider">
                  {currentSection}
                </span>
                <span className="text-xs text-muted ml-3 font-mono">
                  Question {currentIndex + 1} of {QUESTIONS.length}
                </span>
              </div>

              {/* Overall progress bar */}
              <div className="h-1 rounded-full bg-light mb-8 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-orange transition-all duration-300"
                  style={{
                    width: `${((currentIndex + 1) / QUESTIONS.length) * 100}%`,
                  }}
                />
              </div>

              {/* Question */}
              <h2 className="text-2xl font-display text-ink mb-6 leading-snug">
                {currentQuestion.question}
              </h2>

              {/* Answer textarea */}
              <textarea
                ref={textareaRef}
                value={answers[questionKey(currentQuestion)] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [questionKey(currentQuestion)]: e.target.value,
                  }))
                }
                rows={6}
                placeholder={currentQuestion.placeholder}
                className="w-full rounded-xl border border-light bg-white px-5 py-4 text-base text-dark placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent resize-none font-sans leading-relaxed"
              />

              {/* Image attachments */}
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleImageAttach}
                  disabled={images.length >= 3}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-light text-sm text-muted hover:text-brand-orange hover:border-brand-orange transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-sans"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Attach Image ({images.length}/3)
                </button>
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-orange-pale text-sm text-dark font-sans"
                  >
                    <span className="truncate max-w-[120px]">{img.name}</span>
                    <button
                      onClick={() => removeImage(idx)}
                      className="text-muted hover:text-brand-orange transition-colors ml-1"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>

              {/* Error display */}
              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-sans">
                  {error}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-light">
                <button
                  onClick={() => {
                    if (currentIndex === 0) {
                      setScreen("category");
                    } else {
                      setCurrentIndex((p) => p - 1);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl border border-light text-sm font-semibold text-dark hover:bg-pale transition-colors font-sans"
                >
                  Back
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (currentIndex < QUESTIONS.length - 1) {
                        setCurrentIndex((p) => p + 1);
                      }
                    }}
                    disabled={currentIndex >= QUESTIONS.length - 1}
                    className="px-5 py-2.5 rounded-xl text-sm text-muted hover:text-dark transition-colors disabled:opacity-30 font-sans"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => {
                      if (currentIndex < QUESTIONS.length - 1) {
                        setCurrentIndex((p) => p + 1);
                      } else {
                        generate(false);
                      }
                    }}
                    className="px-6 py-2.5 rounded-xl bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange-hover transition-colors font-sans"
                  >
                    {currentIndex < QUESTIONS.length - 1
                      ? "Next"
                      : "Generate Strategy"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- GENERATING STATE ---- */}
      {screen === "questions" && isGenerating && (
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="max-w-md w-full space-y-8 text-center">
            <div>
              <h2 className="text-2xl font-display text-ink mb-2">
                Crafting your brand strategy
              </h2>
              <p className="text-muted font-sans">
                Synthesizing {totalAnswered} answers into a comprehensive
                strategy...
              </p>
            </div>

            {/* Progress stages */}
            <div className="space-y-3 text-left">
              {GENERATION_STAGES.map((stage, idx) => (
                <div key={stage} className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-mono transition-colors ${
                      idx < generationStage
                        ? "bg-green-500 text-white"
                        : idx === generationStage
                          ? "bg-brand-orange text-white animate-pulse"
                          : "bg-light text-muted"
                    }`}
                  >
                    {idx < generationStage ? (
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`text-sm font-sans ${
                      idx <= generationStage ? "text-ink" : "text-muted"
                    }`}
                  >
                    {stage}
                  </span>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-light overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-orange transition-all duration-1000 ease-out"
                style={{
                  width: `${((generationStage + 1) / GENERATION_STAGES.length) * 100}%`,
                }}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-sans">
                {error}
                <button
                  onClick={() => {
                    setError("");
                    setIsGenerating(false);
                  }}
                  className="block mt-2 text-brand-orange hover:underline"
                >
                  Go back to questions
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- OUTPUT SCREEN ---- */}
      {screen === "output" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sticky top bar */}
          <div className="sticky top-0 z-10 bg-white border-b border-light px-8 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setScreen("questions");
                  setCurrentIndex(0);
                }}
                className="px-4 py-2 rounded-lg border border-light text-sm font-semibold text-dark hover:bg-pale transition-colors font-sans"
              >
                Edit Answers
              </button>
              <button
                onClick={() => generate(false)}
                className="px-4 py-2 rounded-lg border border-light text-sm font-semibold text-dark hover:bg-pale transition-colors font-sans"
              >
                Regenerate
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 rounded-lg border border-light text-sm font-semibold text-dark hover:bg-pale transition-colors font-sans"
              >
                Copy
              </button>
              <button
                onClick={downloadMd}
                className="px-4 py-2 rounded-lg border border-light text-sm font-semibold text-dark hover:bg-pale transition-colors font-sans"
              >
                Download .md
              </button>
              <button
                onClick={saveToSupabase}
                disabled={saved}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors font-sans ${
                  saved
                    ? "bg-green-500 text-white"
                    : "bg-brand-orange text-white hover:bg-brand-orange-hover"
                }`}
              >
                {saved ? "Saved \u2713" : "Save to Branditect"}
              </button>
            </div>
          </div>

          {/* Strategy content */}
          <div className="flex-1 overflow-y-auto px-8 py-10">
            <div className="max-w-3xl mx-auto">
              <div
                className="prose-custom font-sans text-dark leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: parseMarkdown(generatedStrategy),
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
