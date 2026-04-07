"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useBrand } from "@/lib/useBrand";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface BrandDocument {
  id: string;
  brand_id: string;
  file_name: string;
  file_type: string;
  category: string;
  storage_path: string;
  pages_count: number;
  status: "processing" | "ready" | "error";
  created_at: string;
}

interface UploadingFile {
  tempId: string;
  name: string;
}

type CategoryKey =
  | "all"
  | "product-info"
  | "company-info"
  | "pricing"
  | "presentations"
  | "other";

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "product-info", label: "Product info" },
  { key: "company-info", label: "Company info" },
  { key: "pricing", label: "Pricing" },
  { key: "presentations", label: "Presentations" },
  { key: "other", label: "Other" },
];

const ACCEPTED = ".pdf,.pptx,.docx,.xlsx,.jpg,.jpeg,.png,.webp";
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function detectCategory(filename: string): string {
  const lower = filename.toLowerCase();
  if (/product|service|catalogue|catalog|offering|range/.test(lower))
    return "product-info";
  if (/pric|rate|fee|invoice|cost|tariff/.test(lower)) return "pricing";
  if (/company|about|team|brand|mission|vision|annual|report|overview/.test(lower))
    return "company-info";
  if (/present|deck|slide|pitch|pptx/.test(lower)) return "presentations";
  return "other";
}

function fileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "file";
}

function fileTypeBadge(ext: string): string {
  switch (ext) {
    case "pdf":
      return "bg-[#FEE2E2] text-[#DC2626]";
    case "pptx":
      return "bg-[#FEF3C7] text-[#D97706]";
    case "docx":
      return "bg-[#DBEAFE] text-[#2563EB]";
    case "xlsx":
      return "bg-[#D1FAE5] text-[#059669]";
    case "jpg":
    case "jpeg":
    case "png":
    case "webp":
      return "bg-[#EDE9FE] text-[#7C3AED]";
    case "txt":
      return "bg-[#CFFAFE] text-[#0891B2]";
    default:
      return "bg-pale text-muted";
  }
}

function categoryLabel(key: string): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                       */
/* ------------------------------------------------------------------ */

function SkeletonRow({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-light rounded-lg">
      <span className="w-10 h-5 bg-pale rounded animate-pulse shrink-0" />
      <span className="flex-1 text-[0.85rem] font-medium text-ink truncate">{name}</span>
      <span className="w-20 h-4 bg-pale rounded animate-pulse shrink-0" />
      <span className="w-8 h-4 bg-pale rounded animate-pulse shrink-0" />
      <span className="flex items-center gap-1.5 text-[0.72rem] text-amber-600 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
        Processing…
      </span>
      <span className="w-5 h-5 shrink-0" />
    </div>
  );
}

function DocumentRow({
  doc,
  onDelete,
}: {
  doc: BrandDocument;
  onDelete: (id: string, storagePath: string) => void;
}) {
  const ext = doc.file_type || fileExtension(doc.file_name);
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-light rounded-lg hover:border-muted transition-all group">
      <span
        className={`shrink-0 text-[0.6rem] font-mono font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${fileTypeBadge(
          ext
        )}`}
      >
        {ext}
      </span>

      <span className="flex-1 text-[0.85rem] font-medium text-ink truncate min-w-0">
        {doc.file_name}
      </span>

      <span className="shrink-0 text-[0.72rem] text-muted bg-pale border border-light rounded px-2 py-0.5">
        {categoryLabel(doc.category)}
      </span>

      <span className="shrink-0 text-[0.72rem] text-muted w-10 text-right">
        {doc.pages_count > 0 ? `${doc.pages_count}p` : "—"}
      </span>

      {doc.status === "ready" ? (
        <span className="shrink-0 flex items-center gap-1.5 text-[0.72rem] text-emerald-600 w-24">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          Indexed
        </span>
      ) : doc.status === "error" ? (
        <span className="shrink-0 flex items-center gap-1.5 text-[0.72rem] text-red-500 w-24">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
          Error
        </span>
      ) : (
        <span className="shrink-0 flex items-center gap-1.5 text-[0.72rem] text-amber-600 w-24">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          Processing…
        </span>
      )}

      <button
        onClick={() => onDelete(doc.id, doc.storage_path)}
        className="shrink-0 w-6 h-6 flex items-center justify-center text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 text-lg leading-none"
        title="Delete document"
      >
        ×
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function KnowledgeVaultPage() {
  const router = useRouter();
  const { brandId, loading: brandLoading } = useBrand();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<BrandDocument[]>([]);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [filter, setFilter] = useState<CategoryKey>("all");
  const [dragOver, setDragOver] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Text editor
  const [textOpen, setTextOpen] = useState(false);
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [textCategory, setTextCategory] = useState<CategoryKey>("other");
  const [textSaving, setTextSaving] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/login");
    });
  }, [router]);

  // Load documents
  const loadDocuments = useCallback(async () => {
    if (!brandId || brandId === "default") return;
    setPageLoading(true);
    const { data, error: fetchErr } = await supabase
      .from("brand_documents")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false });

    if (!fetchErr && data) {
      setDocuments(data as BrandDocument[]);
    }
    setPageLoading(false);
  }, [brandId]);

  useEffect(() => {
    if (!brandLoading && brandId) loadDocuments();
  }, [brandLoading, brandId, loadDocuments]);

  // Upload files
  async function uploadFiles(files: File[]) {
    setError(null);
    for (const file of files) {
      if (file.size > MAX_BYTES) {
        setError(`${file.name} exceeds the 50 MB limit.`);
        continue;
      }

      const tempId = Math.random().toString(36).slice(2);
      const ext = fileExtension(file.name);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${brandId}/${Date.now()}_${safeName}`;

      setUploading((prev) => [...prev, { tempId, name: file.name }]);

      try {
        // 1. Upload to storage
        const { error: storageErr } = await supabase.storage
          .from("brand-documents")
          .upload(storagePath, file, { contentType: file.type });

        if (storageErr) throw new Error(storageErr.message);

        // 2. Insert DB row
        const { data: docRow, error: insertErr } = await supabase
          .from("brand_documents")
          .insert({
            brand_id: brandId,
            file_name: file.name,
            file_type: ext,
            category: detectCategory(file.name),
            storage_path: storagePath,
            status: "processing",
            pages_count: 0,
          })
          .select()
          .single();

        if (insertErr) throw new Error(insertErr.message);

        // 3. Show document as processing
        setUploading((prev) => prev.filter((u) => u.tempId !== tempId));
        setDocuments((prev) => [docRow as BrandDocument, ...prev]);

        // 4. Fire extract (async — updates row on server, we update UI when done)
        fetch("/api/vault/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId: docRow.id,
            storagePath,
            brandId,
          }),
        })
          .then(async (res) => {
            if (res.ok) {
              const result = await res.json() as {
                pages_count?: number;
              };
              setDocuments((prev) =>
                prev.map((d) =>
                  d.id === docRow.id
                    ? {
                        ...d,
                        status: "ready",
                        pages_count: result.pages_count ?? 0,
                      }
                    : d
                )
              );
            } else {
              setDocuments((prev) =>
                prev.map((d) =>
                  d.id === docRow.id ? { ...d, status: "error" } : d
                )
              );
            }
          })
          .catch(() => {
            setDocuments((prev) =>
              prev.map((d) =>
                d.id === docRow.id ? { ...d, status: "error" } : d
              )
            );
          });
      } catch (err) {
        setUploading((prev) => prev.filter((u) => u.tempId !== tempId));
        const msg = err instanceof Error ? err.message : "Upload failed";
        setError(`Failed to upload ${file.name}: ${msg}`);
      }
    }
  }

  // Save text entry
  async function saveTextEntry() {
    setTextError(null);
    if (!textTitle.trim()) { setTextError("Please add a title."); return; }
    if (!textContent.trim()) { setTextError("Please add some content."); return; }
    setTextSaving(true);
    try {
      const pagesCount = Math.max(1, Math.ceil(textContent.length / 3000));
      const { data: docRow, error: insertErr } = await supabase
        .from("brand_documents")
        .insert({
          brand_id: brandId,
          file_name: textTitle.trim(),
          file_type: "txt",
          category: textCategory,
          storage_path: "",
          status: "ready",
          extracted_text: textContent.trim(),
          pages_count: pagesCount,
        })
        .select()
        .single();

      if (insertErr) throw new Error(insertErr.message);
      setDocuments((prev) => [docRow as BrandDocument, ...prev]);
      setTextOpen(false);
      setTextTitle("");
      setTextContent("");
      setTextCategory("other");
    } catch (err) {
      setTextError(err instanceof Error ? err.message : "Save failed");
    }
    setTextSaving(false);
  }

  // Delete document
  async function deleteDocument(id: string, storagePath: string) {
    // Skip storage removal for text entries (no file stored)
    if (storagePath) {
      await supabase.storage.from("brand-documents").remove([storagePath]);
    }
    await supabase.from("brand_documents").delete().eq("id", id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  // Drag & drop handlers
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      /\.(pdf|pptx|docx|xlsx|jpg|jpeg|png|webp)$/i.test(f.name)
    );
    if (files.length) uploadFiles(files);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length) uploadFiles(files);
    e.target.value = "";
  }

  // Derived stats
  const indexedDocs = documents.filter((d) => d.status === "ready");
  const totalPages = indexedDocs.reduce((sum, d) => sum + (d.pages_count || 0), 0);
  const hasProcessing =
    uploading.length > 0 || documents.some((d) => d.status === "processing");
  const vaultStatus =
    indexedDocs.length > 0
      ? hasProcessing
        ? "Building…"
        : "Active"
      : documents.length > 0 || uploading.length > 0
      ? "Building…"
      : "Empty";
  const vaultStatusColor =
    vaultStatus === "Active"
      ? "text-emerald-600"
      : vaultStatus === "Building…"
      ? "text-amber-600"
      : "text-muted";

  // Filtered documents
  const filteredDocs =
    filter === "all"
      ? documents
      : documents.filter((d) => d.category === filter);

  if (brandLoading || pageLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-muted text-[0.85rem]">Loading vault…</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-7 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[1.35rem] font-semibold text-ink tracking-tight">
          Brand Knowledge Vault
        </h1>
        <p className="text-[0.82rem] text-muted mt-1">
          Upload brand documents. AI will use only this information when generating content.
        </p>
      </div>

      {/* Rule bar */}
      <div
        className="rounded-lg border px-4 py-3 mb-6"
        style={{ background: "#fdf1ed", borderColor: "#f5c4b0" }}
      >
        <p className="text-[0.8rem] text-ink leading-relaxed">
          <span className="font-semibold text-brand-orange">AI-only rule:</span>{" "}
          Branditect will only use information found in these documents. It will never
          invent product names, features, pricing, or company facts. If information is
          not in the vault, it will ask rather than guess.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-light rounded-lg px-5 py-4">
          <div className="text-[1.6rem] font-semibold text-ink leading-none">
            {indexedDocs.length}
          </div>
          <div className="text-[0.75rem] text-muted mt-1.5">Documents indexed</div>
        </div>
        <div className="bg-white border border-light rounded-lg px-5 py-4">
          <div className="text-[1.6rem] font-semibold text-ink leading-none">
            {totalPages}
          </div>
          <div className="text-[0.75rem] text-muted mt-1.5">Pages processed</div>
        </div>
        <div className="bg-white border border-light rounded-lg px-5 py-4">
          <div className={`text-[1.6rem] font-semibold leading-none ${vaultStatusColor}`}>
            {vaultStatus}
          </div>
          <div className="text-[0.75rem] text-muted mt-1.5">Vault status</div>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 flex-wrap mb-5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setFilter(cat.key)}
            className={`px-3 py-1.5 rounded-full text-[0.76rem] font-medium border transition-all ${
              filter === cat.key
                ? "bg-brand-orange text-white border-brand-orange"
                : "bg-white text-mid border-light hover:border-muted hover:text-ink"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Upload + text entry row */}
      <div className="flex gap-3 mb-5 items-stretch">
        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 border-2 border-dashed rounded-lg p-7 text-center cursor-pointer transition-all ${
            dragOver
              ? "border-brand-orange bg-brand-orange-pale"
              : "border-light bg-pale hover:border-muted"
          }`}
        >
          <div className="text-2xl mb-2 text-muted select-none">⬆</div>
          <p className="text-[0.85rem] font-medium text-ink mb-1">
            Drop files here or{" "}
            <span className="text-brand-orange underline">browse</span>
          </p>
          <p className="text-[0.75rem] text-muted">
            PDF, JPEG, PNG, PPTX, DOCX, XLSX — max 50 MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Write text button */}
        <button
          onClick={() => setTextOpen(true)}
          className="w-44 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-light rounded-lg bg-pale hover:border-muted transition-all shrink-0"
        >
          <span className="text-2xl text-muted select-none">✎</span>
          <span className="text-[0.82rem] font-medium text-ink">Write text</span>
          <span className="text-[0.72rem] text-muted">Paste or type notes</span>
        </button>
      </div>

      {/* Text editor modal */}
      {textOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-xl flex flex-col shadow-xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-light">
              <span className="text-[0.95rem] font-semibold text-ink">Add text to vault</span>
              <button
                onClick={() => { setTextOpen(false); setTextError(null); }}
                className="text-muted hover:text-ink text-xl leading-none"
              >×</button>
            </div>

            {/* Modal body */}
            <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
              {/* Title */}
              <div>
                <label className="block text-[0.76rem] font-medium text-muted mb-1.5">Title</label>
                <input
                  type="text"
                  value={textTitle}
                  onChange={e => setTextTitle(e.target.value)}
                  placeholder="e.g. Product launch notes, Pricing overview…"
                  className="w-full border border-light rounded-lg px-3 py-2 text-[0.85rem] text-ink outline-none focus:border-brand-orange transition-colors"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-[0.76rem] font-medium text-muted mb-1.5">Category</label>
                <select
                  value={textCategory}
                  onChange={e => setTextCategory(e.target.value as CategoryKey)}
                  className="w-full border border-light rounded-lg px-3 py-2 text-[0.85rem] text-ink outline-none focus:border-brand-orange bg-white transition-colors"
                >
                  {CATEGORIES.filter(c => c.key !== "all").map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Content */}
              <div>
                <label className="block text-[0.76rem] font-medium text-muted mb-1.5">Content</label>
                <textarea
                  value={textContent}
                  onChange={e => setTextContent(e.target.value)}
                  placeholder="Paste or write your brand information here — product details, pricing, company info, talking points…"
                  rows={12}
                  className="w-full border border-light rounded-lg px-3 py-2.5 text-[0.85rem] text-ink outline-none focus:border-brand-orange transition-colors resize-none leading-relaxed"
                />
                <div className="text-[0.7rem] text-muted text-right mt-1">
                  {textContent.length.toLocaleString()} chars
                </div>
              </div>

              {textError && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-[0.78rem] text-red-600">
                  {textError}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex gap-2 px-5 py-4 border-t border-light">
              <button
                onClick={() => { setTextOpen(false); setTextError(null); }}
                className="flex-1 py-2 rounded-lg border border-light text-[0.82rem] text-mid hover:border-muted hover:text-ink transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveTextEntry}
                disabled={textSaving}
                className="flex-2 px-6 py-2 rounded-lg bg-brand-orange text-white text-[0.82rem] font-medium hover:bg-brand-orange-hover transition-all disabled:opacity-50"
              >
                {textSaving ? "Saving…" : "Save to vault →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-[0.8rem] text-red-600">
          {error}
        </div>
      )}

      {/* Document list */}
      {uploading.length === 0 &&
      (filter === "all" ? documents : filteredDocs).length === 0 ? (
        <div className="py-12 text-center text-muted text-[0.82rem]">
          {documents.length === 0
            ? "No documents yet. Upload brand files to start building your vault."
            : "No documents in this category."}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Uploading skeletons */}
          {uploading.map((u) => (
            <SkeletonRow key={u.tempId} name={u.name} />
          ))}

          {/* Loaded documents */}
          {(filter === "all" ? documents : filteredDocs).map((doc) => (
            <DocumentRow key={doc.id} doc={doc} onDelete={deleteDocument} />
          ))}
        </div>
      )}
    </div>
  );
}
