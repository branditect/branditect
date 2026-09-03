"use client";

import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/icon";
import { docRoleLabel, fileSize, isVideo, UNTAG_NOTE } from "@/lib/product-attachments";

interface MediaImage {
  id: string; file_url: string; file_name: string;
  file_size: number | null; category: string | null;
  tags: string[] | null; campaign_name: string | null;
  is_primary: boolean; uploaded_at: string | null;
}
interface MediaDoc {
  id: string; file_url: string; file_name: string;
  file_size?: number | null; doc_role: string | null; uploaded_at?: string | null;
}

/**
 * What is tagged to this product.
 *
 * Read-only for now: tagging arrives in step 3. The counts are derived from
 * the rows on screen rather than from catalog_products.image_count, which is
 * written once and never maintained, so the number and the grid cannot
 * disagree after an untag.
 */
export default function MediaTab({
  productId, brandId, onCounts,
}: {
  productId: string;
  brandId: string;
  onCounts?: (c: { images: number; documents: number }) => void;
}) {
  const [images, setImages] = useState<MediaImage[] | null>(null);
  const [documents, setDocuments] = useState<MediaDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [untagging, setUntagging] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<MediaImage | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(
        `/api/products/attachments?product_id=${encodeURIComponent(productId)}&brand_id=${encodeURIComponent(brandId)}`,
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error === "not_found" ? "Not available." : data.error || "Could not load."); return; }
      setImages(data.images ?? []);
      setDocuments(data.documents ?? []);
      onCounts?.({ images: data.imageCount ?? 0, documents: data.documentCount ?? 0 });
    } catch {
      setError("Could not load.");
    }
  }, [productId, brandId, onCounts]);

  useEffect(() => { void load(); }, [load]);

  const untag = useCallback(async (kind: "image" | "document", id: string) => {
    setUntagging(id);
    try {
      const q = kind === "image" ? `image_id=${id}` : `document_id=${id}`;
      const res = await fetch(
        `/api/products/attachments?product_id=${encodeURIComponent(productId)}&brand_id=${encodeURIComponent(brandId)}&${q}`,
        { method: "DELETE" },
      );
      if (!res.ok) { setError("Could not untag. It is still on this product."); return; }
      // Reload rather than splicing, so the count and the grid come from the
      // same read and cannot drift.
      await load();
    } finally {
      setUntagging(null);
    }
  }, [productId, brandId, load]);

  const loading = images === null || documents === null;

  return (
    <>
      {error && (
        <p role="alert" className="mb-3 rounded-tile bg-tint-1 px-3 py-2 text-2xs font-semibold text-accent-dark">
          {error}
        </p>
      )}

      <section>
        <div className="flex items-baseline gap-2">
          <h4 className="text-sm font-bold tracking-[-0.15px]">Images and video</h4>
          {!loading && (
            <span className="rounded-pill bg-tile px-2 py-0.5 text-micro font-bold tabular-nums text-muted">
              {images.length}
            </span>
          )}
        </div>

        {loading ? (
          <p className="mt-2 text-2xs font-medium text-muted">Loading…</p>
        ) : images.length === 0 ? (
          /* The empty state names the fix rather than the absence. Matching
             from the library arrives in step 3 and lands here. */
          <div className="mt-2 rounded-card border border-dashed border-rule-2 bg-tile px-3.5 py-4">
            <p className="text-xs font-semibold text-ink-2">No images yet.</p>
            <p className="mt-1 text-2xs font-medium leading-[1.5] text-muted">
              Generate some in Studio, or tag existing ones from Knowledge.
            </p>
          </div>
        ) : (
          <div className="mt-2 grid grid-cols-4 gap-2">
            {images.map((img) => (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-tile border border-rule-2">
                <button
                  type="button"
                  onClick={() => setLightbox(img)}
                  className="block h-full w-full"
                  aria-label={`Open ${img.file_name}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.file_url} alt={img.file_name} className="h-full w-full object-cover" />
                </button>
                {img.is_primary && (
                  <span className="pointer-events-none absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.5px] text-white">
                    Primary
                  </span>
                )}
                {isVideo(img) && (
                  <span className="pointer-events-none absolute inset-0 grid place-items-center text-white">
                    <Icon name="arrow" size={18} />
                  </span>
                )}
                <button
                  type="button"
                  title={UNTAG_NOTE}
                  aria-label={`Untag ${img.file_name}`}
                  disabled={untagging === img.id}
                  onClick={() => void untag("image", img.id)}
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink/70 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <Icon name="close" size={9} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-[22px]">
        <div className="flex items-baseline gap-2">
          <h4 className="text-sm font-bold tracking-[-0.15px]">Documents</h4>
          {!loading && (
            <span className="rounded-pill bg-tile px-2 py-0.5 text-micro font-bold tabular-nums text-muted">
              {documents.length}
            </span>
          )}
        </div>

        {loading ? null : documents.length === 0 ? (
          <div className="mt-2 rounded-card border border-dashed border-rule-2 bg-tile px-3.5 py-4">
            <p className="text-xs font-semibold text-ink-2">No documents yet.</p>
            <p className="mt-1 text-2xs font-medium leading-[1.5] text-muted">
              Tag a safety sheet, a spec or a certificate from Knowledge ▸ Documents.
            </p>
          </div>
        ) : (
          /* A list, not a grid: documents are found by their names. */
          <ul className="mt-2 flex flex-col gap-1.5">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center gap-2.5 rounded-card border border-rule-2 px-3 py-2">
                <span className="shrink-0 text-muted-2"><Icon name="doc" size={14} /></span>
                <a href={d.file_url} target="_blank" rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate text-xs font-semibold text-ink-2 hover:text-accent-dark">
                  {d.file_name}
                </a>
                {docRoleLabel(d.doc_role) && (
                  <span className="shrink-0 rounded-pill bg-lav-wash px-2 py-0.5 text-micro font-bold text-lav-ink">
                    {docRoleLabel(d.doc_role)}
                  </span>
                )}
                {fileSize(d.file_size) && (
                  <span className="shrink-0 text-micro font-semibold tabular-nums text-faint">
                    {fileSize(d.file_size)}
                  </span>
                )}
                <button type="button" title={UNTAG_NOTE} aria-label={`Untag ${d.file_name}`}
                  disabled={untagging === d.id}
                  onClick={() => void untag("document", d.id)}
                  className="shrink-0 text-muted-2 hover:text-accent-dark">
                  <Icon name="close" size={11} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-[22px] text-2xs font-medium leading-[1.6] text-muted">
        {UNTAG_NOTE} Tagging more, and matching from your library, arrive next.
      </p>

      {lightbox && (
        <div className="fixed inset-0 z-[1300] grid place-items-center bg-ink/70 p-8"
          onClick={() => setLightbox(null)} role="dialog" aria-label={lightbox.file_name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox.file_url} alt={lightbox.file_name}
            className="max-h-full max-w-full rounded-panel object-contain" />
        </div>
      )}
    </>
  );
}
