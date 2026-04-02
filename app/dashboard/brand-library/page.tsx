"use client";

import { useState, useRef, useCallback, useEffect, DragEvent, ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";
import ImageLibrary from "@/components/image-library";

/* ------------------------------------------------------------------ */
/*  Brand Color type                                                   */
/* ------------------------------------------------------------------ */

interface BrandColor {
  hex: string;
  name: string;
  usage: string;
}

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

const defaultColors: BrandColor[] = [
  { hex: "#0A0A0F", name: "Black", usage: "Primary background" },
  { hex: "#C8F135", name: "Lime", usage: "Accent highlight" },
  { hex: "#7B5EA7", name: "Purple", usage: "Secondary accent" },
  { hex: "#F2F0FA", name: "Off White", usage: "Light background" },
  { hex: "#FF4D6D", name: "Red", usage: "Alert / emphasis" },
];

interface BrandFont {
  name: string;
  use: string;
  source: "google" | "upload";
  url?: string; // Google Fonts CSS URL or uploaded file URL
}

const defaultFonts: BrandFont[] = [
  { name: "Syne", use: "Headings, hero text", source: "google" },
  { name: "DM Sans", use: "Body copy, UI text", source: "google" },
  { name: "DM Mono", use: "Tags, metadata, labels", source: "google" },
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

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 200;
}

/* ------------------------------------------------------------------ */
/*  Logo Drop Zone component                                           */
/* ------------------------------------------------------------------ */

function LogoDropZone({
  slot,
  uploaded,
  uploading,
  onFile,
  localPreview,
}: {
  slot: LogoSlot;
  uploaded: UploadedFile | null;
  uploading: boolean;
  onFile: (file: File) => void;
  localPreview: string | null;
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

  const isDark = slot.key === "dark-bg-version";

  return (
    <div className="flex flex-col">
      {/* Label */}
      <div className="font-mono text-[0.55rem] tracking-wider uppercase text-muted mb-1.5">{slot.label}</div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-all min-h-[140px] ${
          dragOver
            ? "border-brand-orange bg-brand-orange-pale"
            : uploaded
            ? `border-transparent ${isDark ? "bg-[#1A1A1A]" : "bg-[#F8F8F8]"}`
            : "border-light bg-pale/40 hover:border-brand-orange hover:bg-brand-orange-pale/40"
        }`}
      >
        <input ref={inputRef} type="file" accept={ACCEPTED_LOGO_TYPES} className="hidden" onChange={handleChange} />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-5 w-5 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
            <span className="font-mono text-[0.6rem] text-muted">Uploading...</span>
          </div>
        ) : (uploaded || localPreview) ? (
          <div className="flex flex-col items-center gap-2 px-6 py-4 w-full">
            {(localPreview || (uploaded?.url && /\.(png|svg)$/i.test(uploaded.name))) ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={localPreview || uploaded?.url || ""} alt={slot.label} className="max-h-[90px] max-w-full object-contain" />
            ) : (
              <div className="h-[60px] w-[60px] rounded-md bg-brand-orange-pale flex items-center justify-center">
                <span className="text-brand-orange text-lg font-bold font-mono">PDF</span>
              </div>
            )}
            <span className={`font-mono text-[0.52rem] ${isDark ? "text-white/40" : "text-muted"} truncate max-w-full`}>
              Click to replace
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <svg className="h-6 w-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3.75 3.75 0 013.57 5.595H6.75z" />
            </svg>
            <span className="font-mono text-[0.52rem] text-muted/70">PNG, SVG, or PDF</span>
          </div>
        )}
      </div>
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
  const [logoPreviews, setLogoPreviews] = useState<Record<string, string>>({});

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

  // Brand colors
  const [brandColors, setBrandColors] = useState<BrandColor[]>(defaultColors);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [editingColor, setEditingColor] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<BrandColor>({ hex: "", name: "", usage: "" });
  const [showAddColor, setShowAddColor] = useState(false);
  const [newColor, setNewColor] = useState<BrandColor>({ hex: "#000000", name: "", usage: "" });
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const [screenshotDragOver, setScreenshotDragOver] = useState(false);

  // Fonts
  const [brandFonts, setBrandFonts] = useState<BrandFont[]>(defaultFonts);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [fontSearch, setFontSearch] = useState("");
  const [fontResults, setFontResults] = useState<string[]>([]);
  const [fontSearching, setFontSearching] = useState(false);
  const [newFontUse, setNewFontUse] = useState("");
  const fontUploadRef = useRef<HTMLInputElement>(null);
  const [loadedGoogleFonts, setLoadedGoogleFonts] = useState<Set<string>>(new Set());

  /* ---- Upload helpers ---- */

  const uploadLogo = useCallback(async (slotKey: string, file: File) => {
    // Create local preview immediately
    if (/\.(png|jpg|jpeg|svg|webp)$/i.test(file.name)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreviews((prev) => ({ ...prev, [slotKey]: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }

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
    // Even if Supabase upload fails, the local preview stays

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

  // Extract colors from a file (PDF or image)
  const extractColors = useCallback(async (file: File, type: "pdf" | "image") => {
    setExtracting(true);
    setExtractError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch("/api/extract-colors", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Extraction failed");
      if (data.colors?.length > 0) {
        setBrandColors(data.colors);
      } else {
        setExtractError("No colors found in this file.");
      }
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  }, []);

  // Auto-extract when guidelines PDF is uploaded
  const uploadGuidelineWithExtract = useCallback(async (file: File) => {
    await uploadGuideline(file);
    await extractColors(file, "pdf");
  }, [uploadGuideline, extractColors]);

  const handleGuidelineDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setGuidelineDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && isValidGuidelineFile(file)) uploadGuidelineWithExtract(file);
    },
    [uploadGuidelineWithExtract],
  );

  const handleGuidelineChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && isValidGuidelineFile(file)) uploadGuidelineWithExtract(file);
      e.target.value = "";
    },
    [uploadGuidelineWithExtract],
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

  // Screenshot upload for color extraction
  const handleScreenshotFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["png", "jpg", "jpeg", "webp"].includes(ext)) return;
    await extractColors(file, "image");
  }, [extractColors]);

  const handleScreenshotDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setScreenshotDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleScreenshotFile(file);
    },
    [handleScreenshotFile],
  );

  const handleScreenshotChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleScreenshotFile(file);
      e.target.value = "";
    },
    [handleScreenshotFile],
  );

  const copyHex = useCallback((hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  }, []);

  const startEdit = useCallback((index: number) => {
    setEditingColor(index);
    setEditForm({ ...brandColors[index] });
  }, [brandColors]);

  const saveEdit = useCallback(() => {
    if (editingColor === null) return;
    setBrandColors((prev) => prev.map((c, i) => (i === editingColor ? { ...editForm } : c)));
    setEditingColor(null);
  }, [editingColor, editForm]);

  const deleteColor = useCallback((index: number) => {
    setBrandColors((prev) => prev.filter((_, i) => i !== index));
    setEditingColor(null);
  }, []);

  const addColor = useCallback(() => {
    if (!newColor.hex || !newColor.name) return;
    setBrandColors((prev) => [...prev, { ...newColor }]);
    setNewColor({ hex: "#000000", name: "", usage: "" });
    setShowAddColor(false);
  }, [newColor]);

  // Load a Google Font dynamically
  const loadGoogleFont = useCallback((fontName: string) => {
    if (loadedGoogleFonts.has(fontName)) return;
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    setLoadedGoogleFonts((prev) => new Set(prev).add(fontName));
  }, [loadedGoogleFonts]);

  // Search Google Fonts
  const searchFonts = useCallback(async (query: string) => {
    setFontSearch(query);
    if (!query.trim()) { setFontResults([]); return; }
    setFontSearching(true);
    try {
      const res = await fetch(`/api/google-fonts?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setFontResults(data.fonts || []);
      // Preload results
      (data.fonts || []).forEach((f: string) => loadGoogleFont(f));
    } catch { setFontResults([]); }
    setFontSearching(false);
  }, [loadGoogleFont]);

  const addGoogleFont = useCallback((fontName: string) => {
    loadGoogleFont(fontName);
    setBrandFonts((prev) => [...prev, { name: fontName, use: newFontUse || "Not specified", source: "google" }]);
    setShowFontPicker(false);
    setFontSearch("");
    setFontResults([]);
    setNewFontUse("");
  }, [loadGoogleFont, newFontUse]);

  const uploadFont = useCallback(async (file: File) => {
    const path = `fonts/${file.name}`;
    const { error } = await supabase.storage.from("brand-assets").upload(path, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from("brand-assets").getPublicUrl(path);
      // Create @font-face rule
      const fontName = file.name.replace(/\.[^.]+$/, "");
      const style = document.createElement("style");
      style.textContent = `@font-face { font-family: '${fontName}'; src: url('${urlData.publicUrl}'); }`;
      document.head.appendChild(style);
      setBrandFonts((prev) => [...prev, { name: fontName, use: "Custom upload", source: "upload", url: urlData.publicUrl }]);
    }
  }, []);

  const removeFont = useCallback((index: number) => {
    setBrandFonts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Load all Google Fonts on mount
  useEffect(() => {
    defaultFonts.filter((f) => f.source === "google").forEach((f) => {
      const link = document.createElement("link");
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f.name)}:wght@300;400;500;600;700&display=swap`;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    });
  }, []);

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

        {/* Assets tab — Image Library */}
        {activeTab === "Assets" && <ImageLibrary />}

        {/* Visual tab — all existing content */}
        {activeTab === "Visual" && (<>
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
                localPreview={logoPreviews[slot.key] ?? null}
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

        {/* Color Palette */}
        <div className="mb-9">
          <div className="flex items-center justify-between mb-1.5">
            <div className="font-mono text-[0.58rem] tracking-[0.12em] uppercase text-muted">
              Color Palette
            </div>
            {extracting && (
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
                <span className="font-mono text-[0.58rem] text-brand-orange">Extracting colors...</span>
              </div>
            )}
          </div>

          {extractError && (
            <div className="mb-3 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-[0.75rem] text-red-600">
              {extractError}
            </div>
          )}

          {/* Screenshot upload for color extraction */}
          <div className="mb-4">
            <p className="text-[0.75rem] text-mid mb-2">
              Upload a screenshot of your brand colors page to auto-extract, or add colors manually.
            </p>
            <div
              onDragOver={(e) => { e.preventDefault(); setScreenshotDragOver(true); }}
              onDragLeave={() => setScreenshotDragOver(false)}
              onDrop={handleScreenshotDrop}
              onClick={() => screenshotInputRef.current?.click()}
              className={`flex items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-all h-[80px] ${
                screenshotDragOver
                  ? "border-brand-orange bg-brand-orange-pale"
                  : "border-light bg-pale/40 hover:border-brand-orange hover:bg-brand-orange-pale/40"
              }`}
            >
              <input
                ref={screenshotInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={handleScreenshotChange}
              />
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                <span className="font-mono text-[0.62rem] tracking-wide uppercase text-muted">
                  Drop screenshot to extract colors
                </span>
              </div>
            </div>
          </div>

          {/* Color swatches */}
          <div className="flex gap-4 flex-wrap">
            {brandColors.map((c, i) => (
              <div key={`${c.hex}-${i}`} className="group relative">
                {editingColor === i ? (
                  /* Edit mode */
                  <div className="bg-white border border-brand-orange rounded-lg p-3 w-[180px] shadow-lg">
                    <div className="flex gap-2 mb-2">
                      <input
                        type="color"
                        value={editForm.hex}
                        onChange={(e) => setEditForm({ ...editForm, hex: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                      />
                      <input
                        value={editForm.hex}
                        onChange={(e) => setEditForm({ ...editForm, hex: e.target.value })}
                        className="flex-1 font-mono text-[0.7rem] border border-light rounded px-2 py-1 text-ink"
                      />
                    </div>
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Color name"
                      className="w-full text-[0.72rem] border border-light rounded px-2 py-1 mb-1.5 text-ink"
                    />
                    <input
                      value={editForm.usage}
                      onChange={(e) => setEditForm({ ...editForm, usage: e.target.value })}
                      placeholder="Usage"
                      className="w-full text-[0.72rem] border border-light rounded px-2 py-1 mb-2 text-muted"
                    />
                    <div className="flex gap-1.5">
                      <button onClick={saveEdit} className="flex-1 py-1 rounded bg-brand-orange text-white font-mono text-[0.55rem] uppercase">Save</button>
                      <button onClick={() => deleteColor(i)} className="py-1 px-2 rounded bg-red-50 text-red-500 font-mono text-[0.55rem] uppercase border border-red-200">Delete</button>
                      <button onClick={() => setEditingColor(null)} className="py-1 px-2 rounded bg-pale text-muted font-mono text-[0.55rem] uppercase border border-light">Cancel</button>
                    </div>
                  </div>
                ) : (
                  /* Display mode */
                  <div className="flex flex-col gap-[5px] cursor-pointer">
                    <div
                      onClick={() => copyHex(c.hex)}
                      className="w-[52px] h-[52px] rounded-[7px] group-hover:scale-105 transition-transform relative"
                      style={{
                        background: c.hex,
                        border: isLightColor(c.hex) ? "1px solid #E5E5E5" : "1px solid transparent",
                      }}
                    >
                      {copiedHex === c.hex && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-[7px]">
                          <span className="text-white text-[0.55rem] font-mono">Copied</span>
                        </div>
                      )}
                    </div>
                    <div className="font-mono text-[0.55rem] text-muted">{c.name}</div>
                    <div className="font-mono text-[0.58rem] text-ink font-medium">{c.hex}</div>
                    {c.usage && <div className="font-mono text-[0.5rem] text-muted/70 max-w-[80px] leading-tight">{c.usage}</div>}
                    <button
                      onClick={() => startEdit(i)}
                      className="opacity-0 group-hover:opacity-100 font-mono text-[0.5rem] text-brand-orange hover:underline transition-opacity text-left"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Add color button */}
            {showAddColor ? (
              <div className="bg-white border border-brand-orange rounded-lg p-3 w-[180px] shadow-lg">
                <div className="flex gap-2 mb-2">
                  <input
                    type="color"
                    value={newColor.hex}
                    onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                  />
                  <input
                    value={newColor.hex}
                    onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                    className="flex-1 font-mono text-[0.7rem] border border-light rounded px-2 py-1 text-ink"
                  />
                </div>
                <input
                  value={newColor.name}
                  onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                  placeholder="Color name"
                  className="w-full text-[0.72rem] border border-light rounded px-2 py-1 mb-1.5 text-ink"
                />
                <input
                  value={newColor.usage}
                  onChange={(e) => setNewColor({ ...newColor, usage: e.target.value })}
                  placeholder="Usage (optional)"
                  className="w-full text-[0.72rem] border border-light rounded px-2 py-1 mb-2 text-muted"
                />
                <div className="flex gap-1.5">
                  <button onClick={addColor} disabled={!newColor.name} className="flex-1 py-1 rounded bg-brand-orange text-white font-mono text-[0.55rem] uppercase disabled:opacity-40">Add</button>
                  <button onClick={() => setShowAddColor(false)} className="py-1 px-2 rounded bg-pale text-muted font-mono text-[0.55rem] uppercase border border-light">Cancel</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setShowAddColor(true)}
                className="flex flex-col items-center justify-center w-[52px] min-h-[52px] rounded-[7px] border-2 border-dashed border-light hover:border-brand-orange cursor-pointer transition-all group/add"
              >
                <span className="text-lg text-muted group-hover/add:text-brand-orange transition-colors">+</span>
              </div>
            )}
          </div>
        </div>

        {/* Typography */}
        <div className="mb-9">
          <div className="flex items-center justify-between mb-3.5">
            <div className="font-mono text-[0.58rem] tracking-[0.12em] uppercase text-muted">
              Typography
            </div>
          </div>

          {brandFonts.map((f, i) => (
            <div key={`${f.name}-${i}`} className="bg-white border border-light rounded-[7px] p-5 mb-2.5 flex items-center gap-6 group">
              <div
                className="text-[2.2rem] leading-none text-ink min-w-[80px]"
                style={{ fontFamily: `'${f.name}', sans-serif` }}
              >
                Aa
              </div>
              <div className="flex-1">
                <div className="font-medium text-[0.82rem] text-ink mb-[2px]">{f.name}</div>
                <div className="font-mono text-[0.6rem] text-muted">
                  {f.use} · {f.source === "google" ? "Google Fonts" : "Custom upload"}
                </div>
              </div>
              {/* Preview sentence */}
              <div
                className="hidden lg:block text-[0.8rem] text-mid max-w-[200px] truncate"
                style={{ fontFamily: `'${f.name}', sans-serif` }}
              >
                The quick brown fox jumps over the lazy dog
              </div>
              <button
                onClick={() => removeFont(i)}
                className="opacity-0 group-hover:opacity-100 text-[0.6rem] text-red-400 hover:text-red-600 font-mono transition-opacity shrink-0"
              >
                Remove
              </button>
            </div>
          ))}

          {/* Add font */}
          {showFontPicker ? (
            <div className="bg-white border border-brand-orange rounded-lg p-4 mt-2 shadow-lg">
              <div className="font-mono text-[0.58rem] tracking-wider uppercase text-muted mb-3">Add a font</div>

              {/* Google Fonts search */}
              <div className="mb-3">
                <label className="font-mono text-[0.55rem] text-muted uppercase tracking-wide block mb-1">Search Google Fonts</label>
                <input
                  value={fontSearch}
                  onChange={(e) => searchFonts(e.target.value)}
                  placeholder="Type a font name..."
                  className="w-full border border-light rounded px-3 py-2 text-[0.8rem] text-ink outline-none focus:border-brand-orange"
                />
                {fontSearching && <div className="font-mono text-[0.55rem] text-muted mt-1">Searching...</div>}
                {fontResults.length > 0 && (
                  <div className="mt-2 border border-light rounded-md max-h-[200px] overflow-y-auto">
                    {fontResults.map((name) => (
                      <button
                        key={name}
                        onClick={() => addGoogleFont(name)}
                        className="w-full text-left px-3 py-2 hover:bg-brand-orange-pale transition-colors border-b border-light last:border-0 flex items-center justify-between"
                      >
                        <span style={{ fontFamily: `'${name}', sans-serif` }} className="text-[0.85rem] text-ink">{name}</span>
                        <span className="font-mono text-[0.5rem] text-brand-orange">+ Add</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Usage field */}
              <div className="mb-3">
                <label className="font-mono text-[0.55rem] text-muted uppercase tracking-wide block mb-1">Usage</label>
                <input
                  value={newFontUse}
                  onChange={(e) => setNewFontUse(e.target.value)}
                  placeholder="e.g. Headings, body copy..."
                  className="w-full border border-light rounded px-3 py-2 text-[0.8rem] text-ink outline-none focus:border-brand-orange"
                />
              </div>

              {/* Upload custom font */}
              <div className="flex items-center gap-3 pt-2 border-t border-light">
                <button
                  onClick={() => fontUploadRef.current?.click()}
                  className="px-4 py-1.5 rounded border border-light text-[0.72rem] text-mid hover:border-brand-orange hover:text-brand-orange transition-all"
                >
                  Upload custom font file
                </button>
                <span className="font-mono text-[0.5rem] text-muted">.woff, .woff2, .ttf, .otf</span>
                <input
                  ref={fontUploadRef}
                  type="file"
                  accept=".woff,.woff2,.ttf,.otf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFont(file);
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={() => { setShowFontPicker(false); setFontSearch(""); setFontResults([]); }}
                  className="ml-auto font-mono text-[0.55rem] text-muted hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowFontPicker(true)}
              className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-[7px] border-2 border-dashed border-light hover:border-brand-orange text-muted hover:text-brand-orange transition-all"
            >
              <span className="text-lg">+</span>
              <span className="font-mono text-[0.62rem] tracking-wide uppercase">Add font</span>
            </button>
          )}
        </div>

        </>)}

        {/* Strategy tab */}
        {activeTab === "Strategy" && (
          <div className="text-center py-12">
            <p className="text-[0.78rem] text-muted">Strategy content coming soon.</p>
          </div>
        )}

        {/* Other tabs — placeholder */}
        {!["Visual", "Assets", "Strategy"].includes(activeTab) && (
          <div className="text-center py-12">
            <p className="text-[0.78rem] text-muted">{activeTab} content coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
