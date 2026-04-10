"use client";

import { useState, useRef, useCallback, useEffect, DragEvent, ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";

interface FileItem {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  category: string;
  tags: string[];
  uploaded_at: string;
}

interface FileLibraryProps {
  category: string;
  accept: string;
  acceptLabel: string;
  maxSize: number;
  icon: string;
  emptyMessage: string;
  previewType: "image" | "video" | "audio" | "file";
}

const DEFAULT_BRAND_ID = "default";

export default function FileLibrary({ category, accept, acceptLabel, maxSize, icon, emptyMessage, previewType, brandId = DEFAULT_BRAND_ID }: FileLibraryProps & { brandId?: string }) {
  const BRAND_ID = brandId;
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTags, setEditTags] = useState("");
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("brand_images")
      .select("*")
      .eq("brand_id", BRAND_ID)
      .eq("category", category)
      .order("uploaded_at", { ascending: false });
    setFiles(data || []);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, BRAND_ID]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const uploadFiles = useCallback(async (fileList: FileList | File[]) => {
    const valid = Array.from(fileList).filter((f) => f.size <= maxSize * 1024 * 1024);
    if (valid.length === 0) return;

    setUploading(true);
    for (const file of valid) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const path = `${BRAND_ID}/${category}/${uniqueName}`;

      const { error } = await supabase.storage.from("brand-images").upload(path, file, { upsert: true });
      if (error) continue;

      const { data: urlData } = supabase.storage.from("brand-images").getPublicUrl(path);

      await supabase.from("brand_images").insert({
        brand_id: BRAND_ID,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        category,
        format: "other",
        campaign_name: "",
        tags: [category],
      });
    }
    setUploading(false);
    fetchFiles();
  }, [category, maxSize, fetchFiles, BRAND_ID]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files);
    e.target.value = "";
  }, [uploadFiles]);

  const copyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1500);
  }, []);

  const deleteFile = useCallback(async (item: FileItem) => {
    const urlParts = item.file_url.split("/brand-images/");
    if (urlParts[1]) {
      await supabase.storage.from("brand-images").remove([decodeURIComponent(urlParts[1])]);
    }
    await supabase.from("brand_images").delete().eq("id", item.id);
    setFiles((prev) => prev.filter((f) => f.id !== item.id));
  }, []);

  const startEditTags = useCallback((item: FileItem) => {
    setEditingId(item.id);
    setEditTags((item.tags || []).join(", "));
  }, []);

  const saveEditTags = useCallback(async () => {
    if (!editingId) return;
    const tags = editTags.split(",").map((t) => t.trim()).filter(Boolean);
    await supabase.from("brand_images").update({ tags }).eq("id", editingId);
    setFiles((prev) => prev.map((f) => (f.id === editingId ? { ...f, tags } : f)));
    setEditingId(null);
  }, [editingId, editTags]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Filter
  const filtered = files.filter((f) => {
    if (!filterText) return true;
    const q = filterText.toLowerCase();
    return f.file_name.toLowerCase().includes(q) || (f.tags || []).some((t) => t.toLowerCase().includes(q));
  });

  return (
    <div>
      {/* Search / filter */}
      <div className="mb-4">
        <input
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Search by name or tag..."
          className="w-full max-w-xs px-3 py-1.5 text-[0.78rem] border border-light rounded-md outline-none focus:border-brand-orange bg-white text-ink placeholder:text-muted"
        />
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-all py-8 mb-6 ${
          dragOver ? "border-brand-orange bg-brand-orange-pale" : "border-light bg-pale/40 hover:border-brand-orange hover:bg-brand-orange-pale/40"
        }`}
      >
        <input ref={inputRef} type="file" accept={accept} multiple className="hidden" onChange={handleChange} />
        {uploading ? (
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
            <span className="font-mono text-[0.65rem] text-muted">Uploading...</span>
          </div>
        ) : (
          <>
            <span className="text-lg mb-2 text-muted">{icon}</span>
            <span className="font-mono text-[0.65rem] tracking-wide uppercase text-muted">Drop files here or click to browse</span>
            <span className="font-mono text-[0.5rem] text-muted/60 mt-1">{acceptLabel} · Max {maxSize}MB</span>
          </>
        )}
      </div>

      {/* Tag edit modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setEditingId(null)}>
          <div className="bg-white rounded-lg p-5 w-[340px] shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="text-[0.82rem] font-semibold text-ink mb-1">Edit tags</div>
            <div className="text-[0.7rem] text-muted mb-3">Comma-separated. e.g. campaign, hero, streamerx</div>
            <input
              autoFocus
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveEditTags(); }}
              className="w-full px-3 py-2 text-[0.78rem] border border-light rounded-md outline-none focus:border-brand-orange text-ink mb-3"
              placeholder="tag1, tag2, tag3"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-[0.72rem] border border-light rounded-md text-muted hover:text-ink">Cancel</button>
              <button onClick={saveEditTags} className="px-3 py-1.5 text-[0.72rem] bg-brand-orange text-white rounded-md font-medium">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* File grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[0.78rem] text-muted">{filterText ? "No files match your search" : emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group bg-white border border-light rounded-lg overflow-hidden hover:border-brand-orange hover:shadow-[0_1px_8px_rgba(232,86,42,0.08)] transition-all"
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Preview */}
              <div className="relative aspect-square bg-pale flex items-center justify-center cursor-pointer" onClick={() => setPreviewItem(item)}>
                {previewType === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.file_url} alt={item.file_name} className="w-full h-full object-cover" />
                ) : previewType === "video" ? (
                  <video src={item.file_url} className="w-full h-full object-cover" muted />
                ) : previewType === "audio" ? (
                  <div className="flex flex-col items-center gap-2 p-2">
                    <span className="text-2xl text-muted">SND</span>
                    <audio src={item.file_url} controls className="w-[90%]" onClick={(e) => e.stopPropagation()} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl text-muted">{icon}</span>
                    <span className="font-mono text-[0.5rem] text-muted">{item.file_name.split(".").pop()?.toUpperCase()}</span>
                  </div>
                )}

                {/* Hover overlay */}
                {hoveredId === item.id && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                    <div className="flex gap-1.5 flex-wrap justify-center">
                      <a href={item.file_url} download={item.file_name} onClick={e => e.stopPropagation()} className="px-2 py-1 rounded bg-white/20 text-white font-mono text-[0.5rem] uppercase hover:bg-white/30 no-underline">
                        Download
                      </a>
                      <button onClick={() => copyUrl(item.file_url)} className="px-2 py-1 rounded bg-white/20 text-white font-mono text-[0.5rem] uppercase hover:bg-white/30">
                        {copiedUrl === item.file_url ? "Copied" : "Copy URL"}
                      </button>
                      <button onClick={() => startEditTags(item)} className="px-2 py-1 rounded bg-white/20 text-white font-mono text-[0.5rem] uppercase hover:bg-white/30">
                        Edit tags
                      </button>
                      <button onClick={() => deleteFile(item)} className="px-2 py-1 rounded bg-red-500/60 text-white font-mono text-[0.5rem] uppercase hover:bg-red-500/80">
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Info + tags */}
              <div className="px-2.5 py-2">
                <div className="text-[0.7rem] text-ink truncate">{item.file_name}</div>
                <div className="font-mono text-[0.5rem] text-muted mb-1.5">{formatSize(item.file_size)}</div>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag, i) => (
                      <span key={i} className="text-[0.5rem] font-mono px-1.5 py-0.5 rounded bg-pale text-muted border border-light">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {previewItem && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-8"
          onClick={() => setPreviewItem(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            {previewType === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewItem.file_url} alt={previewItem.file_name} className="max-w-full max-h-[75vh] object-contain rounded-lg" />
            ) : previewType === "video" ? (
              <video src={previewItem.file_url} controls autoPlay className="max-w-full max-h-[75vh] rounded-lg" />
            ) : previewType === "audio" ? (
              <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
                <div className="text-4xl text-muted">SND</div>
                <div className="text-sm font-medium text-ink">{previewItem.file_name}</div>
                <audio src={previewItem.file_url} controls autoPlay className="w-80" />
              </div>
            ) : (
              <div className="bg-white rounded-lg p-8 text-center">
                <div className="text-4xl text-muted mb-3">{icon}</div>
                <div className="text-sm font-medium text-ink">{previewItem.file_name}</div>
              </div>
            )}
            <div className="mt-3 flex items-center gap-3">
              <span className="text-white text-sm">{previewItem.file_name}</span>
              <a href={previewItem.file_url} download={previewItem.file_name} className="px-3 py-1.5 rounded-md bg-white/20 text-white text-xs font-medium hover:bg-white/30 no-underline">Download</a>
              <button onClick={() => { navigator.clipboard.writeText(previewItem.file_url); }} className="px-3 py-1.5 rounded-md bg-white/20 text-white text-xs font-medium hover:bg-white/30">Copy URL</button>
            </div>
            <button onClick={() => setPreviewItem(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-lg hover:bg-black/70">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}
