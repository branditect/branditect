"use client";

import { useState, useRef, useCallback, useEffect, DragEvent, ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";
import { imageMatches } from "@/lib/product-attachments";
import ProductPicker from "@/components/products/product-picker";
import {
  productsForImage, selectionLabel, passesTagFilter, untaggedCount,
  type PickableProduct,
} from "@/lib/product-picker";
import { authedFetch } from "@/lib/authed-fetch";

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

/* Step 2 of branditect-ui/spec/knowledge-images.md: what a file is for, and
   tagging many at once. Until now the library could show what a product had
   but never what an image was for, and the only way to audit tagging was to
   open every product card in turn. */
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
  /* Criteria 4 and 5. Between them these answer "what have I not done yet". */
  const [filterProduct, setFilterProduct] = useState<string | null>(null);
  const [untaggedOnly, setUntaggedOnly] = useState(false);

  // Hover state
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTags, setEditTags] = useState("");

  // Lightbox
  const [previewImg, setPreviewImg] = useState<BrandImage | null>(null);

  /* What each image is tagged to, and the products to name them. Loaded here
     rather than per tile: forty tiles each fetching their own links is forty
     round trips for one join. */
  const [links, setLinks] = useState<{ product_id: string; image_id: string }[]>([]);
  const [products, setProducts] = useState<PickableProduct[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pickerFor, setPickerFor] = useState<string[] | null>(null);
  const [tagNote, setTagNote] = useState<string | null>(null);

  /* ---- Fetch images ---- */

  const fetchImages = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("brand_images")
      .select("*")
      .eq("brand_id", BRAND_ID)
      .not("category", "in", '("video","audio","graphic","web")')
      .order("uploaded_at", { ascending: false });

    setImages(data || []);
    setLoading(false);
    // BRAND_ID belongs in here. useBrand resolves after the first render, so
    // an empty array froze this on the prop's default of "default", a brand
    // that does not exist, and the grid stayed empty for everyone. The lint
    // warning about this missing dependency had been in the build all along.
  }, [BRAND_ID]);

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
    // BRAND_ID again: without it an upload writes brand_id "default", which
    // under RLS nobody can read back, so the file uploads and then vanishes.
  }, [pendingUploads, fetchImages, BRAND_ID]);

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

  /* ---- What is tagged to what ---- */

  const loadLinks = useCallback(async () => {
    if (!brandId || brandId === "default") return;
    const [l, p] = await Promise.all([
      supabase.from("product_images").select("product_id, image_id").eq("brand_id", brandId),
      supabase.from("catalog_products").select("id, name, sku").eq("brand_id", brandId).order("name"),
    ]);
    // supabase-js resolves { data, error } and never throws, so an unchecked
    // read here would silently render every image as untagged.
    if (!l.error) setLinks((l.data ?? []) as { product_id: string; image_id: string }[]);
    if (!p.error) setProducts((p.data ?? []) as PickableProduct[]);
  }, [brandId]);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  /** The chip's ×. Removes the link, never the file. */
  async function untag(imageId: string, productId: string) {
    const res = await authedFetch(
      `/api/products/attachments?product_id=${productId}&brand_id=${brandId}&image_id=${imageId}`,
      { method: "DELETE" },
    );
    if (!res.ok) { setTagNote("Could not remove that link."); return; }
    await loadLinks();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  /* ---- Filtering ---- */

  /* Everything except the tag filters, so the Untagged count is taken from the
     same set the grid is about to render rather than from all images. A count
     computed over a different set is how a badge reads 14 above twelve tiles. */
  const beforeTagFilters = images.filter((img) => {
    if (filterCategory && img.category !== filterCategory) return false;
    if (filterFormat && img.format !== filterFormat) return false;
    if (filterTags) {
      // Shared with the product picker, so the two boxes behave the same.
      if (!imageMatches(img, filterTags)) return false;
    }
    return true;
  });

  const untaggedHere = untaggedCount(beforeTagFilters, links);

  const filtered = beforeTagFilters.filter((img) =>
    passesTagFilter(img.id, { productId: filterProduct, untaggedOnly }, links),
  );

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
        <div>
        {/* All products ▾ and Untagged N. Two controls, one question. */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <select
            value={filterProduct ?? ""}
            onChange={(e) => { setFilterProduct(e.target.value || null); setUntaggedOnly(false); }}
            aria-label="Filter by product"
            className="text-[13px] font-semibold border border-light rounded-md px-2 py-1.5 bg-white text-ink"
          >
            <option value="">All products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => { setUntaggedOnly((v) => !v); setFilterProduct(null); }}
            aria-pressed={untaggedOnly}
            className={`text-[13px] font-semibold rounded-md px-2.5 py-1.5 border ${
              untaggedOnly
                ? "bg-brand-orange border-brand-orange text-white"
                : "bg-white border-light text-ink hover:border-brand-orange"
            }`}
          >
            Untagged <span data-untagged-count>{untaggedHere}</span>
          </button>
          <span className="text-[13px] text-muted" data-shown-count>
            {filtered.length} of {images.length} images
          </span>
        </div>

        {/* Select many, tag once. There is an existing library of untagged
            images; tagging forty of them one at a time is not something a
            person does twice. */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-lg bg-ink text-white">
            <span className="text-[13px] font-bold">{selectionLabel(selected.size)}</span>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setPickerFor(Array.from(selected))}
              className="text-[13px] font-bold rounded-md px-3 py-1.5 bg-brand-orange text-white"
            >
              Tag to a product
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              aria-label="Clear selection"
              className="text-[13px] font-bold rounded-md px-2 py-1.5 bg-white/15 hover:bg-white/25"
            >
              ✕
            </button>
          </div>
        )}
        {tagNote && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-600">
            {tagNote}
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((img) => (
            <div
              key={img.id}
              className="group bg-white border border-light rounded-lg overflow-hidden hover:border-brand-orange hover:shadow-[0_1px_8px_rgba(232,86,42,0.08)] transition-all"
              onMouseEnter={() => setHoveredId(img.id)}
              onMouseLeave={() => { setHoveredId(null); if (editingId === img.id) { /* keep */ } }}
            >
              {/* Image */}
              <div className="relative aspect-square bg-pale cursor-pointer" onClick={() => setPreviewImg(img)}>
                {/* Selecting is its own control rather than the whole tile:
                    clicking the picture already opens the lightbox, and taking
                    that over would trade one gesture for another. */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleSelect(img.id); }}
                  aria-label={selected.has(img.id) ? `Deselect ${img.file_name}` : `Select ${img.file_name}`}
                  aria-pressed={selected.has(img.id)}
                  className={`absolute top-1.5 left-1.5 z-10 grid place-items-center w-6 h-6 rounded-md border text-[12px] font-bold ${
                    selected.has(img.id)
                      ? "bg-brand-orange border-brand-orange text-white"
                      : "bg-white/85 border-light text-transparent hover:text-muted"
                  }`}
                >
                  ✓
                </button>
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
                      <a
                        href={img.file_url}
                        download={img.file_name}
                        onClick={e => e.stopPropagation()}
                        className="px-2 py-1 rounded bg-white/20 text-white font-mono text-[0.5rem] uppercase hover:bg-white/30 no-underline"
                      >
                        Download
                      </a>
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

                    {/* The half that is usually left out, and the half that
                        makes the library trustworthy: what this file is FOR.
                        Without it you can see what a product has but never
                        what an image belongs to. */}
                    <div className="mt-2 pt-2 border-t border-light">
                      <div className="text-[12px] font-semibold text-muted mb-1">On these products</div>
                      {(() => {
                        const on = productsForImage(img.id, links, products);
                        if (on.length === 0) {
                          return (
                            <button
                              type="button"
                              onClick={() => setPickerFor([img.id])}
                              className="w-full text-[12px] font-semibold text-muted border border-dashed border-light rounded-md px-2 py-1.5 hover:text-brand-orange hover:border-brand-orange"
                            >
                              Tag to a product
                            </button>
                          );
                        }
                        return (
                          <div className="flex flex-wrap gap-1 items-center">
                            {on.map((prod) => (
                              <span
                                key={prod.id}
                                className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink bg-pale border border-light rounded px-1.5 py-0.5"
                              >
                                {prod.name}
                                <button
                                  type="button"
                                  onClick={() => untag(img.id, prod.id)}
                                  aria-label={`Remove ${prod.name} from ${img.file_name}`}
                                  title="Removes the link, not the file."
                                  className="text-muted hover:text-red-600 leading-none"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            <button
                              type="button"
                              onClick={() => setPickerFor([img.id])}
                              className="text-[12px] font-semibold text-muted border border-dashed border-light rounded px-1.5 py-0.5 hover:text-brand-orange hover:border-brand-orange"
                            >
                              Tag to a product
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        </div>
      )}

      {/* One component, three entry points — a tile, a selection, and the
          product card's Media tab. Criterion 8. */}
      {pickerFor && (
        <ProductPicker
          brandId={brandId}
          imageIds={pickerFor}
          onClose={() => setPickerFor(null)}
          onTagged={async () => {
            setPickerFor(null);
            setSelected(new Set());
            setTagNote(null);
            await loadLinks();
          }}
        />
      )}

      {/* Lightbox */}
      {previewImg && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-8"
          onClick={() => setPreviewImg(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImg.file_url}
              alt={previewImg.file_name}
              className="w-full h-full object-contain rounded-lg"
              style={{ maxHeight: '80vh' }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 rounded-b-lg px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-white text-sm font-medium">{previewImg.file_name}</div>
                <div className="text-white/50 text-xs mt-0.5">
                  {previewImg.tags?.length > 0 && previewImg.tags.join(', ')}
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={previewImg.file_url}
                  download={previewImg.file_name}
                  className="px-3 py-1.5 rounded-md bg-white/20 text-white text-xs font-medium hover:bg-white/30 no-underline"
                >
                  Download
                </a>
                <button
                  onClick={() => { navigator.clipboard.writeText(previewImg.file_url); }}
                  className="px-3 py-1.5 rounded-md bg-white/20 text-white text-xs font-medium hover:bg-white/30"
                >
                  Copy URL
                </button>
              </div>
            </div>
            <button
              onClick={() => setPreviewImg(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-lg hover:bg-black/70"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
