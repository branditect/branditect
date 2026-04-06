"use client";

import { useState, useRef, useCallback, useEffect, DragEvent, ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BrandImage {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  category: string;
  format: string;
  campaign_name: string;
  tags: string[];
  uploaded_at: string;
}

interface PendingUpload {
  file: File;
  preview: string;
  category: string;
  format: string;
  campaign_name: string;
  tags: string;
}

const CATEGORIES = ["social", "event", "product", "campaign", "brand", "ai-generated"];
const FORMATS = ["square", "story", "landscape", "portrait", "other"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
// Brand ID is passed as prop or defaults
const DEFAULT_BRAND_ID = "default";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ImageLibrary({ brandId = DEFAULT_BRAND_ID }: { brandId?: string }) {
  const BRAND_ID = brandId;
  const [images, setImages] = useState<BrandImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState("");
  const [filterFormat, setFilterFormat] = useState("");
  const [filterTags, setFilterTags] = useState("");

  // Hover state
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTags, setEditTags] = useState("");

  /* ---- Fetch images ---- */

  const fetchImages = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("brand_images")
      .select("*")
      .eq("brand_id", BRAND_ID)
      .order("uploaded_at", { ascending: false });

    setImages(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  /* ---- File handling ---- */

  const processFiles = useCallback((files: FileList | File[]) => {
    const valid = Array.from(files).filter((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase();
      return ["jpg", "jpeg", "png", "webp"].includes(ext || "") && f.size <= MAX_FILE_SIZE;
    });

    const newPending: PendingUpload[] = valid.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      category: "brand",
      format: "other",
      campaign_name: "",
      tags: "",
    }));

    setPendingUploads((prev) => [...prev, ...newPending]);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processFiles(e.target.files);
    e.target.value = "";
  }, [processFiles]);

  /* ---- Batch form update ---- */

  const updatePending = useCallback((index: number, field: keyof PendingUpload, value: string) => {
    setPendingUploads((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }, []);

  const removePending = useCallback((index: number) => {
    setPendingUploads((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  /* ---- Apply batch settings ---- */

  const [batchCategory, setBatchCategory] = useState("brand");
  const [batchCampaign, setBatchCampaign] = useState("");

  const applyBatchSettings = useCallback(() => {
    setPendingUploads((prev) =>
      prev.map((p) => ({ ...p, category: batchCategory, campaign_name: batchCampaign }))
    );
  }, [batchCategory, batchCampaign]);

  /* ---- Upload ---- */

  const confirmUpload = useCallback(async () => {
    if (pendingUploads.length === 0) return;
    setUploading(true);

    for (const item of pendingUploads) {
      const ext = item.file.name.split(".").pop()?.toLowerCase();
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const path = `${BRAND_ID}/${uniqueName}`;

      const { error: storageError } = await supabase.storage
        .from("brand-images")
        .upload(path, item.file, { upsert: true });

      if (storageError) continue;

      const { data: urlData } = supabase.storage
        .from("brand-images")
        .getPublicUrl(path);

      const tags = item.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await supabase.from("brand_images").insert({
        brand_id: BRAND_ID,
        file_url: urlData.publicUrl,
        file_name: item.file.name,
        file_size: item.file.size,
        category: item.category,
        format: item.format,
        campaign_name: item.campaign_name,
        tags,
      });

      URL.revokeObjectURL(item.preview);
    }

    setPendingUploads([]);
    setUploading(false);
    fetchImages();
  }, [pendingUploads, fetchImages]);

  /* ---- Actions ---- */

  const copyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1500);
  }, []);

  const deleteImage = useCallback(async (img: BrandImage) => {
    // Extract storage path from URL
    const urlParts = img.file_url.split("/brand-images/");
    if (urlParts[1]) {
      await supabase.storage.from("brand-images").remove([decodeURIComponent(urlParts[1])]);
    }
    await supabase.from("brand_images").delete().eq("id", img.id);
    setImages((prev) => prev.filter((i) => i.id !== img.id));
  }, []);

  const startEditTags = useCallback((img: BrandImage) => {
    setEditingId(img.id);
    setEditTags(img.tags.join(", "));
  }, []);

  const saveEditTags = useCallback(async () => {
    if (!editingId) return;
    const tags = editTags.split(",").map((t) => t.trim()).filter(Boolean);
    await supabase.from("brand_images").update({ tags }).eq("id", editingId);
    setImages((prev) => prev.map((i) => (i.id === editingId ? { ...i, tags } : i)));
    setEditingId(null);
  }, [editingId, editTags]);

  /* ---- Filtering ---- */

  const filtered = images.filter((img) => {
    if (filterCategory && img.category !== filterCategory) return false;
    if (filterFormat && img.format !== filterFormat) return false;
    if (filterTags) {
      const search = filterTags.toLowerCase();
      const matchesTags = img.tags.some((t) => t.toLowerCase().includes(search));
      const matchesName = img.file_name.toLowerCase().includes(search);
      const matchesCampaign = img.campaign_name?.toLowerCase().includes(search);
      if (!matchesTags && !matchesName && !matchesCampaign) return false;
    }
    return true;
  });

  /* ---- Render ---- */

  return (
    <div>
      {/* Upload area */}
      <div className="mb-6">
        <div className="font-mono text-[0.58rem] tracking-[0.12em] uppercase text-muted mb-1.5">
          Upload Images
        </div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-all py-8 ${
            dragOver
              ? "border-brand-orange bg-brand-orange-pale"
              : "border-light bg-pale/40 hover:border-brand-orange hover:bg-brand-orange-pale/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <svg className="h-8 w-8 text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
          <span className="font-mono text-[0.65rem] tracking-wide uppercase text-muted">
            Drop images here or click to browse
          </span>
          <span className="font-mono text-[0.5rem] text-muted/60 mt-1">
            JPG, PNG, WEBP · Max 10MB · Bulk upload supported
          </span>
        </div>
      </div>

      {/* Pending uploads form */}
      {pendingUploads.length > 0 && (
        <div className="mb-6 bg-white border border-light rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-light bg-pale flex items-center justify-between">
            <span className="font-mono text-[0.58rem] tracking-wider uppercase text-muted">
              {pendingUploads.length} image{pendingUploads.length > 1 ? "s" : ""} ready
            </span>
            <div className="flex items-center gap-2">
              {pendingUploads.length > 1 && (
                <>
                  <select
                    value={batchCategory}
                    onChange={(e) => setBatchCategory(e.target.value)}
                    className="font-mono text-[0.6rem] border border-light rounded px-2 py-1 text-ink"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    value={batchCampaign}
                    onChange={(e) => setBatchCampaign(e.target.value)}
                    placeholder="Campaign name"
                    className="font-mono text-[0.6rem] border border-light rounded px-2 py-1 text-ink w-[140px]"
                  />
                  <button
                    onClick={applyBatchSettings}
                    className="font-mono text-[0.55rem] uppercase px-2 py-1 rounded bg-pale border border-light text-mid hover:text-ink"
                  >
                    Apply to all
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {pendingUploads.map((item, i) => (
              <div key={i} className="flex gap-4 px-4 py-3 border-b border-light last:border-0">
                {/* Thumbnail */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.preview}
                  alt={item.file.name}
                  className="w-16 h-16 rounded-md object-cover shrink-0"
                />

                <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1.5">
                  <div className="col-span-2">
                    <span className="text-[0.72rem] text-ink font-medium truncate block">{item.file.name}</span>
                    <span className="font-mono text-[0.5rem] text-muted">{(item.file.size / 1024).toFixed(0)} KB</span>
                  </div>
                  <div>
                    <label className="font-mono text-[0.5rem] text-muted uppercase block mb-0.5">Category</label>
                    <select
                      value={item.category}
                      onChange={(e) => updatePending(i, "category", e.target.value)}
                      className="w-full text-[0.7rem] border border-light rounded px-2 py-1 text-ink"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-[0.5rem] text-muted uppercase block mb-0.5">Format</label>
                    <select
                      value={item.format}
                      onChange={(e) => updatePending(i, "format", e.target.value)}
                      className="w-full text-[0.7rem] border border-light rounded px-2 py-1 text-ink"
                    >
                      {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-[0.5rem] text-muted uppercase block mb-0.5">Campaign</label>
                    <input
                      value={item.campaign_name}
                      onChange={(e) => updatePending(i, "campaign_name", e.target.value)}
                      placeholder="Campaign name"
                      className="w-full text-[0.7rem] border border-light rounded px-2 py-1 text-ink"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[0.5rem] text-muted uppercase block mb-0.5">Tags</label>
                    <input
                      value={item.tags}
                      onChange={(e) => updatePending(i, "tags", e.target.value)}
                      placeholder="tag1, tag2, tag3"
                      className="w-full text-[0.7rem] border border-light rounded px-2 py-1 text-ink"
                    />
                  </div>
                </div>

                <button
                  onClick={() => removePending(i)}
                  className="text-muted hover:text-red-500 transition-colors shrink-0 self-start mt-1"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-light bg-pale flex justify-between items-center">
            <button
              onClick={() => { pendingUploads.forEach((p) => URL.revokeObjectURL(p.preview)); setPendingUploads([]); }}
              className="font-mono text-[0.6rem] text-muted hover:text-ink"
            >
              Cancel all
            </button>
            <button
              onClick={confirmUpload}
              disabled={uploading}
              className="px-5 py-2 rounded-lg bg-brand-orange text-white font-mono text-[0.65rem] uppercase tracking-wide hover:bg-brand-orange-hover disabled:opacity-50 transition-all"
            >
              {uploading ? "Uploading..." : `Upload ${pendingUploads.length} image${pendingUploads.length > 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="font-mono text-[0.65rem] border border-light rounded-md px-3 py-1.5 text-ink bg-white"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filterFormat}
          onChange={(e) => setFilterFormat(e.target.value)}
          className="font-mono text-[0.65rem] border border-light rounded-md px-3 py-1.5 text-ink bg-white"
        >
          <option value="">All formats</option>
          {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <input
          value={filterTags}
          onChange={(e) => setFilterTags(e.target.value)}
          placeholder="Search tags, names, campaigns..."
          className="flex-1 min-w-[200px] font-mono text-[0.65rem] border border-light rounded-md px-3 py-1.5 text-ink bg-white placeholder:text-muted/50 focus:outline-none focus:border-brand-orange"
        />
        <span className="font-mono text-[0.55rem] text-muted">
          {filtered.length} image{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Image grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-2xl mb-2">🖼</div>
          <p className="text-[0.78rem] text-muted">
            {images.length === 0 ? "No images uploaded yet. Drop some files above to get started." : "No images match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((img) => (
            <div
              key={img.id}
              className="group bg-white border border-light rounded-lg overflow-hidden hover:border-brand-orange hover:shadow-[0_1px_8px_rgba(232,86,42,0.08)] transition-all"
              onMouseEnter={() => setHoveredId(img.id)}
              onMouseLeave={() => { setHoveredId(null); if (editingId === img.id) { /* keep */ } }}
            >
              {/* Image */}
              <div className="relative aspect-square bg-pale">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.file_url}
                  alt={img.file_name}
                  className="w-full h-full object-cover"
                />

                {/* Hover overlay */}
                {hoveredId === img.id && editingId !== img.id && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 transition-opacity">
                    <span className="text-white text-[0.65rem] font-medium truncate max-w-[90%] px-2">
                      {img.file_name}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => copyUrl(img.file_url)}
                        className="px-2 py-1 rounded bg-white/20 text-white font-mono text-[0.5rem] uppercase hover:bg-white/30"
                      >
                        {copiedUrl === img.file_url ? "Copied ✓" : "Copy URL"}
                      </button>
                      <button
                        onClick={() => startEditTags(img)}
                        className="px-2 py-1 rounded bg-white/20 text-white font-mono text-[0.5rem] uppercase hover:bg-white/30"
                      >
                        Edit tags
                      </button>
                      <button
                        onClick={() => deleteImage(img)}
                        className="px-2 py-1 rounded bg-red-500/60 text-white font-mono text-[0.5rem] uppercase hover:bg-red-500/80"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="px-2.5 py-2">
                {editingId === img.id ? (
                  <div>
                    <input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="tag1, tag2, tag3"
                      className="w-full text-[0.65rem] border border-light rounded px-2 py-1 mb-1.5 text-ink focus:border-brand-orange outline-none"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <button onClick={saveEditTags} className="font-mono text-[0.5rem] px-2 py-0.5 rounded bg-brand-orange text-white">Save</button>
                      <button onClick={() => setEditingId(null)} className="font-mono text-[0.5rem] px-2 py-0.5 rounded bg-pale text-muted border border-light">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-mono text-[0.5rem] uppercase tracking-wide text-brand-orange bg-brand-orange-pale border border-brand-orange-mid px-1 py-px rounded-[3px]">
                        {img.category}
                      </span>
                      <span className="font-mono text-[0.5rem] uppercase tracking-wide text-muted bg-pale border border-light px-1 py-px rounded-[3px]">
                        {img.format}
                      </span>
                    </div>
                    {img.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {img.tags.map((tag, ti) => (
                          <span key={ti} className="font-mono text-[0.48rem] text-mid bg-pale px-1 py-px rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {img.campaign_name && (
                      <div className="font-mono text-[0.48rem] text-muted mt-1 truncate">
                        📁 {img.campaign_name}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
