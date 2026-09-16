"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useBrand } from "@/lib/useBrand";
import { askedFields, DOC_TYPES } from "@/lib/document-types";
import {
  makeBatch, attachDocument, saveUpdates, undescribedFirst, type Batch,
} from "@/lib/document-batch";
import AskPanel from "@/components/documents/ask-panel";
import { authedFetch } from "@/lib/authed-fetch";
import { useT } from "@/lib/i18n/use-t.tsx";
import Icon from "@/components/icon";
import DeleteDocumentDialog from "@/components/documents/delete-document";
import DocumentPreview from "@/components/documents/document-preview";
import { canDownload, canPreview, previewKindOf } from "@/lib/document-actions";
import { signedUrl } from "@/lib/signed-url";
import type { StringKey } from "@/lib/i18n/index.ts";

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
  // Added by supabase/document-upload-asks.sql. Optional on the type because
  // rows written before that migration have none.
  description?: string | null;
  doc_type?: string | null;
  use_in_output?: boolean | null;
  // A pasted entry has no stored object; its text is the document.
  file_url?: string | null;
  extracted_text?: string | null;
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

// `key` is identity and never translated; `labelKey` is what renders.
const CATEGORIES: { key: CategoryKey; labelKey: StringKey }[] = [
  { key: "all", labelKey: "docs.all" },
  { key: "product-info", labelKey: "docs.productInfo" },
  { key: "company-info", labelKey: "docs.companyInfo" },
  { key: "pricing", labelKey: "site.nav.pricing" },
  { key: "presentations", labelKey: "nav.knowledge.presentations" },
  { key: "other", labelKey: "industry.other" },
];

const ACCEPTED = ".pdf,.pptx,.docx,.xlsx,.jpg,.jpeg,.png,.webp";
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

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

function categoryLabel(key: string, t: (k: StringKey) => string): string {
  const c = CATEGORIES.find((c) => c.key === key);
  if (!c) return key;
  return t(c.labelKey);
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                       */
/* ------------------------------------------------------------------ */

function SkeletonRow({ name }: { name: string }) {
  const t = useT();
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-light rounded-lg">
      <span className="w-10 h-5 bg-pale rounded animate-pulse shrink-0" />
      <span className="flex-1 text-[0.85rem] font-medium text-ink truncate">{name}</span>
      <span className="w-20 h-4 bg-pale rounded animate-pulse shrink-0" />
      <span className="w-8 h-4 bg-pale rounded animate-pulse shrink-0" />
      <span className="flex items-center gap-1.5 text-[0.72rem] text-amber shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse inline-block" />
        {t("common.processing")}
      </span>
      <span className="w-5 h-5 shrink-0" />
    </div>
  );
}

function DocumentRow({
  doc,
  onPreview,
  onDownload,
  onDelete,
  busy,
}: {
  doc: BrandDocument;
  onPreview: (doc: BrandDocument) => void;
  onDownload: (doc: BrandDocument) => void;
  onDelete: (doc: BrandDocument) => void;
  busy: boolean;
}) {
  const t = useT();
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
        {categoryLabel(doc.category, t)}
      </span>

      <span className="shrink-0 text-[0.72rem] text-muted w-10 text-right">
        {doc.pages_count > 0 ? t("documents.pagesShort", { count: doc.pages_count }) : "—"}
      </span>

      {doc.status === "ready" ? (
        <span className="shrink-0 flex items-center gap-1.5 text-[0.72rem] text-emerald-600 w-24">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          {t("docs.indexed")}
        </span>
      ) : doc.status === "error" ? (
        <span className="shrink-0 flex items-center gap-1.5 text-[0.72rem] text-red-500 w-24">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
          {t("docs.error")}
        </span>
      ) : (
        <span className="shrink-0 flex items-center gap-1.5 text-[0.72rem] text-amber w-24">
          <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse shrink-0" />
          {t("common.processing")}
        </span>
      )}

      {/* Look at it, take it away, or delete it. All three are always here:
          an action that cannot be undone should not be easier to find by
          accident than the two that can. */}
      <div className="shrink-0 flex items-center gap-0.5">
        {canPreview(doc) && (
          <button
            onClick={() => onPreview(doc)}
            className="w-7 h-7 flex items-center justify-center rounded-nav text-muted hover:bg-pale hover:text-ink-2 transition-colors"
            title={t("docs.preview")}
            aria-label={t("docs.previewOf", { name: doc.file_name })}
          >
            <Icon name="eye" size={15} />
          </button>
        )}
        {canDownload(doc) && (
          <button
            onClick={() => onDownload(doc)}
            disabled={busy}
            className="w-7 h-7 flex items-center justify-center rounded-nav text-muted hover:bg-pale hover:text-ink-2 transition-colors disabled:opacity-50"
            title={t("common.download")}
            aria-label={`${t("common.download")} ${doc.file_name}`}
          >
            <Icon name="download" size={15} />
          </button>
        )}
        <button
          onClick={() => onDelete(doc)}
          className="w-7 h-7 flex items-center justify-center rounded-nav text-muted hover:bg-red-50 hover:text-red-500 transition-colors"
          title={t("docs.deleteDocument")}
          aria-label={t("docs.deleteTitle", { name: doc.file_name })}
        >
          <Icon name="trash" size={14} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function KnowledgeVaultPage() {
  const t = useT();
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
  // The answers panel. It never gates the upload — see onFilesChosen.
  const [batch, setBatch] = useState<Batch | null>(null);
  const [askSaving, setAskSaving] = useState(false);

  // Preview, download and delete, each with its own state: a failed download
  // must not look like a failed delete.
  const [previewDoc, setPreviewDoc] = useState<BrandDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BrandDocument | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [textOpen, setTextOpen] = useState(false);
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  // The paste path asks for a type, not a category — same list as the file
  // path, so the two cannot drift apart again. Criterion 9.
  const [textDocType, setTextDocType] = useState<string>("other");
  const [textDescription, setTextDescription] = useState("");
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
    // Same trap as /brand/strategy: brandId is the string "default", never
    // undefined, so returning without clearing the flag leaves the page on a
    // spinner that never resolves.
    if (!brandId || brandId === "default") {
      setPageLoading(false);
      return;
    }
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
  async function uploadFiles(files: File[], tempIds?: string[]) {
    setError(null);
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      if (file.size > MAX_BYTES) {
        setError(t("docs.tooBig", { name: file.name }));
        continue;
      }

      // The panel opened with these ids, so the row can be attached to the
      // right line when the insert returns.
      const tempId = tempIds?.[index] ?? Math.random().toString(36).slice(2);
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
            // Criterion 2: the row carries the same guess the panel is showing,
            // so nothing is ever written with a type nobody saw. Criterion 5:
            // category comes from the type, never typed.
            ...askedFields({ filename: file.name }),
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
        setBatch((prev) => (prev ? attachDocument(prev, tempId, docRow.id as string) : prev));

        // 4. Fire extract (async — updates row on server, we update UI when done)
        authedFetch("/api/vault/extract", {
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
        const msg = err instanceof Error ? err.message : t("docs.uploadFailed");
        setError(t("docs.uploadFailedNamed", { name: file.name, msg }));
      }
    }
  }

  // Save text entry
  async function saveTextEntry() {
    setTextError(null);
    if (!textTitle.trim()) { setTextError(t("docs.needTitle")); return; }
    if (!textContent.trim()) { setTextError(t("docs.needContent")); return; }
    setTextSaving(true);
    try {
      const pagesCount = Math.max(1, Math.ceil(textContent.length / 3000));
      const { data: docRow, error: insertErr } = await supabase
        .from("brand_documents")
        .insert({
          brand_id: brandId,
          file_name: textTitle.trim(),
          file_type: "txt",
          // Criterion 9: the same builder as the file path, so the two rows
          // cannot drift apart again.
          ...askedFields({ docTypeId: textDocType, description: textDescription }),
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
      setTextDocType("other");
      setTextDescription("");
    } catch (err) {
      setTextError(err instanceof Error ? err.message : t("channels.errSave"));
    }
    setTextSaving(false);
  }

  /**
   * Delete, and know whether it happened.
   *
   * The row goes first and is read back: a DELETE that RLS filters out
   * resolves `{ error: null }` and removes nothing, so the absence of an error
   * is not evidence — the same trap as the settings writes. Only once a row
   * has actually come back is the object removed, because a row pointing at a
   * missing file is worse than a file with no row.
   */
  async function confirmDelete() {
    const doc = deleteTarget;
    if (!doc) return;
    setDeleteBusy(true);
    setDeleteError(null);

    const { data: removed, error: rowErr } = await supabase
      .from("brand_documents").delete().eq("id", doc.id).select("id");
    if (rowErr) {
      setDeleteError(t("docs.deleteFailed", { message: rowErr.message }));
      setDeleteBusy(false);
      return;
    }
    if (!removed || removed.length === 0) {
      setDeleteError(t("docs.deleteBlocked"));
      setDeleteBusy(false);
      return;
    }

    if (doc.storage_path) {
      // An orphaned object is untidy; a row that outlives its file is a broken
      // document in the list. So this is reported, not rolled back.
      const { error: fileErr } = await supabase.storage.from("brand-documents").remove([doc.storage_path]);
      if (fileErr) console.error("[documents] file left behind:", fileErr.message);
    }

    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    setDeleteBusy(false);
    setDeleteTarget(null);
  }

  /** The bucket is private, so every file needs a signed, expiring URL. */
  async function urlFor(doc: BrandDocument): Promise<string | null> {
    return signedUrl(supabase, "brand-documents", {
      storagePath: doc.storage_path || null,
      fileUrl: doc.file_url ?? null,
    });
  }

  async function openPreview(doc: BrandDocument) {
    setPreviewDoc(doc);
    setPreviewUrl(null);
    setPreviewText(null);
    setPreviewError(null);
    setPreviewLoading(true);
    const kind = previewKindOf(doc);
    try {
      if (kind === "pdf" || kind === "image") {
        const url = await urlFor(doc);
        if (!url) throw new Error(t("docs.previewNothing"));
        setPreviewUrl(url);
      } else {
        // extracted_text is not in the list query: it is large, and this is
        // the only screen that reads it.
        const { data, error: textErr } = await supabase
          .from("brand_documents").select("extracted_text").eq("id", doc.id).maybeSingle();
        if (textErr) throw new Error(textErr.message);
        setPreviewText(data?.extracted_text ?? null);
        if (doc.storage_path) setPreviewUrl(await urlFor(doc));
      }
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : String(e));
    } finally {
      setPreviewLoading(false);
    }
  }

  async function downloadDocument(doc: BrandDocument) {
    setDownloadingId(doc.id);
    try {
      const url = await urlFor(doc);
      if (!url) throw new Error(doc.file_name);
      // The signed URL is what the browser fetches; `download` names the file
      // so it does not land as a storage key.
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_name;
      a.rel = "noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      setActionError(t("docs.downloadFailed", { message: e instanceof Error ? e.message : String(e) }));
    } finally {
      setDownloadingId(null);
    }
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
    if (files.length) onFilesChosen(files);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length) onFilesChosen(files);
    e.target.value = "";
  }

  /**
   * CRITERION 1. The panel opens and the bytes start moving in the same tick.
   * uploadFiles is deliberately not awaited: awaiting it here would hold a
   * 40 MB PDF until someone finished typing, which is how a person learns to
   * hit Skip every time.
   */
  function onFilesChosen(files: File[]) {
    const tempIds = files.map(() => Math.random().toString(36).slice(2));
    setBatch(makeBatch(files.map((f, i) => ({ tempId: tempIds[i], name: f.name }))));
    void uploadFiles(files, tempIds);
  }

  /** Save patches rows that already exist. Files still in flight are picked up
   *  by a second pass once their inserts have returned. */
  async function saveAsks() {
    if (!batch) return;
    setAskSaving(true);
    const updates = saveUpdates(batch);
    for (const u of updates) {
      const { error: upErr } = await supabase
        .from("brand_documents")
        .update(u.fields)
        .eq("id", u.documentId)
        .eq("brand_id", brandId);
      // supabase-js resolves with an error rather than throwing, so an
      // unchecked call reports success and saves nothing.
      if (upErr) { setError(upErr.message); setAskSaving(false); return; }
      setDocuments((prev) =>
        prev.map((d) => (d.id === u.documentId ? { ...d, ...u.fields } as BrandDocument : d)));
    }
    setAskSaving(false);
    setBatch(null);
  }

  /** CRITERION 4. Skip writes nothing: the rows already carry the guessed type,
   *  and a null description is what keeps them in the Not described yet queue. */
  function skipAsks() {
    setBatch(null);
  }

  // Derived stats
  const indexedDocs = documents.filter((d) => d.status === "ready");
  const totalPages = indexedDocs.reduce((sum, d) => sum + (d.pages_count || 0), 0);
  const hasProcessing =
    uploading.length > 0 || documents.some((d) => d.status === "processing");
  // Identity codes; the label is looked up where it renders.
  const vaultStatus: "building" | "active" | "empty" =
    indexedDocs.length > 0
      ? hasProcessing
        ? "building"
        : "active"
      : documents.length > 0 || uploading.length > 0
      ? "building"
      : "empty";
  const vaultStatusColor =
    vaultStatus === "active"
      ? "text-emerald-600"
      : vaultStatus === "building"
      ? "text-amber"
      : "text-muted";

  // Filtered documents
  const filteredDocs =
    filter === "all"
      ? documents
      : documents.filter((d) => d.category === filter);

  if (brandLoading || pageLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-muted text-[0.85rem]">{t("docs.loadingVault")}</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-7 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[1.35rem] font-semibold text-ink tracking-tight">
          {t("docs.vaultTitle")}
        </h1>
        <p className="text-[0.82rem] text-muted mt-1">
          {t("docs.vaultIntro")}
        </p>
      </div>

      {/* Rule bar */}
      <div
        className="rounded-lg border px-4 py-3 mb-6"
        style={{ background: "#fdf1ed", borderColor: "#f5c4b0" }}
      >
        <p className="text-[0.8rem] text-ink leading-relaxed">
          <span className="font-semibold text-brand-orange">{t("docs.aiOnlyRule")}</span>{" "}
          {t("docs.onlyTheseDocs")}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-light rounded-lg px-5 py-4">
          <div className="text-[1.6rem] font-semibold text-ink leading-none">
            {indexedDocs.length}
          </div>
          <div className="text-[0.75rem] text-muted mt-1.5">{t("docs.documentsIndexed")}</div>
        </div>
        <div className="bg-white border border-light rounded-lg px-5 py-4">
          <div className="text-[1.6rem] font-semibold text-ink leading-none">
            {totalPages}
          </div>
          <div className="text-[0.75rem] text-muted mt-1.5">{t("docs.pagesProcessed")}</div>
        </div>
        <div className="bg-white border border-light rounded-lg px-5 py-4">
          <div className={`text-[1.6rem] font-semibold leading-none ${vaultStatusColor}`}>
            {vaultStatus === "empty" ? t("notes.emptyPreview")
              : vaultStatus === "active" ? t("docs.active") : t("docs.building")}
          </div>
          <div className="text-[0.75rem] text-muted mt-1.5">{t("docs.vaultStatus")}</div>
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
            {t(cat.labelKey)}
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
            {t("docs.dropFilesOr")}{" "}
            <span className="text-brand-orange underline">{t("documents.browse")}</span>
          </p>
          <p className="text-[0.75rem] text-muted">
            {t("docs.acceptedFiles")}
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
          <span className="text-[0.82rem] font-medium text-ink">{t("docs.writeText")}</span>
          <span className="text-[0.72rem] text-muted">{t("docs.pasteOrType")}</span>
        </button>
      </div>

      {/* Text editor modal */}
      {textOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-xl flex flex-col shadow-xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-light">
              <span className="text-[0.95rem] font-semibold text-ink">{t("docs.addTextToVault")}</span>
              <button
                onClick={() => { setTextOpen(false); setTextError(null); }}
                className="text-muted hover:text-ink text-xl leading-none"
              >×</button>
            </div>

            {/* Modal body */}
            <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
              {/* Title */}
              <div>
                <label className="block text-[0.76rem] font-medium text-muted mb-1.5">{t("docs.title")}</label>
                <input
                  type="text"
                  value={textTitle}
                  onChange={e => setTextTitle(e.target.value)}
                  placeholder={t("docs.titlePlaceholder")}
                  className="w-full border border-light rounded-lg px-3 py-2 text-[0.85rem] text-ink outline-none focus:border-brand-orange transition-colors"
                />
              </div>

              {/* Type — the category is derived from it. Criterion 5. */}
              <div>
                <label className="block text-[0.76rem] font-medium text-muted mb-1.5">{t("common.type")}</label>
                <select
                  value={textDocType}
                  onChange={e => setTextDocType(e.target.value)}
                  className="w-full border border-light rounded-lg px-3 py-2 text-[0.85rem] text-ink outline-none focus:border-brand-orange bg-white transition-colors"
                >
                  {DOC_TYPES.map(c => (
                    <option key={c.id} value={c.id}>{t(c.labelKey)}</option>
                  ))}
                </select>
              </div>

              {/* The same question the file path asks, in the same words. */}
              <div>
                <label className="block text-[0.76rem] font-medium text-muted mb-1.5">
                  {t("docs.whatIsThis")}
                </label>
                <textarea
                  rows={2}
                  value={textDescription}
                  onChange={e => setTextDescription(e.target.value)}
                  placeholder={t("docs.typeHelp")}
                  className="w-full border border-light rounded-lg px-3 py-2 text-[0.85rem] text-ink outline-none focus:border-brand-orange bg-white transition-colors"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-[0.76rem] font-medium text-muted mb-1.5">{t("docs.content")}</label>
                <textarea
                  value={textContent}
                  onChange={e => setTextContent(e.target.value)}
                  placeholder={t("docs.contentPlaceholder")}
                  rows={12}
                  className="w-full border border-light rounded-lg px-3 py-2.5 text-[0.85rem] text-ink outline-none focus:border-brand-orange transition-colors resize-none leading-relaxed"
                />
                <div className="text-[0.7rem] text-muted text-right mt-1">
                  {t("documents.chars", { count: textContent.length.toLocaleString() })}
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
                {t("common.cancel")}
              </button>
              <button
                onClick={saveTextEntry}
                disabled={textSaving}
                className="flex-2 px-6 py-2 rounded-lg bg-brand-orange text-white text-[0.82rem] font-medium hover:bg-brand-orange-hover transition-all disabled:opacity-50"
              >
                {textSaving ? t("settings.saving") : t("docs.saveToVault")}
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

      {/* CRITERION 1: this is already on screen while the bytes are moving. */}
      {batch && (
        <AskPanel
          batch={batch}
          onChange={setBatch}
          onSave={saveAsks}
          onSkip={skipAsks}
          saving={askSaving}
        />
      )}

      {/* Document list */}
      {uploading.length === 0 &&
      (filter === "all" ? documents : filteredDocs).length === 0 ? (
        <div className="py-12 text-center text-muted text-[0.82rem]">
          {documents.length === 0 ? t("docs.none") : t("docs.noneInCategory")}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Uploading skeletons */}
          {uploading.map((u) => (
            <SkeletonRow key={u.tempId} name={u.name} />
          ))}

          {/* Loaded documents */}
          {/* CRITERION 4: files with no description wait at the top — a queue,
              not a scolding. */}
          {undescribedFirst(filter === "all" ? documents : filteredDocs).map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              busy={downloadingId === doc.id}
              onPreview={openPreview}
              onDownload={downloadDocument}
              onDelete={(d) => { setDeleteError(null); setDeleteTarget(d); }}
            />
          ))}
        </div>
      )}

      {actionError && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600" role="alert">
          {actionError}
        </p>
      )}

      {previewDoc && (
        <DocumentPreview
          doc={previewDoc}
          url={previewUrl}
          text={previewText}
          loading={previewLoading}
          error={previewError}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {deleteTarget && (
        <DeleteDocumentDialog
          fileName={deleteTarget.file_name}
          busy={deleteBusy}
          error={deleteError}
          onCancel={() => { setDeleteTarget(null); setDeleteError(null); }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
