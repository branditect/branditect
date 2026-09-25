import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { cachedSystem, logCacheUsage } from "@/lib/prompt-cache";
import { CATALOG_PARSE_STABLE } from "@/lib/prompts";
import { requireUser } from '@/lib/api-auth'
import { meter, brandOfUser, BudgetRefused, refusalBody, requestLocale } from "@/lib/metering";
import { estimateCents, anthropicCostCents, promptChars, pdfPageCount } from "@/lib/usage-cost";

// maxRetries: 0 — meter() owns the one retry (hq-accounts.md criterion 7).
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 });

const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 2000;

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  /*
    Signed in, or nothing happens.

    This route spends money on every call. Left open it is an uncapped model
    bill for anyone who finds the URL, and nothing about it would look wrong —
    no data leaves, the graph just climbs.
  */
  const auth = await requireUser(req)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })
  // The budget belongs to a brand; no brand, nothing to charge it to.
  const brandId = await brandOfUser(auth.userId)

  try {
    const contentType = req.headers.get("content-type") || "";

    let textContent = "";
    let mediaContent: Anthropic.MessageParam["content"] | null = null;
    let pdfPages = 0;
    let imageCount = 0;

    if (contentType.includes("multipart/form-data")) {
      // PDF upload
      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");

      if (isPdf) {
        pdfPages = pdfPageCount(new Uint8Array(buffer));
        mediaContent = [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64 },
          } as Anthropic.DocumentBlockParam,
          { type: "text", text: "Extract all products and services from this document." },
        ];
      } else {
        // image
        imageCount = 1;
        mediaContent = [
          {
            type: "image",
            source: { type: "base64", media_type: file.type as "image/jpeg" | "image/png" | "image/webp", data: base64 },
          } as Anthropic.ImageBlockParam,
          { type: "text", text: "Extract all products and services from this image." },
        ];
      }
    } else {
      const body = await req.json();
      textContent = body.text || "";
      if (!textContent.trim()) return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model: MODEL,
      // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
      // max_tokens caps thinking + text together — these calls would
      // truncate. None of them need reasoning tokens.
      thinking: { type: "disabled" },
      max_tokens: MAX_TOKENS,
      system: cachedSystem(CATALOG_PARSE_STABLE),
      messages: [
        {
          role: "user",
          content: mediaContent || `Extract products from this text:\n\n${textContent}`,
        },
      ],
    };

    const response = await meter(
      {
        route: "catalog/parse",
        brandId,
        userId: auth.userId,
        estimateCents: estimateCents({
          model: MODEL,
          inputChars: promptChars(params.system, params.messages),
          images: imageCount,
          pdfPages,
          maxOutputTokens: MAX_TOKENS,
        }),
        locale: requestLocale(req),
        refusalKind: "document",
      },
      async () => {
        const m = await anthropic.messages.create(params);
        return {
          value: m,
          model: MODEL,
          costCents: anthropicCostCents(MODEL, m.usage),
          inputTokens: m.usage.input_tokens,
          outputTokens: m.usage.output_tokens,
        };
      },
    );

    logCacheUsage("catalog-parse", response.usage);

    const raw = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as Anthropic.TextBlock).text)
      .join("");

    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    let products = null;
    try {
      products = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) {
        try { products = JSON.parse(match[0]); } catch { /* */ }
      }
    }

    if (!Array.isArray(products)) {
      return NextResponse.json({ error: "Could not extract products from the provided content." }, { status: 422 });
    }

    // Ensure each product has an id
    const withIds = products.map((p: Record<string, unknown>) => ({
      ...p,
      id: Math.random().toString(36).slice(2, 10),
    }));

    return NextResponse.json({ products: withIds });
  } catch (err) {
    if (err instanceof BudgetRefused) return NextResponse.json(refusalBody(err), { status: err.status });
    console.error("[catalog/parse]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Parse failed" }, { status: 500 });
  }
}
