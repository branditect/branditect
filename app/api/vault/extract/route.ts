import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const SYSTEM_PROMPT = `You are a brand data extractor. Extract ALL text content from this document — product names, features, pricing, company info, team info, and any other facts. Format as clean readable text. Do not summarise — preserve all specific details, numbers, names, and figures exactly as written.`;

export async function POST(req: NextRequest) {
  try {
    const { documentId, storagePath, brandId } = await req.json() as {
      documentId: string;
      storagePath: string;
      brandId: string;
    };

    if (!documentId || !storagePath || !brandId) {
      return NextResponse.json(
        { error: "documentId, storagePath, and brandId are required" },
        { status: 400 }
      );
    }

    // Download file from Supabase Storage
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("brand-documents")
      .download(storagePath);

    if (downloadError || !fileBlob) {
      await supabase
        .from("brand_documents")
        .update({ status: "error" })
        .eq("id", documentId);
      return NextResponse.json(
        { error: "Failed to download file from storage" },
        { status: 500 }
      );
    }

    const buffer = await fileBlob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const lower = storagePath.toLowerCase();

    const isPdf =
      fileBlob.type?.includes("pdf") || lower.endsWith(".pdf");
    const isImage =
      fileBlob.type?.startsWith("image/") ||
      /\.(png|jpg|jpeg|webp|gif)$/i.test(lower);

    let extractedText = "";

    try {
      let messageContent: Anthropic.MessageParam["content"];

      if (isPdf) {
        messageContent = [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64 },
          } as Anthropic.DocumentBlockParam,
          { type: "text", text: "Extract all text content from this document." },
        ];
      } else if (isImage) {
        const mt = (fileBlob.type || "image/jpeg") as
          | "image/jpeg"
          | "image/png"
          | "image/webp"
          | "image/gif";
        messageContent = [
          {
            type: "image",
            source: { type: "base64", media_type: mt, data: base64 },
          } as Anthropic.ImageBlockParam,
          { type: "text", text: "Extract all text content visible in this image." },
        ];
      } else {
        // DOCX / PPTX / XLSX — attempt Claude document block; graceful fallback
        messageContent = [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64 },
          } as Anthropic.DocumentBlockParam,
          { type: "text", text: "Extract all text content from this document." },
        ];
      }

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: messageContent }],
      });

      extractedText = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b as Anthropic.TextBlock).text)
        .join("");
    } catch {
      // Non-PDF formats that Claude can't read natively
      const fileName = storagePath.split("/").pop() || storagePath;
      extractedText = `[File: ${fileName}]\nDocument stored in vault. For automatic text extraction, please upload a PDF version of this document.`;
    }

    const pagesCount = Math.max(1, Math.ceil(extractedText.length / 3000));

    const { error: updateError } = await supabase
      .from("brand_documents")
      .update({
        status: "ready",
        extracted_text: extractedText,
        pages_count: pagesCount,
      })
      .eq("id", documentId);

    if (updateError) {
      console.error("[vault/extract] DB update error:", updateError);
    }

    return NextResponse.json({
      success: true,
      extracted_text: extractedText,
      pages_count: pagesCount,
    });
  } catch (err) {
    console.error("[vault/extract]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Extract failed" },
      { status: 500 }
    );
  }
}
