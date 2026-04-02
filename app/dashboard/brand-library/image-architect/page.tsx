"use client";

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GeneratedImage { imageBase64: string; mimeType: string; }

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
  { key: "studio", label: "Studio", icon: "📸" },
  { key: "outdoor_people", label: "Outdoor People", icon: "🌅" },
  { key: "environment", label: "Environment", icon: "🏙" },
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
  /* ---- Reference images ---- */
  const [refFiles, setRefFiles] = useState<File[]>([]);
  const [refPreviews, setRefPreviews] = useState<string[]>([]);
  const refInputRef = useRef<HTMLInputElement>(null);
  const [refDragOver, setRefDragOver] = useState(false);

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
    setRefFiles((prev) => {
      const combined = [...prev, ...valid].slice(0, 3);
      setRefPreviews(combined.map((f) => URL.createObjectURL(f)));
      return combined;
    });
  }, []);

  const removeRefFile = useCallback((index: number) => {
    setRefFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setRefPreviews(next.map((f) => URL.createObjectURL(f)));
      return next;
    });
  }, []);

  const handleRefDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setRefDragOver(false);
    if (e.dataTransfer.files.length) addRefFiles(e.dataTransfer.files);
  }, [addRefFiles]);

  const handleRefFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addRefFiles(e.target.files);
    e.target.value = "";
  }, [addRefFiles]);

  /* ---- Generate image ---- */

  const generateImage = useCallback(async () => {
    if (!subject.trim() || refFiles.length === 0) return;
    setGenerating(true); setGenError(null); setGenResult(null); setSavedToLib(false);

    try {
      const base64Refs = await Promise.all(refFiles.map((f) => resizeImageToBase64(f, 600)));
      const res = await fetch("/api/brand/generate-from-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: base64Refs,
          brief: { subject, format, colour, mode, other },
          dna: null,
        }),
      });
      const data = await res.json();
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
  }, [subject, refFiles, format, colour, mode, other]);

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
      const path = `vetra/${fileName}`;

      await supabase.storage.from("brand-images").upload(path, blob, { upsert: true });
      const { data: urlData } = supabase.storage.from("brand-images").getPublicUrl(path);

      await supabase.from("brand_images").insert({
        brand_id: "vetra",
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
  }, [genResult, format]);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Header */}
      <div className="px-8 pt-7 pb-4 border-b border-light shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/dashboard/brand-library" className="text-muted hover:text-ink text-[0.75rem]">← Brand Library</Link>
        </div>
        <h1 className="font-display text-[1.5rem] text-ink tracking-tight mb-1">Create from Reference</h1>
        <p className="text-[0.78rem] text-muted">Upload reference images and describe what you need. Gemini generates a new image matched to your style.</p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl">
          {!genResult ? (
            <>
              {/* Reference images */}
              <FieldSection label="Reference Images">
                <p className="text-[0.72rem] text-muted mb-3">Upload 1-3 reference images for Gemini to match the style of.</p>
                <div
                  onDragOver={(e) => { e.preventDefault(); setRefDragOver(true); }}
                  onDragLeave={() => setRefDragOver(false)}
                  onDrop={handleRefDrop}
                  onClick={() => refInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-all py-8 mb-3 ${refDragOver ? "border-brand-orange bg-brand-orange-pale" : "border-light bg-pale/40 hover:border-brand-orange hover:bg-brand-orange-pale/40"}`}
                >
                  <input ref={refInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" multiple className="hidden" onChange={handleRefFileChange} />
                  <svg className="h-7 w-7 text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                  <span className="font-mono text-[0.62rem] tracking-wide uppercase text-muted">Drop reference images here · Max 3</span>
                </div>
                {refPreviews.length > 0 && (
                  <div className="flex gap-2 mb-1">
                    {refPreviews.map((src, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden bg-pale group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`ref ${i + 1}`} className="w-full h-full object-cover" />
                        <button onClick={() => removeRefFile(i)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white text-[0.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <span className="font-mono text-[0.55rem] text-muted">{refFiles.length}/3 reference images</span>
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
                disabled={!subject.trim() || refFiles.length === 0 || generating}
                className="w-full py-4 rounded-lg bg-brand-orange text-white font-medium text-[0.9rem] hover:bg-brand-orange-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Generating image…
                  </>
                ) : "Generate image →"}
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
        .form-input:focus { border-color: #E8562A; }
        .form-input::placeholder { color: #9A9A9A; }
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
        active ? "bg-brand-orange text-white border-brand-orange" : "bg-white text-muted border-light hover:border-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
