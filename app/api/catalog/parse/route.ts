import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { cachedSystem, logCacheUsage } from "@/lib/prompt-cache";
import { CATALOG_PARSE_STABLE } from "@/lib/prompts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let textContent = "";
    let mediaContent: Anthropic.MessageParam["content"] | null = null;

    if (contentType.includes("multipart/form-data")) {
      // PDF upload
      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");

      if (isPdf) {
        mediaContent = [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64 },
          } as Anthropic.DocumentBlockParam,
          { type: "text", text: "Extract all products and services from this document." },
        ];
      } else {
        // image
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

    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
      // max_tokens caps thinking + text together — these calls would
      // truncate. None of them need reasoning tokens.
      thinking: { type: "disabled" },
      max_tokens: 2000,
      system: cachedSystem(CATALOG_PARSE_STABLE),
      messages: [
        {
          role: "user",
          content: mediaContent || `Extract products from this text:\n\n${textContent}`,
        },
      ],
    });


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
    console.error("[catalog/parse]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Parse failed" }, { status: 500 });
  }
}
