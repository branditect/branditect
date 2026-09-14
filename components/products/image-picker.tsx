"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { IMAGE_SEARCH_COLUMNS, imageMatches } from "@/lib/product-attachments";
import Icon from "@/components/icon";
import { useT } from "@/lib/i18n/use-t.tsx";

interface BrandImage {
  id: string;
  file_url: string;
  file_name: string;
  category: string;
  /* Without these the search box could not match a tag, while the box two
     screens away could. Same-looking control, different behaviour. */
  tags: string[] | null;
  campaign_name: string | null;
}

/**
 * Pick from the brand's image library.
 *
 * Reads brand_images directly rather than duplicating an uploader — Knowledge
 * ▸ Images is the one home for images, and this is a chooser, not a second
 * place to put files.
 *
 * TWO MODES, ONE CHOOSER. `single` returns one image for the product hero,
 * which is what *Change product image* has always used. `multi` returns
 * several, which is what the Media tab needs to tag images to a product —
 * inbox entry 6a. A second modal that also browsed brand_images would be the
 * third grid over the same table and the one nobody keeps in step; the
 * ProductPicker beside this file carries the same note for the same reason.
 *
 * Only the footer, the title and what a tile click does change between them.
 */
export default function ImagePicker({
  brandId,
  currentUrl,
  onPick,
  onClose,
  mode = "single",
  alreadyPicked,
  busy = false,
  onPickMany,
}: {
  brandId: string;
  currentUrl?: string | null;
  /**
   * Both, not just the URL. note_blocks.image_id is a foreign key with
   * ON DELETE SET NULL, and that is what lets a note survive its picture being
   * deleted from Knowledge — a block holding only a URL would render a broken
   * image instead. Callers that want the URL alone can ignore the id.
   *
   * Single mode only.
   */
  onPick?: (picked: { id: string; url: string } | null) => void;
  onClose: () => void;
  mode?: "single" | "multi";
  /**
   * Multi mode. Images already tagged to this product — shown as already
   * there and not selectable, rather than hidden. Hiding them makes the grid
   * disagree with Knowledge, and someone looking for an image they know they
   * have concludes it is gone.
   */
  alreadyPicked?: string[];
  /** Multi mode. Keeps the modal open and the button honest while it saves. */
  busy?: boolean;
  /** Multi mode. Closing is the caller's to do, after the write succeeds. */
  onPickMany?: (ids: string[]) => void;
}) {
  const t = useT();
  const [images, setImages] = useState<BrandImage[] | null>(null);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const multi = mode === "multi";
  const taken = new Set(alreadyPicked ?? []);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab" && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("brand_images")
      .select(IMAGE_SEARCH_COLUMNS)
      .eq("brand_id", brandId)
      .order("uploaded_at", { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setImages((data as BrandImage[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [brandId]);

  // The same match the library uses, from one place, so the two boxes cannot
  // drift apart again.
  const shown = (images ?? []).filter((i) => imageMatches(i, query));

  return (
    <div
      className="fixed inset-0 z-[1200] grid place-items-center bg-ink/25 p-8 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={multi ? "Tag images to this product" : t("picker.chooseImage")}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-[720px] flex-col overflow-hidden rounded-panel border border-rule bg-card shadow-[0_24px_60px_-20px_rgba(20,20,26,.35)]"
      >
        <div className="flex items-center gap-3 border-b border-rule px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-h3 font-bold">
              {multi ? "Tag images to this product" : t("picker.chooseImage")}
            </h2>
            <p className="mt-0.5 text-xs font-normal text-muted-2">
              {multi
                ? "From your image library. They show under Images and video on this product."
                : t("picker.intro")}
            </p>
          </div>
          <label className="ml-auto flex h-9 w-[190px] items-center gap-2 rounded-tile border border-rule-2 px-3 focus-within:border-accent-line">
            <span className="shrink-0 text-faint">
              <Icon name="search" size={14} />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("picker.searchPlaceholder")}
              aria-label={t("picker.search")}
              className="w-full border-0 bg-transparent p-0 text-sm text-ink placeholder:text-faint focus:outline-none"
            />
          </label>
          <button
            ref={closeRef}
            type="button"
            aria-label={t("common.close")}
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-tile hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Icon name="close" size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {images === null && <p className="text-sm text-muted">{t("picker.loading")}</p>}

          {images !== null && images.length === 0 && (
            <div className="rounded-card border border-rule bg-tile p-6 text-center">
              <p className="text-sm font-semibold text-ink">{t("picker.empty")}</p>
              <p className="mx-auto mt-1.5 max-w-[46ch] text-xs font-medium leading-[1.6] text-muted">
                Product shots live in Knowledge ▸ Images so the image creator can read them. Upload
                some there and they&apos;ll appear here.
              </p>
              <Link
                href="/knowledge/images"
                className="mt-4 inline-block rounded-tile bg-grad-mark px-4 py-2.5 text-sm font-bold text-white"
              >
                {t("picker.goToImages")}
              </Link>
            </div>
          )}

          {images !== null && images.length > 0 && shown.length === 0 && (
            <p className="text-sm text-muted">
              No images match “{query}”.{" "}
              <button type="button" onClick={() => setQuery("")} className="text-accent underline">
                {t("picker.clear")}
              </button>
            </p>
          )}

          {shown.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-3">
              {shown.map((img) => {
                const here = taken.has(img.id);
                const chosen = multi ? picked.includes(img.id) : img.file_url === currentUrl;
                const active = chosen || here;
                return (
                  <button
                    key={img.id}
                    type="button"
                    disabled={here || busy}
                    onClick={() => {
                      if (!multi) {
                        onPick?.({ id: img.id, url: img.file_url });
                        onClose();
                        return;
                      }
                      setPicked((prev) =>
                        prev.includes(img.id) ? prev.filter((x) => x !== img.id) : [...prev, img.id]);
                    }}
                    aria-pressed={active}
                    className={`group relative overflow-hidden rounded-card border text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      here ? "border-rule opacity-50"
                        : active ? "border-accent ring-2 ring-accent-line"
                        : "border-rule hover:border-accent-line"
                    }`}
                  >
                    {here && (
                      <span className="absolute right-1.5 top-1.5 z-10 rounded-pill bg-ink/70 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.4px] text-white">
                        Tagged
                      </span>
                    )}
                    <span className="block aspect-square overflow-hidden bg-tile">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.file_url}
                        alt={img.file_name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.03] motion-reduce:transition-none"
                      />
                    </span>
                    <span className="block truncate px-2.5 py-2 text-2xs font-semibold text-ink-2">
                      {img.file_name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 border-t border-rule px-5 py-3.5">
          {multi && (
            <>
              <button
                type="button"
                disabled={picked.length === 0 || busy}
                onClick={() => onPickMany?.(picked)}
                className={
                  picked.length === 0 || busy
                    ? "rounded-tile bg-tile px-3.5 py-2.5 text-sm font-bold text-muted-2"
                    : "rounded-tile bg-grad-mark px-3.5 py-2.5 text-sm font-bold text-white"
                }
              >
                {/* Entry 6c: the label says what pressing it does, not what
                    you have already done. The count is the useful part. */}
                {busy ? "Tagging…"
                  : picked.length === 1 ? "Tag image"
                  : picked.length > 1 ? `Tag ${picked.length} images`
                  : "Tag images"}
              </button>
              <span className="text-xs font-medium text-muted-2">
                {picked.length === 0 ? "Pick one or more" : `${picked.length} selected`}
              </span>
            </>
          )}
          {!multi && currentUrl && (
            <button
              type="button"
              onClick={() => {
                onPick?.(null);
                onClose();
              }}
              className="rounded-tile border border-rule-2 px-3.5 py-2.5 text-sm font-semibold text-ink-2 hover:bg-tile"
            >
              {t("picker.removeImage")}
            </button>
          )}
          <Link
            href="/knowledge/images"
            className="ml-auto text-xs font-semibold text-accent underline underline-offset-2"
          >
            {t("picker.manageInKnowledge")}
          </Link>
        </div>
      </div>
    </div>
  );
}
