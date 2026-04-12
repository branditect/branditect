"use client";

import { useState, useRef, useCallback, useEffect, DragEvent, ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useBrand } from "@/lib/useBrand";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GeneratedImage { imageBase64: string; mimeType: string; }

interface RefImage {
  preview: string;
  source: "upload" | "library";
  file?: File;
  url?: string;
}

interface LibraryImage {
  id: string;
  file_url: string;
  file_name: string;
  tags: string[];
  category: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FORMAT_OPTIONS = [
  { label: "Square 1:1", value: "Square 1:1" },
  { label: "Portrait 9:16", value: "Portrait 9:16" },
  { label: "Landscape 16:9", value: "Landscape 16:9" },
  { label: "Portrait 4:5", value: "Portrait 4:5" },
];

const MODE_OPTIONS = [
  { key: "studio", label: "Studio", icon: "STD" },
  { key: "outdoor_people", label: "Outdoor People", icon: "OUT" },
  { key: "environment", label: "Environment", icon: "ENV" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function resizeImageToBase64(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > h && w > maxSize) { h = (h / w) * maxSize; w = maxSize; }
      else if (h > maxSize) { w = (w / h) * maxSize; h = maxSize; }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85).split(",")[1]);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function getAspectClass(format: string): string {
  if (format.includes("9:16")) return "aspect-[9/16] max-h-[500px]";
  if (format.includes("16:9")) return "aspect-video";
  if (format.includes("4:5")) return "aspect-[4/5]";
  return "aspect-square";
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function ImageArchitectPage() {
  const { brandId } = useBrand();
  /* ---- Reference images (unified) ---- */
  const [refs, setRefs] = useState<RefImage[]>([]);
  const refInputRef = useRef<HTMLInputElement>(null);
  const [refDragOver, setRefDragOver] = useState(false);

  /* ---- Library picker ---- */
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryImages, setLibraryImages] = useState<LibraryImage[]>([]);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryLoading, setLibraryLoading] = useState(false);

  /* ---- Brief form ---- */
  const [mode, setMode] = useState("studio");
  const [subject, setSubject] = useState("");
  const [format, setFormat] = useState("Square 1:1");
  const [colour, setColour] = useState("");
  const [other, setOther] = useState("");

  /* ---- Generation ---- */
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<GeneratedImage | null>(null);
  const [genError, setGenError] = useState<{ error: string; message: string } | null>(null);
  const [savedToLib, setSavedToLib] = useState(false);

  /* ---- Reference file handling ---- */

  const addRefFiles = useCallback((newFiles: FileList | File[]) => {
    const valid = Array.from(newFiles).filter((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase();
      return ["jpg", "jpeg", "png", "webp"].includes(ext || "") && f.size <= 8 * 1024 * 1024;
    });
    setRefs((prev) => {
      const newRefs: RefImage[] = valid.map((f) => ({ preview: URL.createObjectURL(f), source: "upload", file: f }));
      return [...prev, ...newRefs].slice(0, 3);
    });
  }, []);

  const addLibraryRef = useCallback((img: LibraryImage) => {
    setRefs((prev) => {
      if (prev.length >= 3) return prev;
      if (prev.some((r) => r.url === img.file_url)) return prev;
      return [...prev, { preview: img.file_url, source: "library", url: img.file_url }];
    });
  }, []);

  const removeRef = useCallback((index: number) => {
    setRefs((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleRefDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setRefDragOver(false);
    if (e.dataTransfer.files.length) addRefFiles(e.dataTransfer.files);
  }, [addRefFiles]);

  const handleRefFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addRefFiles(e.target.files);
    e.target.value = "";
  }, [addRefFiles]);

  /* ---- Library fetching ---- */

  const fetchLibrary = useCallback(async () => {
    setLibraryLoading(true);
    const { data } = await supabase
      .from("brand_images")
      .select("id, file_url, file_name, tags, category")
      .eq("brand_id", brandId)
      .order("uploaded_at", { ascending: false });
    setLibraryImages(data || []);
    setLibraryLoading(false);
  }, [brandId]);

  useEffect(() => {
    if (showLibrary && libraryImages.length === 0) fetchLibrary();
  }, [showLibrary, libraryImages.length, fetchLibrary]);

  const filteredLibrary = librarySearch
    ? libraryImages.filter((img) => {
        const s = librarySearch.toLowerCase();
        return img.file_name.toLowerCase().includes(s) ||
          img.tags.some((t) => t.toLowerCase().includes(s)) ||
          img.category.toLowerCase().includes(s);
      })
    : libraryImages;

  /* ---- Generate image ---- */

  const urlToBase64 = useCallback(async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.readAsDataURL(blob);
    });
  }, []);

  const generateImage = useCallback(async () => {
    if (!subject.trim() || refs.length === 0) return;
    setGenerating(true); setGenError(null); setGenResult(null); setSavedToLib(false);

    try {
      const base64Refs = await Promise.all(
        refs.map(async (ref) => {
          if (ref.source === "upload" && ref.file) {
            return resizeImageToBase64(ref.file, 600);
          } else if (ref.url) {
            return urlToBase64(ref.url);
          }
          return "";
        })
      );

      const res = await fetch("/api/brand/generate-from-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: base64Refs.filter(Boolean),
          brief: { subject, format, colour, mode, other },
          dna: null,
        }),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch {
        setGenError({ error: "api_error", message: `Server error: ${text.slice(0, 100)}` });
        return;
      }
      if (!res.ok || data.error) {
        setGenError({ error: data.error || "api_error", message: data.message || "Image generation failed" });
        return;
      }
      setGenResult(data);
    } catch (err) {
      setGenError({ error: "api_error", message: err instanceof Error ? err.message : "Image generation failed" });
    } finally {
      setGenerating(false);
    }
  }, [subject, refs, format, colour, mode, other, urlToBase64]);

  /* ---- Actions ---- */

  const downloadImage = useCallback(() => {
    if (!genResult) return;
    const byteChars = atob(genResult.imageBase64);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
    const blob = new Blob([byteArray], { type: genResult.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brand-image-${Date.now()}.jpg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [genResult]);

  const saveToLibrary = useCallback(async () => {
    if (!genResult) return;
    try {
      const byteChars = atob(genResult.imageBase64);
      const byteArray = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArray], { type: "image/jpeg" });
      const fileName = `generated-${Date.now()}.jpg`;
      const path = `${brandId}/${fileName}`;

      await supabase.storage.from("brand-images").upload(path, blob, { upsert: true });
      const { data: urlData } = supabase.storage.from("brand-images").getPublicUrl(path);

      await supabase.from("brand_images").insert({
        brand_id: brandId,
        file_url: urlData.publicUrl,
        file_name: fileName,
        file_size: byteArray.length,
        category: "ai-generated",
        format: format.includes("1:1") ? "square" : format.includes("9:16") ? "story" : format.includes("16:9") ? "landscape" : format.includes("4:5") ? "portrait" : "other",
        campaign_name: "",
        tags: ["ai-generated", "image-architect"],
      });

      setSavedToLib(true);
      setTimeout(() => setSavedToLib(false), 3000);
    } catch (err) {
      console.error("Save to library failed:", err);
    }
  }, [genResult, format, brandId]);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="flex flex-col flex-1 h-full bg-background">
      {/* Header */}
      <div className="px-8 pt-8 pb-5 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/dashboard/brand-library" className="text-on-surface-variant hover:text-primary text-sm font-body">← Brand Library</Link>
        </div>
        <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight mb-2">Image Architect</h1>
        <p className="text-on-surface-variant font-body font-medium text-sm leading-relaxed max-w-lg">Upload reference images and describe what you need. Gemini generates a new image matched to your style.</p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {!genResult ? (
            <>
              {/* Reference images */}
              <FieldSection label="Reference Images">
                <p className="text-[0.72rem] text-muted mb-3">Upload or choose from your asset library. 1-3 images, Gemini will match the style.</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Upload zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setRefDragOver(true); }}
                    onDragLeave={() => setRefDragOver(false)}
                    onDrop={handleRefDrop}
                    onClick={() => refInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-all py-10 ${refDragOver ? "border-primary bg-primary-container/30" : "border-outline-variant/40 bg-surface-container-low hover:bg-surface-container-high/50"}`}
                  >
                    <input ref={refInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" multiple className="hidden" onChange={handleRefFileChange} />
                    <svg className="h-7 w-7 text-on-surface-variant/40 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3.75 3.75 0 013.57 5.595H6.75z" />
                    </svg>
                    <span className="font-body text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">Upload images</span>
                  </div>

                  {/* Library picker button */}
                  <button
                    onClick={() => setShowLibrary(!showLibrary)}
                    className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-all py-10 ${showLibrary ? "border-primary bg-primary-container/30" : "border-outline-variant/40 bg-surface-container-low hover:bg-surface-container-high/50"}`}
                  >
                    <svg className="h-7 w-7 text-on-surface-variant/40 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                    <span className="font-body text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">Choose from library</span>
                  </button>
                </div>

                {/* Library picker panel */}
                {showLibrary && (
                  <div className="mb-3 border border-light rounded-lg bg-white overflow-hidden">
                    <div className="px-3 py-2 border-b border-light bg-pale">
                      <input
                        value={librarySearch}
                        onChange={(e) => setLibrarySearch(e.target.value)}
                        placeholder="Search by tag, name, or category…"
                        className="w-full bg-white border border-light rounded-md px-3 py-1.5 text-[0.72rem] text-ink outline-none focus:border-brand-orange placeholder:text-muted/50"
                      />
                    </div>
                    <div className="max-h-[240px] overflow-y-auto p-2">
                      {libraryLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="h-5 w-5 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
                        </div>
                      ) : filteredLibrary.length === 0 ? (
                        <p className="text-center text-[0.72rem] text-muted py-6">
                          {librarySearch ? "No images match your search" : "No images in your library yet"}
                        </p>
                      ) : (
                        <div className="grid grid-cols-4 gap-1.5">
                          {filteredLibrary.map((img) => {
                            const isSelected = refs.some((r) => r.url === img.file_url);
                            return (
                              <button
                                key={img.id}
                                onClick={() => addLibraryRef(img)}
                                disabled={isSelected || refs.length >= 3}
                                className={`relative aspect-square rounded-md overflow-hidden transition-all ${isSelected ? "ring-2 ring-brand-orange opacity-60" : refs.length >= 3 ? "opacity-30 cursor-not-allowed" : "hover:ring-2 hover:ring-brand-orange/50"}`}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={img.file_url} alt={img.file_name} className="w-full h-full object-cover" />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-brand-orange/20 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">✓</span>
                                  </div>
                                )}
                                {img.tags.length > 0 && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
                                    <span className="font-mono text-[0.4rem] text-white truncate block">{img.tags.join(", ")}</span>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Selected references */}
                {refs.length > 0 && (
                  <div className="flex gap-2 mb-1">
                    {refs.map((ref, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden bg-pale group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ref.preview} alt={`ref ${i + 1}`} className="w-full h-full object-cover" />
                        <button onClick={() => removeRef(i)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white text-[0.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-center">
                          <span className="font-mono text-[0.4rem] text-white">{ref.source === "library" ? "Library" : "Upload"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <span className="font-mono text-[0.55rem] text-muted">{refs.length}/3 reference images</span>
              </FieldSection>

              {/* Brief form */}
              <FieldSection label="Scene Mode">
                <div className="flex gap-2">
                  {MODE_OPTIONS.map((m) => (
                    <Chip key={m.key} label={`${m.icon} ${m.label}`} active={mode === m.key} onClick={() => setMode(m.key)} />
                  ))}
                </div>
              </FieldSection>

              <FieldSection label="Subject" required>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Who or what is in the image? (e.g. a confident young woman · a group of three friends)" className="form-input" />
              </FieldSection>

              <FieldSection label="Content Format">
                <div className="flex flex-wrap gap-2">
                  {FORMAT_OPTIONS.map((opt) => (
                    <Chip key={opt.value} label={opt.label} active={format === opt.value} onClick={() => setFormat(opt.value)} />
                  ))}
                </div>
              </FieldSection>

              <FieldSection label="Colour / Wardrobe">
                <input value={colour} onChange={(e) => setColour(e.target.value)} placeholder="e.g. bright orange oversized hoodie · all-white linen · bold yellow streetwear" className="form-input" />
              </FieldSection>

              <FieldSection label="Anything Else">
                <textarea value={other} onChange={(e) => setOther(e.target.value)} rows={2} placeholder="Additional details — props, angle, text overlay space, specific scenario…" className="form-input resize-y" />
              </FieldSection>

              {/* Errors */}
              {genError && (
                <div className={`px-4 py-3 rounded-lg mb-4 text-[0.78rem] ${genError.error === "safety_block" ? "bg-amber-50 border border-amber-200 text-amber-700" : "bg-red-50 border border-red-200 text-red-600"}`}>
                  {genError.message}
                </div>
              )}

              {/* Generate button */}
              <button
                onClick={generateImage}
                disabled={!subject.trim() || refs.length === 0 || generating}
                className="w-full py-5 rounded-2xl bg-primary text-white font-headline font-extrabold text-base shadow-primary-glow disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97] flex items-center justify-center gap-2.5"
              >
                {generating ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Generating image...
                  </>
                ) : "Generate Architect Vision"}
              </button>

              {/* Loading placeholder */}
              {generating && (
                <div className={`mt-6 rounded-xl bg-pale flex flex-col items-center justify-center ${getAspectClass(format)} animate-pulse`}>
                  <p className="text-[0.82rem] text-muted font-medium mb-1">Generating your image…</p>
                  <p className="text-[0.65rem] text-muted/60 max-w-xs text-center">Gemini is studying your reference and creating a new image in the same style</p>
                </div>
              )}
            </>
          ) : (
            /* ---- Generated image output ---- */
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:${genResult.mimeType};base64,${genResult.imageBase64}`}
                alt="Generated brand image"
                className="w-full rounded-xl mb-2"
              />
              <p className="text-[0.65rem] text-muted mb-6 text-center">Generated with Gemini · matched to your reference style</p>

              {/* Action buttons */}
              <div className="flex gap-3 mb-6">
                <button onClick={downloadImage} className="flex-1 py-3 rounded-lg bg-brand-orange text-white font-mono text-[0.7rem] uppercase tracking-wide hover:bg-brand-orange-hover transition-all">
                  Download image
                </button>
                <button onClick={saveToLibrary} className="flex-1 py-3 rounded-lg border border-light text-mid font-mono text-[0.7rem] uppercase tracking-wide hover:border-brand-orange hover:text-brand-orange transition-all">
                  {savedToLib ? "Saved to library ✓" : "Save to library"}
                </button>
                <button onClick={() => { setGenResult(null); setGenError(null); generateImage(); }} className="px-6 py-3 rounded-lg bg-pale text-muted font-mono text-[0.7rem] uppercase tracking-wide hover:text-ink transition-all">
                  Regenerate
                </button>
              </div>

              <button onClick={() => { setGenResult(null); setGenError(null); }} className="text-[0.72rem] text-muted hover:text-brand-orange transition-colors">
                ← Back to form
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .form-input {
          width: 100%;
          border: 2px solid transparent;
          border-radius: 1rem;
          padding: 1rem 1.25rem;
          font-size: 0.875rem;
          color: #1a1c1e;
          background: #f3f6fc;
          outline: none;
          transition: all 0.2s;
          font-family: var(--font-manrope), Manrope, var(--font-dm-sans), sans-serif;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }
        .form-input:focus { background: #fff; border-color: rgba(236, 92, 54, 0.3); }
        .form-input::placeholder { color: rgba(68, 71, 78, 0.4); }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function FieldSection({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
        {label}
        {required && <span className="text-primary text-[10px] font-bold uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">Required</span>}
      </label>
      {children}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 rounded-2xl font-body font-bold text-xs transition-all active:scale-95 ${
        active
          ? "bg-primary text-white shadow-lg shadow-primary/20"
          : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
      }`}
    >
      {label}
    </button>
  );
}
