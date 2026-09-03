import { NextRequest, NextResponse } from "next/server";
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { decideAccess } from "@/lib/ownership";

/**
 * What is tagged to one product.
 *
 * The counts come from the rows returned, not from
 * catalog_products.image_count, which is written once and never maintained.
 * Deriving them is the only way the number on the card can match the grid
 * under it after an untag with no reload.
 */
export const dynamic = "force-dynamic";

async function ownsProduct(productId: string, brandId: string) {
  const { data, error } = await supabase
    .from("catalog_products").select("brand_id").eq("id", productId).maybeSingle();
  if (error) return { ok: false as const };
  const access = decideAccess(brandId, (data?.brand_id as string) ?? null);
  return { ok: access.ok && Boolean(data) };
}

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("product_id");
  const brandId = req.nextUrl.searchParams.get("brand_id");
  if (!productId || !brandId) {
    return NextResponse.json({ error: "product_id and brand_id are required" }, { status: 400 });
  }
  // Same refusal whether it belongs to another brand or does not exist.
  if (!(await ownsProduct(productId, brandId)).ok) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const [imgLinks, docLinks] = await Promise.all([
    supabase.from("product_images")
      .select("image_id, is_primary, sort_order").eq("product_id", productId).order("sort_order"),
    supabase.from("product_documents")
      .select("document_id, doc_role").eq("product_id", productId),
  ]);

  const imageIds = (imgLinks.data ?? []).map((r) => r.image_id as string);
  const docIds = (docLinks.data ?? []).map((r) => r.document_id as string);

  const [imgRows, docRows] = await Promise.all([
    imageIds.length
      ? supabase.from("brand_images")
          .select("id, file_url, file_name, file_size, category, tags, campaign_name, uploaded_at")
          .in("id", imageIds)
      : Promise.resolve({ data: [], error: null }),
    docIds.length
      ? supabase.from("brand_documents").select("*").in("id", docIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const byImage = new Map((imgRows.data ?? []).map((r) => [r.id as string, r]));
  const byDoc = new Map((docRows.data ?? []).map((r) => [(r as { id: string }).id, r]));

  /* A link whose file has been deleted cannot happen: both tables cascade. If
     one ever appears it is dropped here rather than rendered as a broken
     thumbnail, which is the bug that makes people stop trusting the feature. */
  const images = (imgLinks.data ?? [])
    .map((l) => {
      const row = byImage.get(l.image_id as string);
      return row ? { ...row, is_primary: l.is_primary, sort_order: l.sort_order } : null;
    })
    .filter(Boolean);

  const documents = (docLinks.data ?? [])
    .map((l) => {
      const row = byDoc.get(l.document_id as string) as Record<string, unknown> | undefined;
      return row ? { ...row, doc_role: l.doc_role } : null;
    })
    .filter(Boolean);

  return NextResponse.json({
    images, documents,
    imageCount: images.length,
    documentCount: documents.length,
  });
}

/** Untag. Removes the link and never the file. */
export async function DELETE(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const productId = searchParams.get("product_id");
  const brandId = searchParams.get("brand_id");
  const imageId = searchParams.get("image_id");
  const documentId = searchParams.get("document_id");

  if (!productId || !brandId || (!imageId && !documentId)) {
    return NextResponse.json({ error: "product_id, brand_id and one asset id are required" }, { status: 400 });
  }
  if (!(await ownsProduct(productId, brandId)).ok) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const table = imageId ? "product_images" : "product_documents";
  const column = imageId ? "image_id" : "document_id";
  const { error } = await supabase.from(table).delete()
    .eq("product_id", productId).eq(column, imageId ?? documentId);

  // supabase-js resolves { data, error } and never throws.
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ untagged: true });
}
