import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a product catalogue parser. Extract all products or services from the provided text and return them as a JSON array.

For each product/service return an object with these fields:
- kind: "physical" | "services" | "saas" | "digital"
- name: string (product/service name)
- description: string (1-2 sentence description)
- category: string (optional, e.g. "Skincare", "Consulting")
- price: string (price as plain number, e.g. "29.99" — for physical/services/digital)
- priceModel: string (services only: "Per project" | "Per hour" | "Retainer / monthly" | "Custom quote")
- monthlyPrice: string (saas only, plain number e.g. "49")
- deliveryTime: string (optional, e.g. "3-5 business days")
- inclusions: string (comma-separated list of what is included, optional)
- idealClient: string (services only, who this is for, optional)
- sku: string (physical only, optional)

Choose kind based on:
- "physical" = tangible goods that are shipped or handed over
- "services" = professional services, consulting, coaching, agency work
- "saas" = software or digital subscriptions (recurring)
- "digital" = one-time digital downloads, courses, templates

Return ONLY a valid JSON array, no markdown, no extra text.
Example: [{"kind":"services","name":"Brand Strategy Workshop","description":"Half-day workshop to define brand positioning.","price":"1500","priceModel":"Per project"}]`;

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
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: mediaContent || `Extract products from this text:\n\n${textContent}`,
        },
      ],
    });

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
