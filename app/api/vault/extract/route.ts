import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { resolveBrand } from "@/lib/api-auth";
import { cachedSystem, logCacheUsage } from "@/lib/prompt-cache";
import { VAULT_EXTRACT_STABLE } from "@/lib/prompts";
import { meter, BudgetRefused, refusalBody, requestLocale } from "@/lib/metering";
import { estimateCents, anthropicCostCents, promptChars, pdfPageCount } from "@/lib/usage-cost";
import { sha256Hex, isMissingHashColumn, warnNoHashColumn } from "@/lib/index-once";
import { extractPdfText, extractOffice, officeKind, type LocalText } from "@/lib/local-extract";

// A 40-page image-heavy guideline PDF measured 104s. At the old 60s the
// function was killed mid-flight, so the row below stayed "processing" with
// NULL text forever — no error, no retry, nothing the user could see.
// 300 is the Vercel Pro ceiling; on Hobby this is capped at 60 and the
// stale-row watchdog on the documents page is what catches the failure.
export const maxDuration = 300;

// maxRetries: 0 — meter() owns the one retry (hq-accounts.md criterion 7).
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 });

const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 4000;

export async function POST(req: NextRequest) {
  try {
    const { documentId, storagePath, brandId: requested } = await req.json() as {
      documentId: string;
      storagePath: string;
      brandId: string;
    };

    if (!documentId || !storagePath || !requested) {
      return NextResponse.json(
        { error: "documentId, storagePath, and brandId are required" },
        { status: 400 }
      );
    }

    // The brand comes from the caller's token. This route writes back to a
    // document row, so a caller-supplied id was a way to write into somebody
    // else's library.
    const auth = await resolveBrand(req, requested);
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
    // The document must belong to the caller's brand. This route works from a
    // documentId and a storagePath, so without this check any signed-in user
    // could extract, and mark as errored, any document in the system — the
    // brand id it was handed was never used for anything.
    //
    // The path is part of the row, not a second free parameter: an owned
    // documentId with somebody else's storagePath would otherwise read their
    // file into this brand's library. Both callers send the row's own path.
    const { data: owned } = await supabase
      .from("brand_documents")
      .select("id")
      .eq("id", documentId)
      .eq("brand_id", auth.brandId)
      .eq("storage_path", storagePath)
      .maybeSingle();
    if (!owned) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Download file from Supabase Storage
    const t0 = Date.now();
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
    const downloadMs = Date.now() - t0;
    const base64 = Buffer.from(buffer).toString("base64");
    const lower = storagePath.toLowerCase();

    /*
      Index once (hq-accounts.md criterion 5). The same bytes already read for
      this brand are reused, with zero provider calls. Only a row with real
      text counts: an empty one was never read, and marking it ready would
      tell the model the file holds nothing.
    */
    const contentHash = sha256Hex(buffer);
    let hashColumn = true;
    {
      const { data: twins, error: twinErr } = await supabase
        .from("brand_documents")
        .select("id, extracted_text, pages_count")
        .eq("brand_id", auth.brandId)
        .eq("content_sha256", contentHash)
        .neq("id", documentId)
        .not("extracted_text", "is", null)
        .limit(5);
      if (twinErr) {
        if (isMissingHashColumn(twinErr)) { hashColumn = false; warnNoHashColumn("vault/extract"); }
        else console.error("[vault/extract] dedupe lookup failed:", twinErr.message);
      }
      const twin = (twins ?? []).find((d) => typeof d.extracted_text === "string" && d.extracted_text.trim());
      if (twin) {
        const reusedPages = twin.pages_count || Math.max(1, Math.ceil(twin.extracted_text.length / 3000));
        const { data: updated, error: updateError } = await supabase
          .from("brand_documents")
          .update({
            status: "ready",
            extracted_text: twin.extracted_text,
            pages_count: reusedPages,
            content_sha256: contentHash,
          })
          .eq("id", documentId)
          .select("id");
        if (!updateError && updated?.length) {
          console.log(`[vault/extract] ${documentId}: same bytes as ${twin.id}, reused without a provider call`);
          return NextResponse.json({
            success: true,
            extracted_text: twin.extracted_text,
            pages_count: reusedPages,
            reused: true,
          });
        }
        // Could not reuse it: fall through and read the file as before.
        console.error("[vault/extract] reuse failed, reading instead:", updateError?.message ?? "no row");
      }
    }

    const isPdf =
      fileBlob.type?.includes("pdf") || lower.endsWith(".pdf");
    const isImage =
      fileBlob.type?.startsWith("image/") ||
      /\.(png|jpg|jpeg|webp|gif)$/i.test(lower);

    let extractedText = "";
    // True only when the file was actually read (here or by the model); the
    // placeholder text below is not an index and must not be reused by hash.
    let indexed = false;
    let pagesCount = 0;

    /*
      Read it here first (lib/local-extract.ts). A PDF with a text layer and
      every DOCX/PPTX/XLSX carry their text as data: free, complete, and not
      cut off at max_tokens. Only images and scanned PDFs go to the model.
    */
    const office = officeKind(lower);
    let local: LocalText | null = null;
    const t1 = Date.now();
    try {
      if (isPdf) local = await extractPdfText(new Uint8Array(buffer));
      else if (office) local = extractOffice(new Uint8Array(buffer), office);
    } catch (err) {
      console.error(`[vault/extract] ${documentId}: local read failed, falling back:`, err instanceof Error ? err.message : err);
    }
    if (local) {
      console.log(`[vault/extract] ${documentId}: read locally (${local.via}, ${local.pages} pages, ${local.text.length} chars; download ${downloadMs} ms, read ${Date.now() - t1} ms), no provider call`);
      extractedText = local.text;
      pagesCount = local.pages;
      indexed = true;
    } else if (office) {
      // Nothing to read in it, or not a valid Office file. The API cannot read
      // these formats, so sending it there only spends money on a refusal.
      const fileName = storagePath.split("/").pop() || storagePath;
      extractedText = `[File: ${fileName}]\nDocument stored in vault. No text could be read from it — for automatic text extraction, please upload a PDF version of this document.`;
    } else try {
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
        // Neither a PDF, an image nor an Office file: nothing the model can read.
        throw new Error("Unsupported file type");
      }

      const params: Anthropic.MessageCreateParamsNonStreaming = {
        model: MODEL,
        // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
        // max_tokens caps thinking + text together — these calls would
        // truncate. None of them need reasoning tokens.
        thinking: { type: "disabled" },
        max_tokens: MAX_TOKENS,
        system: cachedSystem(VAULT_EXTRACT_STABLE),
        messages: [{ role: "user", content: messageContent }],
      };

      // Estimated over the whole file before the one call that reads it: a
      // 64-page PDF is refused here, before page one (criterion 4).
      const est = estimateCents({
        model: MODEL,
        inputChars: promptChars(params.system, params.messages),
        images: isImage && !isPdf ? 1 : 0,
        pdfPages: isImage && !isPdf ? 0 : pdfPageCount(new Uint8Array(buffer)),
        maxOutputTokens: MAX_TOKENS,
      });

      const response = await meter(
        {
          route: "vault/extract",
          brandId: auth.brandId,
          userId: auth.userId,
          estimateCents: est,
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

      logCacheUsage("vault-extract", response.usage);

      extractedText = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b as Anthropic.TextBlock).text)
        .join("");
      indexed = true;
    } catch (err) {
      // Refused before any provider call. The row is marked as not read (the
      // page shows it as an error either way) and the refusal says why.
      if (err instanceof BudgetRefused) {
        await supabase
          .from("brand_documents")
          .update({ status: "error" })
          .eq("id", documentId);
        return NextResponse.json(refusalBody(err), { status: err.status });
      }
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

    if (!pagesCount) pagesCount = Math.max(1, Math.ceil(extractedText.length / 3000));

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

    // Remember the bytes, so the same file is never read twice. Best effort:
    // before hq-billing.sql the column is missing and the upload still works.
    if (indexed && hashColumn) {
      const { error: hashErr } = await supabase
        .from("brand_documents")
        .update({ content_sha256: contentHash })
        .eq("id", documentId);
      if (hashErr) {
        if (isMissingHashColumn(hashErr)) warnNoHashColumn("vault/extract");
        else console.error("[vault/extract] could not store content hash:", hashErr.message);
      }
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
