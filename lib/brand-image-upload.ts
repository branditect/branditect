"use client";

/**
 * Putting a file into Knowledge ▸ Media, in one place.
 *
 * Step 3 of branditect-ui/spec/studio-notes.md: a file dragged into a note
 * "uploads to Knowledge ▸ Media first so it is never a file that exists only
 * inside a note". That is criterion 4, and the way to make it true rather than
 * intended is for the note editor to have no upload of its own — it calls
 * this, which writes the row, and only then places the block.
 *
 * NOTE: components/image-library.tsx still has its own copy of this sequence,
 * and that copy discards both the storage error and the insert result — the
 * same silence that file-library.tsx had until it was fixed. Moving it over is
 * outstanding, and until it is these are two writers to one bucket.
 */

import { supabase } from "@/lib/supabase";

/** What a caller needs back to reference the image it just uploaded. */
export interface UploadedImage {
  id: string;
  url: string;
  fileName: string;
}

export interface UploadFailure {
  fileName: string;
  reason: string;
}

export const IMAGE_BUCKET = "brand-images";

/** Category rows written from a note. `product` is the value Knowledge shows. */
export const NOTE_IMAGE_CATEGORY = "product";

/**
 * Where the bytes go. Deterministic per brand and unique per upload — two
 * files of the same name from the same brand must not overwrite each other,
 * which `upsert: true` on a fixed path would do.
 */
export function storagePathFor(brandId: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "bin";
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${brandId}/notes/${unique}.${ext}`;
}

export function isImageFile(file: { type?: string; name?: string }): boolean {
  if (file.type?.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(file.name ?? "");
}

/**
 * Upload, then write the row, then hand back the id.
 *
 * The id matters as much as the URL: note_blocks.image_id is a foreign key
 * with ON DELETE SET NULL, and that is what makes criterion 10 work — deleting
 * a picture from Knowledge leaves the paragraph beside it alone. A block that
 * only had a URL would keep rendering a broken image instead.
 *
 * Errors are returned, never swallowed. supabase-js resolves { data, error }
 * and never throws, so an unchecked call here would report success and place a
 * block pointing at nothing.
 */
export async function uploadBrandImage(
  brandId: string,
  file: File,
): Promise<{ image: UploadedImage } | { failure: UploadFailure }> {
  if (!brandId || brandId === "default") {
    return { failure: { fileName: file.name, reason: "No brand to upload to." } };
  }
  if (!isImageFile(file)) {
    return { failure: { fileName: file.name, reason: "That is not an image." } };
  }

  const path = storagePathFor(brandId, file.name);
  const { error: storageError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type || undefined });
  if (storageError) {
    return { failure: { fileName: file.name, reason: storageError.message } };
  }

  const { data: urlData } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);

  const { data, error } = await supabase
    .from("brand_images")
    .insert({
      brand_id: brandId,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_size: file.size,
      category: NOTE_IMAGE_CATEGORY,
    })
    .select("id, file_url, file_name")
    .single();

  if (error || !data) {
    // The bytes are in storage but nothing points at them. Say so rather than
    // placing a block: retrying would leave a second orphan behind.
    return {
      failure: {
        fileName: file.name,
        reason: `Uploaded, but not saved to Knowledge: ${error?.message ?? "no row returned"}`,
      },
    };
  }

  return { image: { id: data.id as string, url: data.file_url as string, fileName: data.file_name as string } };
}
