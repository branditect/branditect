import { NextRequest, NextResponse } from "next/server";
import { serviceClient as supabase } from "@/lib/supabase-admin";
import {
  buildImagePrompt, buildParts, productIdentity, decideProductAccess,
  isValidFormat, isValidWhere, PRODUCT_FIELDS,
  type Brief, type ProductIdentity,
} from "@/lib/image-brief";

export const maxDuration = 60;

interface RequestBody {
  brandId?: string;
  images?: { data: string; mimeType?: string }[] | string[];
  brief?: Partial<Brief>;
}

/** Accepts the old bare-string array as well as {data, mimeType}. */
function readImages(input: RequestBody["images"]): { data: string; mimeType?: string }[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((v) => (typeof v === "string" ? { data: v } : v))
    .filter((v): v is { data: string; mimeType?: string } => Boolean(v?.data));
}

/**
 * Reads the product, refusing anything that is not this brand's.
 *
 * The columns are written out by name. `select("*")` here would put a future
 * `catalog_products` column one careless template literal away from a prompt,
 * and the columns beside these are floor prices and margins.
 */
async function readProduct(
  productId: string, brandId: string,
): Promise<{ ok: true; product: ProductIdentity | null; imageUrl: string | null } | { ok: false; status: 403 }> {
  const { data, error } = await supabase
    .from("catalog_products")
    .select(`id, brand_id, image_url, ${PRODUCT_FIELDS.join(", ")}`)
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    console.error("[generate-from-reference] product read failed:", error.message);
    return { ok: false, status: 403 };
  }

  // The product's brand is checked against the caller's, never the other way
  // round, and a missing row refuses exactly like a foreign one.
  const row = data as Record<string, unknown> | null;
  const access = decideProductAccess(brandId, (row?.brand_id as string) ?? null);
  if (!access.ok || !row) return { ok: false, status: 403 };

  return {
    ok: true,
    product: productIdentity(row),
    imageUrl: typeof row.image_url === "string" ? row.image_url : null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const images = readImages(body.images);
    const brief = body.brief ?? {};

    const subject = typeof brief.subject === "string" ? brief.subject.trim() : "";
    if (!images.length) {
      return NextResponse.json({ error: "missing_input", message: "Add a reference to start" }, { status: 400 });
    }
    if (!subject) {
      return NextResponse.json({ error: "missing_input", message: "Say what you want to see" }, { status: 400 });
    }

    const where = isValidWhere(brief.where) ? brief.where : "studio";
    const format = isValidFormat(brief.format) ? brief.format : "1:1";
    const productId = typeof brief.productId === "string" && brief.productId ? brief.productId : null;

    let product: ProductIdentity | null = null;
    if (productId) {
      const brandId = typeof body.brandId === "string" && body.brandId !== "default" ? body.brandId : null;
      if (!brandId) {
        return NextResponse.json({ error: "forbidden", message: "That product is not available." }, { status: 403 });
      }
      const found = await readProduct(productId, brandId);
      if (!found.ok) {
        // Same refusal whether it belongs to another brand or does not exist.
        return NextResponse.json({ error: "forbidden", message: "That product is not available." }, { status: 403 });
      }
      product = found.product;
    }

    const resolved: Brief = { subject, where, format, productId, extra: brief.extra };
    const prompt = buildImagePrompt({ brief: resolved, product, referenceCount: images.length });
    const parts = buildParts(prompt, images.map((i) => i.data), images.map((i) => i.mimeType));

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.error("[generate-from-reference] GEMINI_API_KEY is not set");
      return NextResponse.json({ error: "api_error", message: "Image generation is not configured." }, { status: 500 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ["IMAGE", "TEXT"] } }),
      },
    );

    const responseText = await response.text();
    if (!response.ok) {
      console.error("[generate-from-reference] upstream error:", responseText.slice(0, 300));
      return NextResponse.json({ error: "api_error", message: "The image service returned an error. Try again." }, { status: 502 });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("[generate-from-reference] non-JSON response:", responseText.slice(0, 300));
      return NextResponse.json({ error: "api_error", message: "The image service returned something unreadable." }, { status: 502 });
    }

    const finishReason = data.candidates?.[0]?.finishReason;
    if (finishReason === "SAFETY" || finishReason === "BLOCKED") {
      return NextResponse.json({
        error: "safety_block",
        message: "That request was flagged. Try a simpler description or a different reference.",
      }, { status: 400 });
    }

    const candidateParts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = candidateParts.find(
      (p: { inlineData?: { data: string; mimeType: string }; inline_data?: { data: string; mime_type: string } }) =>
        p.inlineData || p.inline_data,
    );
    // The API answers in camelCase or snake_case depending on the path.
    const imageData = imagePart?.inlineData?.data || imagePart?.inline_data?.data;
    const mimeType = imagePart?.inlineData?.mimeType || imagePart?.inline_data?.mime_type || "image/png";

    if (!imageData) {
      console.error("[generate-from-reference] no image in response:", JSON.stringify(data).slice(0, 400));
      return NextResponse.json({ error: "no_image", message: "No image came back. Try again." }, { status: 502 });
    }

    return NextResponse.json({
      imageBase64: imageData,
      mimeType,
      // What the card's provenance row reports. Never the prompt itself.
      usedReferences: images.length,
      where,
      format,
      productId,
    });
  } catch (error) {
    console.error("[generate-from-reference] error:", error);
    return NextResponse.json({ error: "api_error", message: "Image generation failed." }, { status: 500 });
  }
}
