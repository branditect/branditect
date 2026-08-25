import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { serviceClient as supabase } from "@/lib/supabase-admin";

// A 40-page image-heavy guideline PDF measured 104s. At the old 60s the
// function was killed mid-flight, so the row below stayed "processing" with
// NULL text forever — no error, no retry, nothing the user could see.
// 300 is the Vercel Pro ceiling; on Hobby this is capped at 60 and the
// stale-row watchdog on the documents page is what catches the failure.
export const maxDuration = 300;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
        model: "claude-sonnet-5",
        // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
        // max_tokens caps thinking + text together — these calls would
        // truncate. None of them need reasoning tokens.
        thinking: { type: "disabled" },
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: messageContent }],
      });

      extractedText = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b as Anthropic.TextBlock).text)
        .join("");
    } catch (err) {
      // Only claim "unreadable format" for formats Claude genuinely can't read.
      // A timeout or size error on a PDF used to be written over with that same
      // message, which reads as success and hides a real failure.
      const fileName = storagePath.split("/").pop() || storagePath;
      if (isPdf || isImage) {
        await supabase
          .from("brand_documents")
          .update({ status: "error" })
          .eq("id", documentId);
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "Extraction failed" },
          { status: 500 }
        );
      }
      extractedText = `[File: ${fileName}]\nDocument stored in vault. For automatic text extraction, please upload a PDF version of this document.`;
    }

    // Empty text is a failure, not a ready document. Marking it ready lets the
    // model believe the file holds nothing rather than that it could not read it.
    if (!extractedText.trim()) {
      await supabase
        .from("brand_documents")
        .update({ status: "error" })
        .eq("id", documentId);
      return NextResponse.json(
        { error: "Extraction returned no text" },
        { status: 422 }
      );
    }

    const pagesCount = Math.max(1, Math.ceil(extractedText.length / 3000));

    // Report rows affected. This used to log the error and return success
    // regardless, so a write that never landed looked identical to one that
    // did — the document sat at "processing" and nobody could tell why.
    const { data: updated, error: updateError } = await supabase
      .from("brand_documents")
      .update({
        status: "ready",
        extracted_text: extractedText,
        pages_count: pagesCount,
      })
      .eq("id", documentId)
      .select("id");

    if (updateError || !updated?.length) {
      const reason = updateError?.message ?? `no row matched id ${documentId}`;
      console.error("[vault/extract] DB update failed:", reason);
      return NextResponse.json(
        { error: `Extracted ${extractedText.length} chars but could not save: ${reason}` },
        { status: 500 }
      );
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
