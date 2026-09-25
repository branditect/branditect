import { NextRequest, NextResponse } from "next/server";
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { resolveBrand } from "@/lib/api-auth";
import { isLive } from "@/lib/product-delete";
import {
  buildImagePrompt, buildParts, productIdentity, decideProductAccess,
  isValidFormat, isValidWhere, PRODUCT_FIELDS,
  type Brief, type ProductIdentity,
} from "@/lib/image-brief";
import { meter, BudgetRefused, ProviderError, refusalBody, requestLocale } from "@/lib/metering";
import { estimateCents, geminiCostCents, GEMINI_IMAGE_OUTPUT_TOKENS } from "@/lib/usage-cost";

export const maxDuration = 60;

const MODEL = "gemini-2.5-flash-image";
/** One image back, plus room for the text part the IMAGE+TEXT modality may add. */
const MAX_OUTPUT_TOKENS = GEMINI_IMAGE_OUTPUT_TOKENS + 1000;

/** What the route answers when the provider was paid but no image came back. */
type Declined = { status: number; body: Record<string, string> };

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
    .select(`id, brand_id, image_url, deleted_at, ${PRODUCT_FIELDS.join(", ")}`)
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
  // A removed product refuses exactly like a foreign one.
  if (!access.ok || !row || !isLive(row as { deleted_at?: string | null })) {
    return { ok: false, status: 403 };
  }

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

    /*
      Sign-in is not conditional on what you asked for.

      This route only authenticated inside `if (productId)`, so leaving the
      product out turned it into an open image-generation endpoint: no account,
      no brand, someone else's model budget. Authenticate first, then decide
      what the request may touch.
    */
    const requested = typeof body.brandId === "string" && body.brandId !== "default" ? body.brandId : null;
    const auth = await resolveBrand(req, requested);
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
    const brandId = auth.brandId;

    let product: ProductIdentity | null = null;
    if (productId) {
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

    /*
      Metered: 5 credits for an image, and the cost ceiling on every attempt.
      A reply that carries no image (flagged, declined, empty, unreadable) is a
      failed generation — the provider was paid, the customer gets their
      credits back — so it is thrown as a non-retryable ProviderError carrying
      what it cost, and `declined` remembers what to tell the person.
    */
    let declined: Declined | null = null;
    const decline = (d: Declined, costCents: number): never => {
      declined = d;
      throw new ProviderError(d.body.error, 400, costCents);
    };

    let generated: { imageData: string; mimeType: string };
    try {
      generated = await meter(
        {
          route: "brand/generate-from-reference",
          brandId,
          userId: auth.userId,
          estimateCents: estimateCents({
            model: MODEL,
            inputChars: prompt.length,
            images: images.length,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
          }),
          locale: requestLocale(req),
        },
        async () => {
          declined = null;
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ["IMAGE", "TEXT"] } }),
            },
          );

          const responseText = await response.text();
          if (!response.ok) {
            console.error("[generate-from-reference] upstream error:", responseText.slice(0, 300));
            // 429 / 5xx are retried once by meter(); anything else is final.
            throw new ProviderError("upstream_error", response.status);
          }

          let data;
          try {
            data = JSON.parse(responseText);
          } catch {
            console.error("[generate-from-reference] non-JSON response:", responseText.slice(0, 300));
            // Unknown cost: meter() keeps the estimate on the budget.
            return decline({ status: 502, body: { error: "api_error", message: "The image service returned something unreadable." } }, 0);
          }

          const candidateParts = data.candidates?.[0]?.content?.parts || [];
          const imageParts = candidateParts.filter(
            (p: { inlineData?: unknown; inline_data?: unknown }) => p.inlineData || p.inline_data,
          );
          const cost = geminiCostCents(MODEL, data.usageMetadata, Math.max(1, imageParts.length));

          const candidate = data.candidates?.[0];
          const finishReason = candidate?.finishReason;
          if (finishReason === "SAFETY" || finishReason === "BLOCKED") {
            return decline({ status: 400, body: {
              error: "safety_block",
              message: "That request was flagged. Try a simpler description or a different reference.",
            } }, cost);
          }
          // The upstream declines some briefs — usually a description that does not
          // fit the references attached to it. It says so, and the card should
          // repeat that rather than "no image came back", which sounds like a fault
          // at our end and gives nobody anything to change.
          if (finishReason === "IMAGE_OTHER" || finishReason === "PROHIBITED_CONTENT") {
            return decline({ status: 400, body: {
              error: "not_generated",
              message: "That description and those references did not go together. Try rewording it, or pick a reference closer to what you want.",
            } }, cost);
          }

          const imagePart = imageParts[0] as
            | { inlineData?: { data: string; mimeType: string }; inline_data?: { data: string; mime_type: string } }
            | undefined;
          // The API answers in camelCase or snake_case depending on the path.
          const imageData = imagePart?.inlineData?.data || imagePart?.inline_data?.data;
          const mimeType = imagePart?.inlineData?.mimeType || imagePart?.inline_data?.mime_type || "image/png";

          if (!imageData) {
            console.error("[generate-from-reference] no image in response:", JSON.stringify(data).slice(0, 400));
            return decline({ status: 502, body: { error: "no_image", message: "No image came back. Try again." } }, cost);
          }

          return {
            value: { imageData, mimeType },
            model: MODEL,
            costCents: cost,
            units: imageParts.length,
            inputTokens: data.usageMetadata?.promptTokenCount,
            outputTokens: data.usageMetadata?.candidatesTokenCount,
          };
        },
      );
    } catch (e) {
      if (e instanceof BudgetRefused) return NextResponse.json(refusalBody(e), { status: e.status });
      const d = declined as Declined | null;
      if (d) return NextResponse.json(d.body, { status: d.status });
      if (e instanceof ProviderError) {
        return NextResponse.json({ error: "api_error", message: "The image service returned an error. Try again." }, { status: 502 });
      }
      throw e;
    }
    const { imageData, mimeType } = generated;

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
