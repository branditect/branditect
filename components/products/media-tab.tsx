"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/icon";
import { docRoleLabelKey, fileSize, isVideo, UNTAG_NOTE_KEY } from "@/lib/product-attachments";
import ProductPicker from "@/components/products/product-picker";
import ImagePicker from "@/components/products/image-picker";
import { authedFetch, authedJson } from "@/lib/authed-fetch";
import { useT } from "@/lib/i18n/use-t.tsx";

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
 * The counts are derived from the rows on screen rather than from
 * catalog_products.image_count, which is written once and never maintained,
 * so the number and the grid cannot disagree after an untag.
 *
 * TAGGING GOES BOTH WAYS NOW — inbox entry 6a. It used to go one way: you
 * could tag an image to a product from Knowledge ▸ Images, and this tab was a
 * read-only view of that decision whose own empty state told you to go and
 * make it somewhere else, with no link. "Tag images" opens the same chooser
 * *Change product image* uses, in its multi-select mode, and posts to the
 * same `/api/products/attachments` endpoint the Images side posts to. One
 * endpoint, one chooser, two directions.
 *
 * DOCUMENTS DO NOT WORK THIS WAY AND CANNOT YET. Nothing anywhere in this
 * app inserts into `product_documents` — not this tab, not Knowledge ▸
 * Documents, not the API, whose POST takes imageIds only. The Documents
 * empty state used to name tagging as something you do elsewhere; there is
 * no elsewhere. Its copy says what is true instead, and the gap is in the
 * report rather than papered over with a link to a screen that cannot do it.
 */
export default function MediaTab({
  productId, brandId, onCounts,
}: {
  productId: string;
  brandId: string;
  onCounts?: (c: { images: number; documents: number }) => void;
}) {
  const t = useT();
  const [images, setImages] = useState<MediaImage[] | null>(null);
  const [documents, setDocuments] = useState<MediaDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [untagging, setUntagging] = useState<string | null>(null);
  /* Criterion 8: the same picker the Images screen opens, from the other end.
     An image tagged here shows on that image's tile in Knowledge too. */
  const [tagMoreFor, setTagMoreFor] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<MediaImage | null>(null);
  /* Entry 6a: tagging from this side, into this product. */
  const [picking, setPicking] = useState(false);
  const [tagging, setTagging] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await authedFetch(
        `/api/products/attachments?product_id=${encodeURIComponent(productId)}&brand_id=${encodeURIComponent(brandId)}`,
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error === "not_found" ? t("media.notAvailable") : data.error || t("media.couldNotLoad")); return; }
      setImages(data.images ?? []);
      setDocuments(data.documents ?? []);
      onCounts?.({ images: data.imageCount ?? 0, documents: data.documentCount ?? 0 });
    } catch {
      setError(t("media.couldNotLoad"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t changes identity every render; the words it returns only change with the locale, which reloads the page
  }, [productId, brandId, onCounts]);

  useEffect(() => { void load(); }, [load]);

  const untag = useCallback(async (kind: "image" | "document", id: string) => {
    setUntagging(id);
    try {
      const q = kind === "image" ? `image_id=${id}` : `document_id=${id}`;
      const res = await authedFetch(
        `/api/products/attachments?product_id=${encodeURIComponent(productId)}&brand_id=${encodeURIComponent(brandId)}&${q}`,
        { method: "DELETE" },
      );
      if (!res.ok) { setError(t("media.couldNotUntag")); return; }
      // Reload rather than splicing, so the count and the grid come from the
      // same read and cannot drift.
      await load();
    } finally {
      setUntagging(null);
    }
  }, [productId, brandId, load]);

  /**
   * Tag chosen library images to this product.
   *
   * The same endpoint the Images screen posts to, with the arguments the
   * other way round: many images, one product. It skips pairs that already
   * exist server-side, so a double-tag is a no-op rather than a failed batch.
   */
  const tagImages = useCallback(async (imageIds: string[]) => {
    if (!imageIds.length) return;
    setTagging(true);
    setError(null);
    try {
      const res = await authedJson("/api/products/attachments", "POST", {
        imageIds, productIds: [productId],
      });
      const json = await res.json().catch(() => ({}));
      // fetch resolves on 4xx and 5xx. Reading json without checking res.ok
      // is how a tag reports success and writes nothing.
      if (!res.ok) { setError(json.error ?? t("media.couldNotTag")); return; }
      setPicking(false);
      await load();
    } catch {
      setError(t("media.couldNotTag"));
    } finally {
      setTagging(false);
    }
  }, [productId, load]);

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
          <h4 className="text-sm font-bold tracking-[-0.15px]">{t("media.imagesAndVideo")}</h4>
          {!loading && (
            <span className="rounded-pill bg-tile px-2 py-0.5 text-micro font-bold tabular-nums text-muted">
              {images.length}
            </span>
          )}
          {/* In the header as well as in the empty state: once there is one
              image the empty state is gone, and adding a second should not
              mean emptying the first. */}
          {!loading && images.length > 0 && (
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="ml-auto rounded-tile border border-rule-2 px-2.5 py-1 text-2xs font-bold text-ink-2 hover:border-accent-line hover:text-accent-dark"
            >
              {t("media.tagImages")}
            </button>
          )}
        </div>

        {loading ? (
          <p className="mt-2 text-2xs font-medium text-muted">{t("common.loading")}</p>
        ) : images.length === 0 ? (
          /* The empty state names the fix AND offers it. Naming an action
             with no control attached is worse than saying nothing, because
             the reader assumes they have missed a button. */
          <div className="mt-2 rounded-card border border-dashed border-rule-2 bg-tile px-3.5 py-4">
            <p className="text-xs font-semibold text-ink-2">{t("media.noImages")}</p>
            <p className="mt-1 text-2xs font-medium leading-[1.5] text-muted">
              {t("media.tagImagesHelp")}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPicking(true)}
                className="rounded-tile bg-grad-mark px-3 py-1.5 text-2xs font-bold text-white"
              >
                {t("media.tagImages")}
              </button>
              <Link
                href="/studio/create-images"
                className="text-2xs font-semibold text-accent underline underline-offset-2"
              >
                {t("media.createInStudio")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-2 grid grid-cols-4 gap-2">
            {images.map((img) => (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-tile border border-rule-2">
                <button
                  type="button"
                  onClick={() => setLightbox(img)}
                  className="block h-full w-full"
                  aria-label={t("media.openFile", { name: img.file_name })}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.file_url} alt={img.file_name} className="h-full w-full object-cover" />
                </button>
                {img.is_primary && (
                  <span className="pointer-events-none absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.5px] text-white">
                    {t("media.primary")}
                  </span>
                )}
                {isVideo(img) && (
                  <span className="pointer-events-none absolute inset-0 grid place-items-center text-white">
                    <Icon name="arrow" size={18} />
                  </span>
                )}
                <button
                  type="button"
                  title={t("media.tagToAnother")}
                  aria-label={t("media.tagToAnotherNamed", { file_name: img.file_name })}
                  onClick={() => setTagMoreFor(img.id)}
                  className="absolute left-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink/70 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <Icon name="plus" size={9} />
                </button>
                <button
                  type="button"
                  title={t(UNTAG_NOTE_KEY)}
                  aria-label={t("media.untagFile", { name: img.file_name })}
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
          <h4 className="text-sm font-bold tracking-[-0.15px]">{t("media.documents")}</h4>
          {!loading && (
            <span className="rounded-pill bg-tile px-2 py-0.5 text-micro font-bold tabular-nums text-muted">
              {documents.length}
            </span>
          )}
        </div>

        {loading ? null : documents.length === 0 ? (
          <div className="mt-2 rounded-card border border-dashed border-rule-2 bg-tile px-3.5 py-4">
            <p className="text-xs font-semibold text-ink-2">{t("media.noDocuments")}</p>
            {/* It used to say "Tag a safety sheet, a spec or a certificate
                from Knowledge ▸ Documents." Nothing in this app can do that:
                no screen and no endpoint inserts into product_documents. An
                empty state that names an action which exists nowhere sends
                someone hunting for a control that was never built. */}
            <p className="mt-1 text-2xs font-medium leading-[1.5] text-muted">
              {t("media.documentsLiveIn")}{" "}
              <Link href="/knowledge/documents" className="font-semibold text-accent underline underline-offset-2">
                {t("media.knowledgeDocuments")}
              </Link>
              {t("media.docsNotBuiltTail")}
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
                {docRoleLabelKey(d.doc_role) && (
                  <span className="shrink-0 rounded-pill bg-lav-wash px-2 py-0.5 text-micro font-bold text-lav-ink">
                    {t(docRoleLabelKey(d.doc_role)!)}
                  </span>
                )}
                {fileSize(d.file_size) && (
                  <span className="shrink-0 text-micro font-semibold tabular-nums text-faint">
                    {fileSize(d.file_size)}
                  </span>
                )}
                <button type="button" title={t(UNTAG_NOTE_KEY)} aria-label={t("media.untagFile", { name: d.file_name })}
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

      {/* Entry 6b: cut, not attached. UNTAG_NOTE is already the `title` on
          every untag control above — the image × and the document × — so
          the floating copy was a second, weaker statement of a tooltip,
          sitting under a Documents list it did not belong to. Half of it was
          a roadmap promise, and that half stopped being true when tagging
          from the library shipped in 6a. */}

      {lightbox && (
        <div className="fixed inset-0 z-[1300] grid place-items-center bg-ink/70 p-8"
          onClick={() => setLightbox(null)} role="dialog" aria-label={lightbox.file_name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox.file_url} alt={lightbox.file_name}
            className="max-h-full max-w-full rounded-panel object-contain" />
        </div>
      )}
      {picking && (
        <ImagePicker
          brandId={brandId}
          mode="multi"
          busy={tagging}
          alreadyPicked={(images ?? []).map((i) => i.id)}
          onPickMany={(ids) => void tagImages(ids)}
          onClose={() => { if (!tagging) setPicking(false); }}
        />
      )}
      {tagMoreFor && (
        <ProductPicker
          brandId={brandId}
          imageIds={[tagMoreFor]}
          onClose={() => setTagMoreFor(null)}
          onTagged={() => { setTagMoreFor(null); void load(); }}
        />
      )}
    </>
  );
}
