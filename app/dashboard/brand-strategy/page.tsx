"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Screen = "entry" | "category" | "questions" | "output" | "view";
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

interface StrategySection {
  title: string;
  content: string;
  preview: string;
}

interface StrategyRecord {
  id: string;
  brand_id: string;
  user_id: string | null;
  category: string | null;
  answers: Record<string, string>;
  generated_strategy: string;
  created_at: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface BrandStrategy {
  brandName: string;
  category: string;
  stage: string;
  target: string;
  archetype: string;
  passport: {
    signature: string;
    purpose: string;
    promise: string;
    philosophy: string;
    values: string;
    insight: string;
    targetGroup: string;
    onlyWeClaim: string;
  };
  pyramid: {
    essence: string;
    behavior: string;
    whyChooseUs: string;
    audience: string;
    market: string;
    context: string;
  };
  problems: { title: string; text: string }[];
  solution: string;
  firstTo: { claim: string; explanation: string };
  onlyOnesWho: { claim: string; explanation: string };
  differentiators: { label: string; title: string; text: string }[];
  personas: {
    name: string;
    role: string;
    type: string;
    emoji: string;
    who: string;
    wants: string;
    frustrations: string;
    channels: string[];
    activeChannels: string[];
    brandGives: string;
  }[];
  exclusions: string;
  competitiveIntro: string;
  competitors: {
    name: string;
    type: string;
    doWell: string;
    fail: string;
    vsUs: string;
    isUs: boolean;
  }[];
  messagingPillars: { title: string; text: string }[];
  channelMessages: {
    linkedin: { format: string; pillar: string; body: string }[];
    email: { format: string; tone: string; body: string }[];
    ads: { format: string; pillar: string; body: string }[];
    website: { format: string; body: string }[];
    sales: { format: string; persona: string; body: string }[];
  };
  voiceDescription: string;
  voiceDoDont: { do: string; dont: string }[];
  alwaysUse: string[];
  neverUse: string[];
  risks: { title: string; text: string }[];
  opportunities: { title: string; text: string }[];
  taglines: { text: string; rationale: string }[];
}
/* eslint-enable @typescript-eslint/no-explicit-any */

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

const VIEW_SECTION_TITLES = [
  "Brand Positioning",
  "Target Audience",
  "Competitive Landscape",
  "Brand Identity System",
  "Messaging Architecture",
  "Brand Voice & Tone",
  "Brand Architecture",
  "Risks & Opportunities",
  "Brand Governance",
];

/* ------------------------------------------------------------------ */
/*  Markdown parser (original — used for output screen)                */
/* ------------------------------------------------------------------ */

function parseMarkdown(md: string): string {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/^---$/gm, '<hr class="my-6 border-t border-light" />');

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

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

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
/*  View-screen markdown parser (legacy fallback)                      */
/* ------------------------------------------------------------------ */

function parseViewMarkdown(md: string): string {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="my-6 border-t border-light" />');

  // ### Heading -> styled label
  html = html.replace(
    /^### (.+)$/gm,
    '<div class="font-mono text-[0.6rem] tracking-wider uppercase text-brand-orange mb-2">$1</div>'
  );

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

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
        processed.push('<ul class="list-disc pl-5 space-y-1.5 my-3 text-[0.82rem] text-dark leading-[1.8]">');
        inUl = true;
      }
      processed.push(`<li>${bulletMatch[1]}</li>`);
    } else if (numberMatch) {
      if (!inOl) {
        processed.push('<ol class="list-decimal pl-5 space-y-1.5 my-3 text-[0.82rem] text-dark leading-[1.8]">');
        inOl = true;
      }
      processed.push(`<li>${numberMatch[1]}</li>`);
    } else {
      if (inUl) { processed.push("</ul>"); inUl = false; }
      if (inOl) { processed.push("</ol>"); inOl = false; }
      if (line.trim() && !line.trim().startsWith("<")) {
        processed.push(`<p class="text-[0.82rem] text-dark leading-[1.8] mb-4">${line}</p>`);
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
/*  Parse strategy into sections (legacy fallback)                     */
/* ------------------------------------------------------------------ */

function parseStrategySections(markdown: string): StrategySection[] {
  const parts = markdown.split(/^## /m);
  const sections: StrategySection[] = [];

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const newlineIdx = part.indexOf("\n");
    const title = newlineIdx >= 0 ? part.substring(0, newlineIdx).trim() : part.trim();
    const content = newlineIdx >= 0 ? part.substring(newlineIdx + 1).trim() : "";
    const preview = content
      .replace(/^###.+$/gm, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/^[\-\*] /gm, "")
      .replace(/^\d+\. /gm, "")
      .replace(/\n+/g, " ")
      .trim()
      .substring(0, 120);
    sections.push({ title, content, preview: preview + (preview.length >= 120 ? "..." : "") });
  }

  return sections;
}

/* ------------------------------------------------------------------ */
/*  Rebuild full markdown from sections (legacy)                       */
/* ------------------------------------------------------------------ */

function rebuildMarkdown(sections: StrategySection[], originalMarkdown: string): string {
  const firstH2 = originalMarkdown.indexOf("\n## ");
  const header = firstH2 >= 0 ? originalMarkdown.substring(0, firstH2 + 1) : "";
  const sectionStrings = sections.map((s) => `## ${s.title}\n${s.content}`);
  return header + sectionStrings.join("\n\n");
}

/* ------------------------------------------------------------------ */
/*  Try parsing strategy as JSON                                       */
/* ------------------------------------------------------------------ */

function tryParseStrategyJSON(raw: string): BrandStrategy | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.brandName) {
      return parsed as BrandStrategy;
    }
    return null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Channel tab keys                                                   */
/* ------------------------------------------------------------------ */

const CHANNEL_TABS = [
  { key: "linkedin", label: "LinkedIn" },
  { key: "email", label: "Email" },
  { key: "ads", label: "Ads" },
  { key: "website", label: "Website" },
  { key: "sales", label: "Sales" },
] as const;

type ChannelKey = (typeof CHANNEL_TABS)[number]["key"];

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

  // View screen state
  const [strategyRecord, setStrategyRecord] = useState<StrategyRecord | null>(null);
  const [strategySections, setStrategySections] = useState<StrategySection[]>([]);
  const [openSectionIdx, setOpenSectionIdx] = useState<number | null>(null);
  const [editModalIdx, setEditModalIdx] = useState<number | null>(null);
  const [editModalContent, setEditModalContent] = useState("");
  const [showRedoModal, setShowRedoModal] = useState(false);
  const [loadingStrategy, setLoadingStrategy] = useState(true);

  // JSON view state
  const [activeChannelTab, setActiveChannelTab] = useState<ChannelKey>("linkedin");

  // Load existing strategy on mount
  useEffect(() => {
    const loadStrategy = async () => {
      try {
        const { data } = await supabase
          .from("brand_strategies")
          .select("*")
          .eq("brand_id", "vetra")
          .order("created_at", { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          const record = data[0] as StrategyRecord;
          setStrategyRecord(record);
          const sections = parseStrategySections(record.generated_strategy);
          setStrategySections(sections);
          setGeneratedStrategy(record.generated_strategy);
          setScreen("view");
        }
      } catch {
        // No existing strategy, stay on entry screen
      } finally {
        setLoadingStrategy(false);
      }
    };
    loadStrategy();
  }, []);

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
    setScreen("questions"); // show generating overlay on the questions screen

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
        // Truncate to ~15000 chars to stay within API limits
        payload.existingText = existingText.slice(0, 15000);
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

      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`Server error: ${responseText.slice(0, 150)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setGeneratedStrategy(data.strategy);

      // Auto-save to Supabase and go straight to view
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: saved } = await supabase.from("brand_strategies").insert({
          brand_id: "vetra",
          user_id: user?.id || null,
          category: category || "general",
          answers,
          generated_strategy: data.strategy,
        }).select();

        if (saved && saved.length > 0) {
          const record = saved[0] as StrategyRecord;
          setStrategyRecord(record);
          const sections = parseStrategySections(record.generated_strategy);
          setStrategySections(sections);
          setScreen("view");
        } else {
          setScreen("output");
        }
      } catch {
        // Save failed, fall back to output screen
        setScreen("output");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setScreen("entry");
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
      const { data } = await supabase.from("brand_strategies").insert({
        brand_id: "vetra",
        user_id: user?.id || null,
        category,
        answers,
        generated_strategy: generatedStrategy,
      }).select();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      // After saving, switch to view screen
      if (data && data.length > 0) {
        const record = data[0] as StrategyRecord;
        setStrategyRecord(record);
        const sections = parseStrategySections(record.generated_strategy);
        setStrategySections(sections);
        setScreen("view");
      }
    } catch {
      setError("Failed to save. Please try again.");
    }
  };

  /* ---- save section edit ---- */

  const saveSectionEdit = useCallback(async () => {
    if (editModalIdx === null || !strategyRecord) return;

    const updatedSections = [...strategySections];
    const updatedContent = editModalContent;
    const preview = updatedContent
      .replace(/^###.+$/gm, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/^[\-\*] /gm, "")
      .replace(/^\d+\. /gm, "")
      .replace(/\n+/g, " ")
      .trim()
      .substring(0, 120);
    updatedSections[editModalIdx] = {
      ...updatedSections[editModalIdx],
      content: updatedContent,
      preview: preview + (preview.length >= 120 ? "..." : ""),
    };

    const newMarkdown = rebuildMarkdown(updatedSections, generatedStrategy);

    try {
      await supabase
        .from("brand_strategies")
        .update({ generated_strategy: newMarkdown })
        .eq("id", strategyRecord.id);

      setStrategySections(updatedSections);
      setGeneratedStrategy(newMarkdown);
      setStrategyRecord({ ...strategyRecord, generated_strategy: newMarkdown });
      setEditModalIdx(null);
    } catch {
      setError("Failed to save changes. Please try again.");
    }
  }, [editModalIdx, editModalContent, strategySections, strategyRecord, generatedStrategy]);

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

  const downloadJSON = () => {
    const parsed = tryParseStrategyJSON(generatedStrategy);
    const content = parsed
      ? JSON.stringify(parsed, null, 2)
      : generatedStrategy;
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${parsed?.brandName || "brand"}-strategy.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---- navigation ---- */

  const goToQuestionsBySection = (section: string) => {
    const idx = QUESTIONS.findIndex((q) => q.section === section);
    if (idx >= 0) setCurrentIndex(idx);
  };

  /* ---- format date ---- */

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  // Loading state
  if (loadingStrategy) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Try parsing JSON for the view screen
  const strategyJSON: BrandStrategy | null = strategyRecord
    ? tryParseStrategyJSON(strategyRecord.generated_strategy)
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Back link */}
      {screen !== "view" && (
        <div className="px-8 pt-6 pb-2">
          <Link
            href="/dashboard"
            className="text-sm text-muted hover:text-brand-orange transition-colors"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      )}

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

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                {error}
              </div>
            )}

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
              <div className="mb-2">
                <span className="text-xs font-mono text-brand-orange uppercase tracking-wider">
                  {currentSection}
                </span>
                <span className="text-xs text-muted ml-3 font-mono">
                  Question {currentIndex + 1} of {QUESTIONS.length}
                </span>
              </div>

              <div className="h-1 rounded-full bg-light mb-8 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-orange transition-all duration-300"
                  style={{
                    width: `${((currentIndex + 1) / QUESTIONS.length) * 100}%`,
                  }}
                />
              </div>

              <h2 className="text-2xl font-display text-ink mb-6 leading-snug">
                {currentQuestion.question}
              </h2>

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

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-sans">
                  {error}
                </div>
              )}

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

      {/* ---- VIEW SCREEN ---- */}
      {screen === "view" && (
        <div className="flex-1 overflow-y-auto">

          {/* ============================================================ */}
          {/*  JSON-based rich view                                         */}
          {/* ============================================================ */}
          {strategyJSON ? (
            <div className="max-w-[960px] mx-auto px-8 py-10 space-y-10">

              {/* ---------- Topbar ---------- */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-[0.68rem] font-bold px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Complete
                  </span>
                  {strategyRecord && (
                    <span className="text-[0.75rem] text-muted">
                      Last updated {formatDate(strategyRecord.created_at)}
                    </span>
                  )}
                </div>

                <h1 className="text-[2.5rem] font-display text-ink mb-3 leading-tight">
                  {strategyJSON.brandName} &mdash; Brand Strategy
                </h1>

                <p className="text-[0.88rem] text-[#6B6B6B] leading-relaxed max-w-[720px] mb-5">
                  {strategyJSON.passport.purpose}
                </p>

                {/* Meta row */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-[0.75rem]">
                  <div>
                    <span className="font-mono text-[0.65rem] uppercase tracking-wider text-[#9A9A9A]">Category</span>
                    <div className="text-[#1A1A1A] font-medium mt-0.5">{strategyJSON.category}</div>
                  </div>
                  <div>
                    <span className="font-mono text-[0.65rem] uppercase tracking-wider text-[#9A9A9A]">Stage</span>
                    <div className="text-[#1A1A1A] font-medium mt-0.5">{strategyJSON.stage}</div>
                  </div>
                  <div>
                    <span className="font-mono text-[0.65rem] uppercase tracking-wider text-[#9A9A9A]">Target</span>
                    <div className="text-[#1A1A1A] font-medium mt-0.5">{strategyJSON.target}</div>
                  </div>
                  <div>
                    <span className="font-mono text-[0.65rem] uppercase tracking-wider text-[#9A9A9A]">Archetype</span>
                    <div className="text-[#1A1A1A] font-medium mt-0.5">{strategyJSON.archetype}</div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={downloadJSON}
                    className="border border-[#E5E5E5] rounded-[7px] px-3.5 py-2 text-[0.76rem] font-medium text-[#2D2D2D] hover:border-[#E8562A] hover:text-[#E8562A] transition-colors"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => setShowRedoModal(true)}
                    className="border border-[#E5E5E5] rounded-[7px] px-3.5 py-2 text-[0.76rem] font-medium text-[#2D2D2D] hover:border-[#E8562A] hover:text-[#E8562A] transition-colors"
                  >
                    Re-do brand strategy
                  </button>
                </div>
              </div>

              {/* ---------- Brand Passport ---------- */}
              <section>
                <div className="bg-[#0F0F0F] rounded-2xl p-8 text-white">
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-[#9A9A9A]">Brand Passport</span>
                    <span className="text-[0.82rem] font-display text-white/80">{strategyJSON.brandName}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5 mb-6">
                    {([
                      ["Signature", strategyJSON.passport.signature],
                      ["Purpose", strategyJSON.passport.purpose],
                      ["Promise", strategyJSON.passport.promise],
                      ["Philosophy", strategyJSON.passport.philosophy],
                      ["Values", strategyJSON.passport.values],
                      ["Insight", strategyJSON.passport.insight],
                    ] as const).map(([label, value]) => (
                      <div key={label}>
                        <div className="font-mono text-[0.6rem] uppercase tracking-wider text-[#9A9A9A] mb-1">{label}</div>
                        <div className="text-[0.82rem] text-white/90 leading-relaxed">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/10 pt-5 space-y-4">
                    <div>
                      <div className="font-mono text-[0.6rem] uppercase tracking-wider text-[#9A9A9A] mb-1">Target Group</div>
                      <div className="text-[0.82rem] text-white/90 leading-relaxed">{strategyJSON.passport.targetGroup}</div>
                    </div>
                    <div>
                      <div className="font-mono text-[0.6rem] uppercase tracking-wider text-[#E8562A] mb-1">Only-We Claim</div>
                      <div className="text-[0.88rem] text-[#E8562A] font-semibold leading-relaxed">{strategyJSON.passport.onlyWeClaim}</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ---------- Brand Pyramid ---------- */}
              <section>
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-[#9A9A9A] mb-3">Brand Pyramid</div>
                <div className="bg-[#1A1A1A] rounded-2xl py-10 px-6 flex flex-col items-center gap-3">
                  {([
                    { label: "Essence", value: strategyJSON.pyramid.essence, maxW: "260px", bg: "#E8562A", text: "white" },
                    { label: "Behavior", value: strategyJSON.pyramid.behavior, maxW: "390px", bg: "#C44A24", text: "white" },
                    { label: "Why Choose Us", value: strategyJSON.pyramid.whyChooseUs, maxW: "530px", bg: "#3D3D3D", text: "white" },
                    { label: "Audience", value: strategyJSON.pyramid.audience, maxW: "650px", bg: "#2D2D2D", text: "#E5E5E5" },
                    { label: "Market", value: strategyJSON.pyramid.market, maxW: "760px", bg: "#252525", text: "#9A9A9A" },
                    { label: "Context", value: strategyJSON.pyramid.context, maxW: "860px", bg: "#1F1F1F", text: "#9A9A9A" },
                  ] as const).map((tier) => (
                    <div
                      key={tier.label}
                      className="w-full rounded-xl px-5 py-4 text-center"
                      style={{ maxWidth: tier.maxW, backgroundColor: tier.bg, color: tier.text }}
                    >
                      <div className="font-mono text-[0.58rem] uppercase tracking-wider opacity-70 mb-1">{tier.label}</div>
                      <div className="text-[0.8rem] leading-relaxed">{tier.value}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ---------- Problems & Solution ---------- */}
              <section>
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-[#9A9A9A] mb-3">Problems We Solve</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  {strategyJSON.problems.map((p, i) => (
                    <div key={i} className="bg-white border border-[#E5E5E5] rounded-xl p-5">
                      <div className="text-[0.82rem] font-semibold text-[#1A1A1A] mb-2">{p.title}</div>
                      <div className="text-[0.78rem] text-[#6B6B6B] leading-relaxed">{p.text}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-[#FFF2EE] border border-[#FDDDD4] rounded-xl p-6">
                  <div className="font-mono text-[0.6rem] uppercase tracking-wider text-[#E8562A] mb-2">Our Solution</div>
                  <div className="text-[0.85rem] text-[#1A1A1A] leading-relaxed">{strategyJSON.solution}</div>
                </div>
              </section>

              {/* ---------- What Makes Us Different ---------- */}
              <section>
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-[#9A9A9A] mb-3">What Makes Us Different</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div className="bg-[#FFF2EE] border border-[#FDDDD4] rounded-xl p-5">
                    <div className="font-mono text-[0.6rem] uppercase tracking-wider text-[#E8562A] mb-2">First To</div>
                    <div className="text-[0.85rem] font-semibold text-[#1A1A1A] mb-1">{strategyJSON.firstTo.claim}</div>
                    <div className="text-[0.78rem] text-[#6B6B6B] leading-relaxed">{strategyJSON.firstTo.explanation}</div>
                  </div>
                  <div className="bg-[#FFF2EE] border border-[#FDDDD4] rounded-xl p-5">
                    <div className="font-mono text-[0.6rem] uppercase tracking-wider text-[#E8562A] mb-2">Only Ones Who</div>
                    <div className="text-[0.85rem] font-semibold text-[#1A1A1A] mb-1">{strategyJSON.onlyOnesWho.claim}</div>
                    <div className="text-[0.78rem] text-[#6B6B6B] leading-relaxed">{strategyJSON.onlyOnesWho.explanation}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {strategyJSON.differentiators.map((d, i) => (
                    <div key={i} className="bg-white border border-[#E5E5E5] rounded-xl p-5">
                      <div className="font-mono text-[0.6rem] uppercase tracking-wider text-[#9A9A9A] mb-1">{d.label}</div>
                      <div className="text-[0.82rem] font-semibold text-[#1A1A1A] mb-2">{d.title}</div>
                      <div className="text-[0.78rem] text-[#6B6B6B] leading-relaxed">{d.text}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ---------- Target Audience ---------- */}
              <section>
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-[#9A9A9A] mb-3">Target Audience</div>
                <div className="space-y-4 mb-5">
                  {strategyJSON.personas.map((p, i) => (
                    <div key={i} className="bg-white border border-[#E5E5E5] rounded-xl p-6">
                      {/* Persona header */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center text-xl">{p.emoji}</div>
                        <div>
                          <div className="text-[0.88rem] font-semibold text-[#1A1A1A]">{p.name}</div>
                          <div className="text-[0.75rem] text-[#6B6B6B]">{p.role}</div>
                        </div>
                        <span className={`ml-auto text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          p.type === "primary"
                            ? "bg-[#FFF2EE] text-[#E8562A]"
                            : "bg-[#F5F5F5] text-[#6B6B6B]"
                        }`}>{p.type}</span>
                      </div>
                      {/* Persona body — 2-column grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div>
                          <div className="font-mono text-[0.6rem] uppercase tracking-wider text-[#9A9A9A] mb-1">Who</div>
                          <div className="text-[0.78rem] text-[#2D2D2D] leading-relaxed">{p.who}</div>
                        </div>
                        <div>
                          <div className="font-mono text-[0.6rem] uppercase tracking-wider text-[#9A9A9A] mb-1">Wants</div>
                          <div className="text-[0.78rem] text-[#2D2D2D] leading-relaxed">{p.wants}</div>
                        </div>
                        <div>
                          <div className="font-mono text-[0.6rem] uppercase tracking-wider text-[#9A9A9A] mb-1">Frustrations</div>
                          <div className="text-[0.78rem] text-[#2D2D2D] leading-relaxed">{p.frustrations}</div>
                        </div>
                        <div>
                          <div className="font-mono text-[0.6rem] uppercase tracking-wider text-[#9A9A9A] mb-1">Channels</div>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {p.channels.map((ch, ci) => (
                              <span key={ci} className={`text-[0.68rem] px-2 py-0.5 rounded-full ${
                                p.activeChannels.includes(ch)
                                  ? "bg-[#FFF2EE] text-[#E8562A] font-semibold"
                                  : "bg-[#F5F5F5] text-[#6B6B6B]"
                              }`}>{ch}</span>
                            ))}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="font-mono text-[0.6rem] uppercase tracking-wider text-[#9A9A9A] mb-1">Brand Gives</div>
                          <div className="text-[0.78rem] text-[#2D2D2D] leading-relaxed">{p.brandGives}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Exclusions */}
                <div className="border-2 border-dashed border-[#E5E5E5] rounded-xl p-5">
                  <div className="font-mono text-[0.6rem] uppercase tracking-wider text-[#9A9A9A] mb-2">Who We Are NOT For</div>
                  <div className="text-[0.82rem] text-[#6B6B6B] leading-relaxed">{strategyJSON.exclusions}</div>
                </div>
              </section>

              {/* ---------- Competitive Landscape ---------- */}
              <section>
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-[#9A9A9A] mb-3">Competitive Landscape</div>
                <p className="text-[0.85rem] text-[#2D2D2D] leading-relaxed mb-5">{strategyJSON.competitiveIntro}</p>
                <div className="overflow-x-auto rounded-xl border border-[#E5E5E5]">
                  <table className="w-full text-[0.78rem]">
                    <thead>
                      <tr className="bg-[#F5F5F5] text-left">
                        <th className="px-4 py-3 font-semibold text-[#1A1A1A]">Competitor</th>
                        <th className="px-4 py-3 font-semibold text-[#1A1A1A]">Type</th>
                        <th className="px-4 py-3 font-semibold text-[#1A1A1A]">Strengths</th>
                        <th className="px-4 py-3 font-semibold text-[#1A1A1A]">Weaknesses</th>
                        <th className="px-4 py-3 font-semibold text-[#1A1A1A]">vs Us</th>
                      </tr>
                    </thead>
                    <tbody>
                      {strategyJSON.competitors.map((c, i) => (
                        <tr key={i} className={`border-t border-[#E5E5E5] ${c.isUs ? "bg-[#FFF2EE]" : "bg-white"}`}>
                          <td className="px-4 py-3 font-medium text-[#1A1A1A]">
                            {c.name}
                            {c.isUs && <span className="ml-1.5 text-[0.6rem] font-bold text-[#E8562A] uppercase">(Us)</span>}
                          </td>
                          <td className="px-4 py-3 text-[#6B6B6B]">{c.type}</td>
                          <td className="px-4 py-3 text-[#2D2D2D]">{c.doWell}</td>
                          <td className="px-4 py-3 text-[#2D2D2D]">{c.fail}</td>
                          <td className="px-4 py-3 text-[#2D2D2D]">{c.vsUs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ---------- Messaging Architecture ---------- */}
              <section>
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-[#9A9A9A] mb-3">Messaging Architecture</div>
                {/* Pillars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {strategyJSON.messagingPillars.map((p, i) => (
                    <div key={i} className="bg-white border border-[#E5E5E5] rounded-xl p-5 border-t-[3px] border-t-[#E8562A]">
                      <div className="text-[0.82rem] font-semibold text-[#1A1A1A] mb-2">{p.title}</div>
                      <div className="text-[0.78rem] text-[#6B6B6B] leading-relaxed">{p.text}</div>
                    </div>
                  ))}
                </div>
                {/* Channel tabs */}
                <div className="border border-[#E5E5E5] rounded-xl overflow-hidden">
                  <div className="flex border-b border-[#E5E5E5] bg-[#F5F5F5]">
                    {CHANNEL_TABS.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveChannelTab(tab.key)}
                        className={`px-5 py-3 text-[0.78rem] font-medium transition-colors ${
                          activeChannelTab === tab.key
                            ? "bg-white text-[#E8562A] border-b-2 border-b-[#E8562A] -mb-px"
                            : "text-[#6B6B6B] hover:text-[#1A1A1A]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-5 space-y-4">
                    {activeChannelTab === "linkedin" && strategyJSON.channelMessages.linkedin?.map((m, i) => (
                      <div key={i} className="bg-[#F5F5F5] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-[0.6rem] uppercase tracking-wider text-[#9A9A9A]">{m.format}</span>
                          <span className="text-[0.6rem] text-[#E8562A]">{m.pillar}</span>
                        </div>
                        <div className="text-[0.78rem] text-[#2D2D2D] leading-relaxed whitespace-pre-wrap">{m.body}</div>
                      </div>
                    ))}
                    {activeChannelTab === "email" && strategyJSON.channelMessages.email?.map((m, i) => (
                      <div key={i} className="bg-[#F5F5F5] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-[0.6rem] uppercase tracking-wider text-[#9A9A9A]">{m.format}</span>
                          <span className="text-[0.6rem] text-[#6B6B6B]">{m.tone}</span>
                        </div>
                        <div className="text-[0.78rem] text-[#2D2D2D] leading-relaxed whitespace-pre-wrap">{m.body}</div>
                      </div>
                    ))}
                    {activeChannelTab === "ads" && strategyJSON.channelMessages.ads?.map((m, i) => (
                      <div key={i} className="bg-[#F5F5F5] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-[0.6rem] uppercase tracking-wider text-[#9A9A9A]">{m.format}</span>
                          <span className="text-[0.6rem] text-[#E8562A]">{m.pillar}</span>
                        </div>
                        <div className="text-[0.78rem] text-[#2D2D2D] leading-relaxed whitespace-pre-wrap">{m.body}</div>
                      </div>
                    ))}
                    {activeChannelTab === "website" && strategyJSON.channelMessages.website?.map((m, i) => (
                      <div key={i} className="bg-[#F5F5F5] rounded-lg p-4">
                        <div className="mb-2">
                          <span className="font-mono text-[0.6rem] uppercase tracking-wider text-[#9A9A9A]">{m.format}</span>
                        </div>
                        <div className="text-[0.78rem] text-[#2D2D2D] leading-relaxed whitespace-pre-wrap">{m.body}</div>
                      </div>
                    ))}
                    {activeChannelTab === "sales" && strategyJSON.channelMessages.sales?.map((m, i) => (
                      <div key={i} className="bg-[#F5F5F5] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-[0.6rem] uppercase tracking-wider text-[#9A9A9A]">{m.format}</span>
                          <span className="text-[0.6rem] text-[#6B6B6B]">{m.persona}</span>
                        </div>
                        <div className="text-[0.78rem] text-[#2D2D2D] leading-relaxed whitespace-pre-wrap">{m.body}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* ---------- Brand Voice ---------- */}
              <section>
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-[#9A9A9A] mb-3">Brand Voice</div>
                <p className="text-[0.85rem] text-[#2D2D2D] leading-relaxed mb-5">{strategyJSON.voiceDescription}</p>

                {/* Do / Don't pairs */}
                <div className="space-y-3 mb-6">
                  {strategyJSON.voiceDoDont.map((pair, i) => (
                    <div key={i} className="grid grid-cols-2 gap-3">
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="font-mono text-[0.6rem] uppercase tracking-wider text-green-700 mb-1">Do</div>
                        <div className="text-[0.78rem] text-green-900 leading-relaxed">{pair.do}</div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="font-mono text-[0.6rem] uppercase tracking-wider text-red-700 mb-1">Don&apos;t</div>
                        <div className="text-[0.78rem] text-red-900 leading-relaxed">{pair.dont}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Always / Never use */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-mono text-[0.6rem] uppercase tracking-wider text-[#9A9A9A] mb-2">Always Use</div>
                    <div className="flex flex-wrap gap-1.5">
                      {strategyJSON.alwaysUse.map((w, i) => (
                        <span key={i} className="bg-green-50 text-green-800 text-[0.72rem] px-2.5 py-1 rounded-full">{w}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[0.6rem] uppercase tracking-wider text-[#9A9A9A] mb-2">Never Use</div>
                    <div className="flex flex-wrap gap-1.5">
                      {strategyJSON.neverUse.map((w, i) => (
                        <span key={i} className="bg-red-50 text-red-800 text-[0.72rem] px-2.5 py-1 rounded-full">{w}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* ---------- Risks & Opportunities ---------- */}
              <section>
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-[#9A9A9A] mb-3">Risks & Opportunities</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Risks */}
                  <div className="space-y-3">
                    {strategyJSON.risks.map((r, i) => (
                      <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-5">
                        <div className="text-[0.82rem] font-semibold text-red-900 mb-1">{r.title}</div>
                        <div className="text-[0.78rem] text-red-800 leading-relaxed">{r.text}</div>
                      </div>
                    ))}
                  </div>
                  {/* Opportunities */}
                  <div className="space-y-3">
                    {strategyJSON.opportunities.map((o, i) => (
                      <div key={i} className="bg-green-50 border border-green-200 rounded-xl p-5">
                        <div className="text-[0.82rem] font-semibold text-green-900 mb-1">{o.title}</div>
                        <div className="text-[0.78rem] text-green-800 leading-relaxed">{o.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* ---------- Taglines ---------- */}
              <section>
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-[#9A9A9A] mb-3">Tagline Options</div>
                <div className="space-y-3">
                  {strategyJSON.taglines.map((t, i) => (
                    <div key={i} className="bg-white border border-[#E5E5E5] rounded-xl p-5 flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#FFF2EE] text-[#E8562A] flex items-center justify-center text-[0.78rem] font-bold shrink-0">{i + 1}</div>
                      <div>
                        <div className="text-[1rem] font-display text-[#1A1A1A] mb-1">&ldquo;{t.text}&rdquo;</div>
                        <div className="text-[0.78rem] text-[#6B6B6B] leading-relaxed">{t.rationale}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ---------- Footer ---------- */}
              <div className="text-center pt-6 pb-4 border-t border-[#E5E5E5]">
                <p className="text-[0.72rem] text-[#9A9A9A]">
                  Generated by Branditect{strategyRecord ? ` on ${formatDate(strategyRecord.created_at)}` : ""}
                </p>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /*  Legacy markdown-based view (fallback)                        */
            /* ============================================================ */
            <div className="max-w-3xl mx-auto px-8 py-10">
              {/* Header area */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-[0.68rem] font-bold px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Complete
                  </span>
                  {strategyRecord && (
                    <span className="text-[0.75rem] text-muted">
                      Last updated {formatDate(strategyRecord.created_at)}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-display text-ink mb-2">
                  Vetra &mdash; Brand Strategy
                </h1>

                <p className="text-[0.82rem] text-muted leading-relaxed">
                  9 sections &middot; Generated from questionnaire &middot; All outputs reference this strategy automatically.
                </p>

                {/* Action buttons */}
                <div className="flex items-center gap-3 mt-5">
                  <button
                    onClick={downloadMd}
                    className="border border-light rounded-[7px] px-3.5 py-2 text-[0.76rem] font-medium text-dark hover:border-brand-orange hover:text-brand-orange transition-colors"
                  >
                    Export .md
                  </button>
                  <button
                    onClick={() => setShowRedoModal(true)}
                    className="border border-light rounded-[7px] px-3.5 py-2 text-[0.76rem] font-medium text-dark hover:border-brand-orange hover:text-brand-orange transition-colors"
                  >
                    Re-do brand strategy
                  </button>
                </div>
              </div>

              {/* Section cards */}
              <div className="space-y-3">
                {strategySections.map((section, idx) => {
                  const isOpen = openSectionIdx === idx;
                  const sectionTitle = VIEW_SECTION_TITLES[idx] || section.title;

                  return (
                    <div
                      key={idx}
                      className="bg-white border border-light rounded-xl overflow-hidden transition-colors hover:border-[#D4D4CE]"
                    >
                      {/* Card header */}
                      <div
                        className="flex items-center gap-3.5 px-5 py-4 cursor-pointer select-none"
                        onClick={() => setOpenSectionIdx(isOpen ? null : idx)}
                      >
                        {/* Number badge */}
                        <div
                          className={`w-7 h-7 rounded-[7px] flex items-center justify-center font-mono text-[0.68rem] font-bold shrink-0 ${
                            isOpen
                              ? "bg-brand-orange-pale text-brand-orange"
                              : "bg-pale text-muted"
                          }`}
                        >
                          {idx + 1}
                        </div>

                        {/* Section title */}
                        <span className="text-[0.88rem] font-semibold text-ink flex-1">
                          {sectionTitle}
                        </span>

                        {/* Preview text (shown when collapsed) */}
                        {!isOpen && (
                          <span className="text-[0.78rem] text-muted flex-[2] truncate pr-4">
                            {section.preview}
                          </span>
                        )}

                        {/* Edit button (shown when expanded) */}
                        {isOpen && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditModalContent(section.content);
                              setEditModalIdx(idx);
                            }}
                            className="border border-light rounded-[7px] px-3 py-1.5 text-[0.72rem] font-medium text-muted hover:border-brand-orange hover:text-brand-orange transition-colors"
                          >
                            Edit section
                          </button>
                        )}

                        {/* Chevron */}
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            isOpen
                              ? "rotate-180 text-brand-orange"
                              : "text-muted"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>

                      {/* Section body */}
                      {isOpen && (
                        <div
                          className="border-t border-light px-6 py-6"
                          style={{ animation: "fadeIn 0.2s ease-out" }}
                        >
                          <div
                            dangerouslySetInnerHTML={{
                              __html: parseViewMarkdown(section.content),
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---- EDIT MODAL ---- */}
          {editModalIdx !== null && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[4px] z-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl w-[580px] max-h-[80vh] overflow-y-auto p-8 shadow-2xl">
                <h2 className="text-lg font-semibold text-ink mb-1">
                  Edit &mdash; {VIEW_SECTION_TITLES[editModalIdx] || strategySections[editModalIdx]?.title}
                </h2>
                <p className="text-[0.78rem] text-muted mb-5">
                  Changes update your Brand Intelligence Library and apply to all future outputs.
                </p>

                <textarea
                  value={editModalContent}
                  onChange={(e) => setEditModalContent(e.target.value)}
                  rows={16}
                  className="w-full rounded-xl border border-light bg-white px-4 py-3 text-sm text-dark placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent resize-none font-mono leading-relaxed"
                />

                <div className="flex items-center justify-end gap-3 mt-5">
                  <button
                    onClick={() => setEditModalIdx(null)}
                    className="px-4 py-2 rounded-lg border border-light text-sm font-medium text-dark hover:bg-pale transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSectionEdit}
                    className="px-5 py-2 rounded-lg bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange-hover transition-colors"
                  >
                    Save changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---- RE-DO MODAL ---- */}
          {showRedoModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[4px] z-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl w-[580px] max-h-[80vh] overflow-y-auto p-8 shadow-2xl">
                <h2 className="text-lg font-semibold text-ink mb-2">
                  Re-do brand strategy
                </h2>
                <p className="text-[0.82rem] text-dark leading-relaxed mb-4">
                  This will restart the full strategy questionnaire. Your current strategy will be archived &mdash; not deleted.
                </p>

                <div className="bg-amber-50 border-l-[3px] border-amber-500 rounded-r-[10px] px-4 py-3.5 mb-6">
                  <p className="text-[0.78rem] text-amber-800 leading-relaxed">
                    All outputs generated from your current strategy will continue to work. Only new outputs will reference the updated strategy.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowRedoModal(false)}
                    className="px-4 py-2 rounded-lg border border-light text-sm font-medium text-dark hover:bg-pale transition-colors"
                  >
                    Keep current strategy
                  </button>
                  <button
                    onClick={() => {
                      setShowRedoModal(false);
                      setStrategyRecord(null);
                      setStrategySections([]);
                      setOpenSectionIdx(null);
                      setGeneratedStrategy("");
                      setAnswers({});
                      setCategory(null);
                      setCurrentIndex(0);
                      setScreen("entry");
                    }}
                    className="px-5 py-2 rounded-lg bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange-hover transition-colors"
                  >
                    Start over &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* fadeIn animation */}
          <style jsx>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-4px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
