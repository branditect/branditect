import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const COLOR_PROMPT = `Analyze this document/image and extract ALL brand colors you can find. For each color return:
- hex: the hex color code (e.g. "#E8562A")
- name: a descriptive color name (e.g. "Brand Orange")
- usage: how this color is used in the brand (e.g. "Primary accent, CTAs, headings")

Return ONLY a JSON array, no other text. Example:
[{"hex":"#E8562A","name":"Brand Orange","usage":"Primary accent color"},{"hex":"#1A1A1A","name":"Ink Black","usage":"Body text"}]

If you cannot find any colors, return an empty array: []`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string; // "pdf" or "image"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    let mediaType: "image/png" | "image/jpeg" | "image/gif" | "image/webp" | "application/pdf";
    if (type === "pdf") {
      mediaType = "application/pdf";
    } else {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "png") mediaType = "image/png";
      else if (ext === "jpg" || ext === "jpeg") mediaType = "image/jpeg";
      else if (ext === "webp") mediaType = "image/webp";
      else mediaType = "image/png";
    }

    const content: Anthropic.Messages.ContentBlockParam[] = [];

    if (type === "pdf") {
      content.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: base64,
        },
      });
    } else {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
          data: base64,
        },
      });
    }

    content.push({ type: "text", text: COLOR_PROMPT });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const responseText = textBlock && "text" in textBlock ? textBlock.text : "[]";

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const colors = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return NextResponse.json({ colors });
  } catch (error) {
    console.error("Color extraction error:", error);
    const message = error instanceof Error ? error.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
