"use client";

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LogoSlot {
  key: string;
  label: string;
}

interface UploadedFile {
  name: string;
  url: string;
  path: string;
}

/* ------------------------------------------------------------------ */
/*  Static data (kept from original page)                              */
/* ------------------------------------------------------------------ */

const tabs = ["Visual", "Strategy", "Assets", "Voice & Tone", "Products", "Team"];

const colors = [
  { name: "Black", hex: "#0A0A0F", bg: "#0A0A0F" },
  { name: "Lime", hex: "#C8F135", bg: "#C8F135" },
  { name: "Purple", hex: "#7B5EA7", bg: "#7B5EA7" },
  { name: "Off White", hex: "#F2F0FA", bg: "#F2F0FA", border: true },
  { name: "Red", hex: "#FF4D6D", bg: "#FF4D6D" },
];

const fonts = [
  { sample: "Aa", sampleClass: "font-display italic", name: "Syne \u2014 Display", use: "Headings, hero text \u00B7 Weight 700\u2013800" },
  { sample: "Aa", sampleClass: "font-sans font-light", name: "DM Sans \u2014 Body", use: "Body copy, UI text \u00B7 Weight 300\u2013500" },
  { sample: "Aa", sampleClass: "font-mono", name: "DM Mono \u2014 Labels", use: "Tags, metadata, labels \u00B7 Weight 300\u2013500" },
];

const assets = [
  { icon: "\uD83C\uDFA8", name: "Logo \u2014 Primary", type: "SVG \u00B7 PNG" },
  { icon: "\u25FB", name: "Logo \u2014 White", type: "SVG \u00B7 PNG" },
  { icon: "\u2709", name: "Newsletter Master", type: "HTML" },
  { icon: "\u25C8", name: "Pitch Deck Master", type: "PPTX" },
  { icon: "\uD83D\uDDBC", name: "Brand Images", type: "12 images" },
  { icon: "\u2726", name: "AI Image Prompts", type: "8 prompts" },
  { icon: "\u2A21", name: "Social Templates", type: "IG \u00B7 LinkedIn" },
];

const logoSlots: LogoSlot[] = [
  { key: "primary-logo", label: "Primary Logo" },
  { key: "dark-bg-version", label: "Dark Background Version" },
  { key: "icon-mark", label: "Icon / Mark Only" },
  { key: "white-version", label: "White Version" },
];

const ACCEPTED_LOGO_TYPES = ".png,.svg,.pdf";
const ACCEPTED_GUIDELINE_TYPES = ".pdf";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fileExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function isValidLogoFile(file: File) {
  const ext = fileExtension(file.name);
  return ["png", "svg", "pdf"].includes(ext);
}

function isValidGuidelineFile(file: File) {
  return fileExtension(file.name) === "pdf";
}

/* ------------------------------------------------------------------ */
/*  Logo Drop Zone component                                           */
/* ------------------------------------------------------------------ */

function LogoDropZone({
  slot,
  uploaded,
  uploading,
  onFile,
}: {
  slot: LogoSlot;
  uploaded: UploadedFile | null;
  uploading: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && isValidLogoFile(file)) onFile(file);
    },
    [onFile],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && isValidLogoFile(file)) onFile(file);
      e.target.value = "";
    },
    [onFile],
  );

  const borderColor = dragOver
    ? "border-brand-orange"
    : uploaded
    ? "border-brand-orange-mid"
    : "border-light";

  const bgColor = dragOver
    ? "bg-brand-orange-pale"
    : uploaded
    ? "bg-white"
    : "bg-pale/40";

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed ${borderColor} ${bgColor} cursor-pointer transition-all hover:border-brand-orange hover:bg-brand-orange-pale/40 min-h-[160px]`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_LOGO_TYPES}
        className="hidden"
        onChange={handleChange}
      />

      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="h-5 w-5 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
          <span className="font-mono text-[0.6rem] text-muted">Uploading...</span>
        </div>
      ) : uploaded ? (
        <div className="flex flex-col items-center gap-2 px-4">
          {uploaded.url && /\.(png|svg)$/i.test(uploaded.name) ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={uploaded.url}
              alt={slot.label}
              className="max-h-[80px] max-w-full object-contain"
            />
          ) : (
            <div className="h-[60px] w-[60px] rounded-md bg-brand-orange-pale flex items-center justify-center">
              <span className="text-brand-orange text-lg font-bold font-mono">PDF</span>
            </div>
          )}
          <span className="font-mono text-[0.58rem] text-muted truncate max-w-full">
            {uploaded.name}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 px-4 text-center">
          <svg
            className="h-7 w-7 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3.75 3.75 0 013.57 5.595H6.75z"
            />
          </svg>
          <span className="font-mono text-[0.62rem] tracking-wide uppercase text-muted">
            {slot.label}
          </span>
          <span className="font-mono text-[0.52rem] text-muted/70">
            PNG, SVG, or PDF
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function BrandLibraryPage() {
  const [activeTab, setActiveTab] = useState("Visual");

  // Logo uploads: keyed by slot key
  const [logoFiles, setLogoFiles] = useState<Record<string, UploadedFile>>({});
  const [logoUploading, setLogoUploading] = useState<Record<string, boolean>>({});

  // Guidelines upload
  const [guidelineFile, setGuidelineFile] = useState<UploadedFile | null>(null);
  const [guidelineUploading, setGuidelineUploading] = useState(false);
  const guidelineInputRef = useRef<HTMLInputElement>(null);
  const [guidelineDragOver, setGuidelineDragOver] = useState(false);

  // Strategy fork
  const [strategyPath, setStrategyPath] = useState<"have" | "create">("have");
  const [strategyText, setStrategyText] = useState("");
  const [strategySaving, setStrategySaving] = useState(false);
  const [strategySaved, setStrategySaved] = useState(false);

  /* ---- Upload helpers ---- */

  const uploadLogo = useCallback(async (slotKey: string, file: File) => {
    setLogoUploading((prev) => ({ ...prev, [slotKey]: true }));
    const ext = fileExtension(file.name);
    const path = `logos/${slotKey}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("brand-assets")
      .upload(path, file, { upsert: true });

    if (!error) {
      const { data: urlData } = supabase.storage
        .from("brand-assets")
        .getPublicUrl(path);

      setLogoFiles((prev) => ({
        ...prev,
        [slotKey]: { name: file.name, url: urlData.publicUrl, path },
      }));
    }

    setLogoUploading((prev) => ({ ...prev, [slotKey]: false }));
  }, []);

  const uploadGuideline = useCallback(async (file: File) => {
    setGuidelineUploading(true);
    const path = `guidelines/${file.name}`;

    const { error } = await supabase.storage
      .from("brand-assets")
      .upload(path, file, { upsert: true });

    if (!error) {
      const { data: urlData } = supabase.storage
        .from("brand-assets")
        .getPublicUrl(path);

      setGuidelineFile({ name: file.name, url: urlData.publicUrl, path });
    }

    setGuidelineUploading(false);
  }, []);

  const handleGuidelineDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setGuidelineDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && isValidGuidelineFile(file)) uploadGuideline(file);
    },
    [uploadGuideline],
  );

  const handleGuidelineChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && isValidGuidelineFile(file)) uploadGuideline(file);
      e.target.value = "";
    },
    [uploadGuideline],
  );

  const handleSaveStrategy = useCallback(async () => {
    if (!strategyText.trim()) return;
    setStrategySaving(true);
    setStrategySaved(false);

    const file = new Blob([strategyText], { type: "text/plain" });
    const path = `strategy/brand-strategy-${Date.now()}.txt`;

    const { error } = await supabase.storage
      .from("brand-assets")
      .upload(path, file, { upsert: true });

    setStrategySaving(false);
    if (!error) {
      setStrategySaved(true);
      setTimeout(() => setStrategySaved(false), 3000);
    }
  }, [strategyText]);

  /* ---------------------------------------------------------------- */

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Header */}
      <div className="px-8 pt-7 pb-4 border-b border-light shrink-0">
        <h1 className="font-display text-2xl text-ink tracking-tight mb-1">
          Vetra Brand Library
        </h1>
        <p className="text-[0.78rem] text-muted">
          Upload your brand assets and define your strategy — everything Vetra needs to work for you.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex px-8 border-b border-light bg-white">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2.5 mr-6 font-mono text-[0.6rem] tracking-[0.1em] uppercase border-b-2 -mb-px transition-all ${
              activeTab === tab
                ? "text-brand-orange border-brand-orange"
                : "text-muted border-transparent hover:text-ink"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto px-8 py-7">
        {/* ========================================================= */}
        {/*  SECTION 1 — Logo Upload                                   */}
        {/* ========================================================= */}
        <div className="mb-10">
          <div className="font-mono text-[0.58rem] tracking-[0.12em] uppercase text-muted mb-1.5">
            Logo Uploads
          </div>
          <p className="text-[0.75rem] text-mid mb-4">
            Upload your logo in four variants. Drag and drop files or click to browse.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {logoSlots.map((slot) => (
              <LogoDropZone
                key={slot.key}
                slot={slot}
                uploaded={logoFiles[slot.key] ?? null}
                uploading={!!logoUploading[slot.key]}
                onFile={(file) => uploadLogo(slot.key, file)}
              />
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/*  SECTION 2 — Brand Guidelines Upload                       */}
        {/* ========================================================= */}
        <div className="mb-10">
          <div className="font-mono text-[0.58rem] tracking-[0.12em] uppercase text-muted mb-1.5">
            Brand Guidelines
          </div>
          <p className="text-[0.75rem] text-mid mb-4">
            Upload your brand guidelines document (PDF).
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setGuidelineDragOver(true);
            }}
            onDragLeave={() => setGuidelineDragOver(false)}
            onDrop={handleGuidelineDrop}
            onClick={() => guidelineInputRef.current?.click()}
            className={`relative flex items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-all min-h-[120px] ${
              guidelineDragOver
                ? "border-brand-orange bg-brand-orange-pale"
                : guidelineFile
                ? "border-brand-orange-mid bg-white"
                : "border-light bg-pale/40 hover:border-brand-orange hover:bg-brand-orange-pale/40"
            }`}
          >
            <input
              ref={guidelineInputRef}
              type="file"
              accept={ACCEPTED_GUIDELINE_TYPES}
              className="hidden"
              onChange={handleGuidelineChange}
            />

            {guidelineUploading ? (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
                <span className="font-mono text-[0.65rem] text-muted">Uploading...</span>
              </div>
            ) : guidelineFile ? (
              <div className="flex items-center gap-3">
                {/* Checkmark circle */}
                <div className="h-8 w-8 rounded-full bg-brand-orange flex items-center justify-center shrink-0">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <span className="text-[0.78rem] text-ink font-medium">
                    {guidelineFile.name}
                  </span>
                  <span className="block font-mono text-[0.55rem] text-muted mt-0.5">
                    Uploaded successfully
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <svg
                  className="h-7 w-7 text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
                <span className="font-mono text-[0.62rem] tracking-wide uppercase text-muted">
                  Brand Guidelines PDF
                </span>
                <span className="font-mono text-[0.52rem] text-muted/70">
                  Drag and drop or click to browse
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/*  SECTION 3 — Brand Strategy Fork                           */}
        {/* ========================================================= */}
        <div className="mb-10">
          <div className="font-mono text-[0.58rem] tracking-[0.12em] uppercase text-muted mb-1.5">
            Brand Strategy
          </div>
          <p className="text-[0.75rem] text-mid mb-4">
            Share your existing brand strategy or let us help you build one.
          </p>

          {/* Toggle tabs */}
          <div className="inline-flex rounded-lg border border-light overflow-hidden mb-5">
            <button
              onClick={() => setStrategyPath("have")}
              className={`px-5 py-2 font-mono text-[0.62rem] tracking-wide uppercase transition-all ${
                strategyPath === "have"
                  ? "bg-brand-orange text-white"
                  : "bg-white text-muted hover:text-ink"
              }`}
            >
              I have a brand strategy
            </button>
            <button
              onClick={() => setStrategyPath("create")}
              className={`px-5 py-2 font-mono text-[0.62rem] tracking-wide uppercase transition-all ${
                strategyPath === "create"
                  ? "bg-brand-orange text-white"
                  : "bg-white text-muted hover:text-ink"
              }`}
            >
              Create my strategy
            </button>
          </div>

          {strategyPath === "have" ? (
            <div>
              <textarea
                value={strategyText}
                onChange={(e) => setStrategyText(e.target.value)}
                placeholder="Paste your brand strategy, positioning statement, mission, vision, or any foundational brand text here..."
                rows={8}
                className="w-full rounded-lg border border-light bg-white px-4 py-3 text-[0.82rem] text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all resize-y font-sans"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleSaveStrategy}
                  disabled={!strategyText.trim() || strategySaving}
                  className="px-5 py-2 rounded-lg bg-brand-orange text-white font-mono text-[0.65rem] uppercase tracking-wide hover:bg-brand-orange-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {strategySaving ? "Saving..." : strategySaved ? "Saved ✓" : "Save Strategy"}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-light bg-pale/40 p-8 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-brand-orange-pale flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-brand-orange"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                  />
                </svg>
              </div>
              <h3 className="font-display text-lg text-ink mb-1.5">
                Build Your Brand Strategy
              </h3>
              <p className="text-[0.75rem] text-muted mb-5 max-w-md">
                Answer a guided questionnaire and we will craft a brand strategy tailored to your business.
              </p>
              <button className="px-6 py-2.5 rounded-lg bg-brand-orange text-white font-mono text-[0.65rem] uppercase tracking-wide hover:bg-brand-orange-hover transition-all">
                Start Brand Questionnaire
              </button>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/*  Divider between new upload sections and existing content   */}
        {/* ========================================================= */}
        <hr className="border-light mb-9" />

        {/* ========================================================= */}
        {/*  EXISTING SECTIONS — Colors, Typography, Assets             */}
        {/* ========================================================= */}

        {/* Colors */}
        <div className="mb-9">
          <div className="font-mono text-[0.58rem] tracking-[0.12em] uppercase text-muted mb-3.5">
            Color Palette
          </div>
          <div className="flex gap-3.5 flex-wrap">
            {colors.map((c) => (
              <div key={c.hex} className="flex flex-col gap-[5px] cursor-pointer group">
                <div
                  className="w-[52px] h-[52px] rounded-[7px] group-hover:scale-105 transition-transform"
                  style={{
                    background: c.bg,
                    border: c.border ? "1px solid #E5E5E5" : "1px solid transparent",
                  }}
                />
                <div className="font-mono text-[0.55rem] text-muted">{c.name}</div>
                <div className="font-mono text-[0.58rem] text-ink font-medium">{c.hex}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="mb-9">
          <div className="font-mono text-[0.58rem] tracking-[0.12em] uppercase text-muted mb-3.5">
            Typography
          </div>
          {fonts.map((f) => (
            <div key={f.name} className="bg-white border border-light rounded-[7px] p-5 mb-2.5 flex items-center gap-6">
              <div className={`text-[2.2rem] leading-none text-ink min-w-[80px] ${f.sampleClass}`}>
                {f.sample}
              </div>
              <div>
                <div className="font-medium text-[0.82rem] text-ink mb-[2px]">{f.name}</div>
                <div className="font-mono text-[0.6rem] text-muted">{f.use}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Assets */}
        <div className="mb-9">
          <div className="font-mono text-[0.58rem] tracking-[0.12em] uppercase text-muted mb-3.5">
            Asset Library
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {assets.map((a) => (
              <div
                key={a.name}
                className="bg-white border border-light rounded-[7px] overflow-hidden cursor-pointer hover:border-brand-orange hover:shadow-[0_1px_8px_rgba(232,86,42,0.08)] transition-all"
              >
                <div className="h-[72px] bg-pale border-b border-light flex items-center justify-center text-2xl">
                  {a.icon}
                </div>
                <div className="p-2.5">
                  <div className="text-[0.73rem] text-ink mb-[2px] truncate">{a.name}</div>
                  <div className="font-mono text-[0.56rem] text-muted">{a.type}</div>
                </div>
              </div>
            ))}
            {/* Upload card */}
            <div className="border border-dashed border-light rounded-[7px] overflow-hidden opacity-50 cursor-pointer">
              <div className="h-[72px] flex items-center justify-center text-xl text-muted">+</div>
              <div className="p-2.5">
                <div className="text-[0.73rem] text-muted mb-[2px]">Upload asset</div>
                <div className="font-mono text-[0.56rem] text-muted">Any format</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
