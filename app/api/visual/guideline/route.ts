import { NextRequest, NextResponse } from "next/server";
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { resolveBrand } from "@/lib/api-auth";
import { colorMediaType, storagePathFromUrl } from "@/lib/brand-colors";
import { extractColors, colorEstimateCents } from "@/lib/brand-colors-server";
import { meter, requestLocale } from "@/lib/metering";

/**
 * The brand guideline: uploading one, and taking it away again.
 *
 * NOTHING IN THE APP WROTE `brand_visual.guideline_url`. Home asked for a
 * brand guideline as one of the four readiness checks, the check linked to
 * Visual identity, and Visual identity had no way to upload one — it only had
 * a box that renders when the column is set, which it never was. So the fourth
 * quarter of Brand Readiness could not be earned by anybody, and the download
 * button read a URL that no code path had ever written.
 *
 * Uploading also reads the palette out of the file. A guideline prints its
 * colours with the hex codes beside them; that is the page a founder would
 * otherwise copy by hand into the colour form.
 */

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  // The brand comes from the caller's token. The field is only a request.
  const auth = await resolveBrand(req, formData.get("brandId") as string | null);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const brandId = auth.brandId;
  if (!file) return NextResponse.json({ error: "No file", errorKey: "vupload.noFile" }, { status: 400 });

  // The original name is kept in the stored path — there is no column for it,
  // and "brand-guidelines-2026.pdf" is what the founder recognises. Anything
  // that is not a plain character is dropped rather than escaped: this string
  // ends up in a URL.
  const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const stem = file.name.replace(/\.[^.]*$/, "").replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 60) || "guideline";
  const path = `${brandId}/brand-guideline/${Date.now()}-${stem}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("brand-assets")
    .upload(path, bytes, { upsert: true, contentType: file.type || "application/pdf" });
  if (uploadError) {
    console.error("guideline upload failed:", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("brand-assets").getPublicUrl(path);
  const url = urlData.publicUrl;

  // The row may not exist yet: a brand that has never saved anything visual
  // has no brand_visual row at all.
  // Only the columns the live table actually has. supabase/brand_visual.sql
  // also declares guideline_storage_path, version and assets_updated_at, and
  // the database has none of them — migrations here are run by hand, and a
  // write naming a missing column fails the whole request with PGRST204. The
  // stored path is derived from the URL when it is needed, so there is nothing
  // to migrate before this works.
  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("brand_visual").select("id").eq("brand_id", brandId).maybeSingle();
  const fields = { guideline_url: url, updated_at: now };
  const { error: saveError } = existing
    ? await supabase.from("brand_visual").update(fields).eq("brand_id", brandId)
    : await supabase.from("brand_visual").insert({ brand_id: brandId, ...fields });
  // The file is stored but nothing points at it: say so rather than reporting
  // an upload that the page will not show.
  if (saveError) {
    console.error("guideline save failed:", saveError);
    return NextResponse.json({ error: saveError.message }, { status: 500 });
  }

  // Colours, unless the caller said not to. A failure here is not a failed
  // upload — the guideline is saved either way.
  let added = 0;
  let colorError: string | null = null;
  if (formData.get("extractColors") !== "false") {
    const mediaType = colorMediaType(file.name, file.type);
    if (!mediaType) {
      colorError = "unsupported";
    } else {
      try {
        const { data: current } = await supabase
          .from("brand_book_colors").select("hex").eq("brand_id", brandId);
        const already = (current ?? []).map((c) => String(c.hex ?? ""));
        // Metered, and indexing: a refusal lands in colorError with the
        // "this document needs about N credits" wording, and the guideline
        // itself stays saved.
        const found = await meter(
          {
            route: "visual/guideline",
            brandId,
            userId: auth.userId,
            estimateCents: colorEstimateCents(bytes, mediaType),
            locale: requestLocale(req),
            refusalKind: "document",
          },
          () => extractColors(bytes, mediaType, already),
        );
        if (found.length) {
          // hex and name only. supabase/*.sql also declares role, grouping and
          // css_value on this table and the live database has none of them —
          // naming one fails the whole insert with PGRST204, which would lose
          // the colours to save a label nothing renders yet.
          const { error } = await supabase.from("brand_book_colors").insert(
            found.map((c) => ({ brand_id: brandId, hex: c.hex, name: c.name })),
          );
          if (error) colorError = error.message;
          else added = found.length;
        }
      } catch (e) {
        colorError = e instanceof Error ? e.message : "extraction failed";
      }
    }
  }

  return NextResponse.json({ success: true, url, name: file.name, colorsAdded: added, colorError });
}

/**
 * Remove it. The row stays; the two columns are cleared and the stored file is
 * deleted, because a guideline is the one asset nobody wants a stale copy of.
 */
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = await resolveBrand(req, body.brandId ?? null);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const brandId = auth.brandId;

  const { data: row } = await supabase
    .from("brand_visual").select("guideline_url").eq("brand_id", brandId).maybeSingle();

  const { error } = await supabase
    .from("brand_visual")
    .update({ guideline_url: null, updated_at: new Date().toISOString() })
    .eq("brand_id", brandId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Best effort, and after the row is cleared: a file left behind is untidy,
  // a row pointing at a deleted file is a broken download.
  const path = storagePathFromUrl(row?.guideline_url ?? null);
  if (path) await supabase.storage.from("brand-assets").remove([path]);
  return NextResponse.json({ success: true });
}
