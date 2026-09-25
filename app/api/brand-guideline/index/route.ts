import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { resolveBrand } from "@/lib/api-auth";
import { HOUSE_STYLE } from "@/lib/house-style";
import { sanitiseOutput } from "@/lib/sanitise-output";
import { meter, BudgetRefused, refusalBody, requestLocale } from "@/lib/metering";
import { estimateCents, anthropicCostCents, promptChars, pdfPageCount } from "@/lib/usage-cost";
import { sha256Hex, isMissingHashColumn, warnNoHashColumn } from "@/lib/index-once";
import { extractPdfText } from "@/lib/local-extract";
import { storagePathFromUrl } from "@/lib/brand-colors";

// Image-heavy guideline PDFs are slow: a 40-page one measured 104s. 300 is the
// Vercel Pro ceiling; on Hobby this is capped at 60 and large PDFs will fail.
export const maxDuration = 300;

// maxRetries: 0 — meter() owns the one retry (hq-accounts.md criterion 7).
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 });

const MODEL = "claude-sonnet-5";
// Output is most of what this call costs. 8000 holds the JSON and a
// ~2,000-word digest; the old 16000 paid for length nobody asked for.
const MAX_TOKENS = 8000;

// A guideline with a text layer is sent as its text, not its pages (lib/local-extract).
// 150k characters is a very long guideline; the Sorbify one is 15.7k.
const MAX_TEXT_CHARS = 150000;

// Anthropic caps a request at 32MB. Base64 inflates by ~37%, so the real
// ceiling on the file itself is ~23MB — check before spending 100s on a
// request that cannot succeed.
const MAX_BYTES = 23 * 1024 * 1024;

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];

const PROMPT = `You are indexing a brand guideline so a brand assistant can answer questions from it later.

Return ONLY a JSON object, no markdown fences and no commentary, matching:

{
  "colors": [{ "hex": "#RRGGBB", "name": "Brand Orange", "usage": "Primary accent, CTAs" }],
  "typography": {
    "displayFont": "font family name only",
    "bodyFont": "font family name only, or null if the same",
    "scale": [{ "role": "Display", "size": "64px", "weight": "300", "usage": "Campaign heroes" }]
  },
  "logo": {
    "clearspace": "the exact clearspace rule as written",
    "minimumSize": "the exact minimum size rule as written",
    "restrictions": ["prohibited use rules, verbatim"]
  },
  "voice": {
    "tone": "how the brand speaks, as described in the guideline",
    "dos": ["verbatim guidance"],
    "donts": ["verbatim guidance"]
  },
  "summary": "A thorough markdown digest of the whole guideline."
}

Rules:
- Copy text VERBATIM wherever the guideline states a rule. Do not paraphrase rules.
- Read hex codes off the colour swatches exactly. If a swatch shows CMYK or Pantone only, convert and mark it in "usage".
- If a section genuinely is not in the document, use null (or an empty array). NEVER invent a rule, a hex code or a font name.
- "summary" is what the assistant reads to answer questions. Include everything of substance: positioning, mission, tone, colour rules, typography, logo usage, imagery, packaging, social. Prefer the guideline's own wording. Aim for at most about 2,000 words: the assistant reads it with every question, so every word is paid for again.` + HOUSE_STYLE;

type Body = {
  brandId: string;
  storagePath?: string;
  documentId?: string;
  sourceName?: string;
  images?: { data: string; type: string }[];
  /** "visual": index the brand's current guideline from Visual identity.
   *  The path is read from brand_visual on the server, never from the body. */
  source?: "visual";
};

export async function POST(req: NextRequest) {
  let brandId = "";
  try {
    const body = (await req.json()) as Body;
    brandId = body.brandId;
    const auth = await resolveBrand(req, brandId);
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
    brandId = auth.brandId;
    const { documentId, images } = body;
    let { storagePath, sourceName } = body;
    let bucket: "brand-documents" | "brand-assets" = "brand-documents";

    /*
      The guideline uploaded on Visual identity. That upload stopped calling
      this route in the 2026-08-29 rebuild, so from then on no guideline was
      indexed and Andy had no rulebook. The path comes from the brand's own
      brand_visual row; when that exact file is already indexed this returns
      before downloading anything, so the page can ask on every load.
    */
    let fromVisual = false;
    if (body.source === "visual") {
      const { data: vis } = await supabase
        .from("brand_visual").select("guideline_url").eq("brand_id", auth.brandId).maybeSingle();
      const path = storagePathFromUrl(vis?.guideline_url ?? null);
      if (!path) return NextResponse.json({ error: "No guideline" }, { status: 404 });
      const { data: current } = await supabase
        .from("brand_guideline").select("status, storage_path").eq("brand_id", auth.brandId).maybeSingle();
      if (current?.status === "ready" && current.storage_path === path) {
        return NextResponse.json({ success: true, reused: true, alreadyIndexed: true });
      }
      fromVisual = true;
      bucket = "brand-assets";
      storagePath = path;
      // "<16 hex of content>-<name>.pdf" since c3a0c8f, "<ms>-<name>.pdf" before.
      sourceName = path.split("/").pop()!.replace(/^[0-9a-f]{16}-|^\d{13}-/, "");
    }

    if (!brandId) {
      return NextResponse.json({ error: "brandId is required" }, { status: 400 });
    }
    if (!storagePath && !(images && images.length)) {
      return NextResponse.json(
        { error: "Provide either storagePath or images" },
        { status: 400 }
      );
    }

    /*
      A caller-supplied path is not permission to read it.

      `storagePath` and `bucket` both came off the body and were handed
      straight to the service-role client, which bypasses RLS — so any signed-in
      user could name any path in any bucket and have this route download it
      and hand back its contents as an indexed guideline. That is every other
      customer's brand book, and it needed nothing but a path.

      app/api/vault/extract/route.ts is the sibling that got this right: the
      path is only honoured once the row that owns it is proven to belong to
      the caller's brand. Same rule here. The bucket is no longer negotiable
      either — guidelines live in brand-documents.
    */
    if (storagePath && !fromVisual) {
      const { data: owned } = await supabase
        .from("brand_documents")
        .select("id")
        .eq("brand_id", auth.brandId)
        .eq("storage_path", storagePath)
        .maybeSingle();

      if (!owned) {
        // Same answer whether the path is someone else's or does not exist:
        // a different reply would confirm which paths are real.
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    const content: Anthropic.Messages.ContentBlockParam[] = [];
    let sourceType: "pdf" | "images";
    let pageCount: number | null = null;
    // What the estimate is built from, and what the index-once hash is of.
    let pdfPages = 0;
    let imageCount = 0;
    let contentHash: string;

    if (storagePath) {
      const { data: blob, error: dlErr } = await supabase.storage
        .from(bucket)
        .download(storagePath);

      if (dlErr || !blob) {
        throw new Error(`Could not download ${storagePath}: ${dlErr?.message ?? "not found"}`);
      }

      const buf = await blob.arrayBuffer();
      if (buf.byteLength > MAX_BYTES) {
        throw new Error(
          `File is ${(buf.byteLength / 1048576).toFixed(1)}MB. The API ceiling is about 23MB — split the guideline or export it smaller.`
        );
      }

      const base64 = Buffer.from(buf).toString("base64");
      const isPdf = blob.type?.includes("pdf") || storagePath.toLowerCase().endsWith(".pdf");

      contentHash = sha256Hex(buf);

      // A PDF with a real text layer goes as text: a few thousand tokens
      // instead of every page as an image. A scan still goes as the file.
      let local: Awaited<ReturnType<typeof extractPdfText>> = null;
      if (isPdf) {
        try { local = await extractPdfText(new Uint8Array(buf)); }
        catch (e) { console.error("[brand-guideline/index] text read failed, sending the file:", e instanceof Error ? e.message : e); }
      }
      if (isPdf && local) {
        sourceType = "pdf";
        pageCount = local.pages;
        content.push({
          type: "text",
          text: `The text layer of the brand guideline PDF (${local.pages} pages):\n\n<guideline>\n${local.text.slice(0, MAX_TEXT_CHARS)}\n</guideline>`,
        });
        console.log(`[brand-guideline/index] ${brandId}: sending text (${local.text.length} chars, ${local.pages} pages), not the file`);
      } else if (isPdf) {
        sourceType = "pdf";
        pdfPages = pdfPageCount(new Uint8Array(buf));
        content.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: base64 },
        });
      } else {
        sourceType = "images";
        pageCount = 1;
        imageCount = 1;
        const mt = (blob.type || "image/png") as ImageType;
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: IMAGE_TYPES.includes(mt) ? mt : "image/png",
            data: base64,
          },
        });
      }
    } else {
      sourceType = "images";
      pageCount = images!.length;
      imageCount = images!.length;
      contentHash = sha256Hex(...images!.map((img) => Buffer.from(img.data, "base64")));
      for (const img of images!) {
        const mt = img.type as ImageType;
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: IMAGE_TYPES.includes(mt) ? mt : "image/png",
            data: img.data,
          },
        });
      }
    }

    /*
      Index once (hq-accounts.md criterion 5). The guideline is one row per
      brand; when it is already indexed from these exact bytes, hand back what
      is stored and make no provider call. A row without a summary is not an
      index and is never reused.
    */
    let hashColumn = true;
    {
      const { data: existing, error: existingErr } = await supabase
        .from("brand_guideline")
        .select("status, content_sha256, colors, typography, logo, voice, summary")
        .eq("brand_id", brandId)
        .maybeSingle();
      if (existingErr) {
        if (isMissingHashColumn(existingErr)) { hashColumn = false; warnNoHashColumn("brand-guideline/index"); }
        else console.error("[brand-guideline/index] dedupe lookup failed:", existingErr.message);
      } else if (
        existing &&
        existing.status === "ready" &&
        existing.content_sha256 === contentHash &&
        typeof existing.summary === "string" &&
        existing.summary.trim()
      ) {
        if (documentId) {
          await supabase
            .from("brand_documents")
            .update({ status: "ready", extracted_text: existing.summary })
            .eq("id", documentId)
            .eq("brand_id", brandId);
        }
        // Same bytes at a new path (a re-upload, or the pre-hash file name):
        // point the row at it, so the page's path check short-circuits next
        // time instead of downloading the file again to hash it.
        if (storagePath && fromVisual) {
          await supabase.from("brand_guideline").update({ storage_path: storagePath }).eq("brand_id", brandId);
        }
        console.log(`[brand-guideline/index] ${brandId}: same bytes as the indexed guideline, reused without a provider call`);
        return NextResponse.json({
          success: true,
          colors: existing.colors ?? [],
          typography: existing.typography ?? null,
          logo: existing.logo ?? null,
          voice: existing.voice ?? null,
          summaryChars: existing.summary.length,
          reused: true,
        });
      }
    }

    content.push({ type: "text", text: PROMPT });

    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model: MODEL,
      // The digest is long by design; this is the one extraction route where a
      // tight cap would truncate the thing we are trying to store.
      thinking: { type: "disabled" },
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content }],
    };

    // One call reads the whole guideline, so one estimate covers every page:
    // a 64-page PDF is refused here, before page one (criterion 4).
    const response = await meter(
      {
        route: "brand-guideline/index",
        brandId,
        userId: auth.userId,
        estimateCents: estimateCents({
          model: MODEL,
          inputChars: promptChars(params.messages),
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

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as Anthropic.TextBlock).text)
      .join("");

    const cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Model did not return JSON");
      parsed = JSON.parse(match[0]);
    }

    // Prose, so it is sanitised. The structured fields around it are not:
    // hex values and rule text must survive verbatim.
    const summary = typeof parsed.summary === "string" ? sanitiseOutput(parsed.summary) : "";
    if (!summary.trim()) {
      throw new Error("Indexing produced no summary");
    }

    const row = {
      brand_id: brandId,
      source_name: sourceName ?? storagePath?.split("/").pop() ?? "guideline",
      source_type: sourceType,
      storage_path: storagePath ?? null,
      page_count: pageCount,
      colors: parsed.colors ?? null,
      typography: parsed.typography ?? null,
      logo: parsed.logo ?? null,
      voice: parsed.voice ?? null,
      summary,
      status: "ready",
      error: null,
      indexed_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await supabase
      .from("brand_guideline")
      .upsert(row, { onConflict: "brand_id" });

    if (upsertErr) {
      console.error("[brand-guideline/index] upsert failed:", upsertErr.message);
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    // Remember the bytes, so the same guideline is never read twice. Separate
    // from the upsert above so a missing column cannot fail the index itself.
    if (hashColumn) {
      const { error: hashErr } = await supabase
        .from("brand_guideline")
        .update({ content_sha256: contentHash })
        .eq("brand_id", brandId);
      if (hashErr) {
        if (isMissingHashColumn(hashErr)) warnNoHashColumn("brand-guideline/index");
        else console.error("[brand-guideline/index] could not store content hash:", hashErr.message);
      }
    }

    // If the guideline also lives in the vault, give that row the digest too,
    // so the document list stops showing it as unreadable.
    if (documentId) {
      await supabase
        .from("brand_documents")
        .update({ status: "ready", extracted_text: summary })
        .eq("id", documentId)
        .eq("brand_id", brandId);
    }

    const colorCount = Array.isArray(parsed.colors) ? parsed.colors.length : 0;
    console.log(
      `[brand-guideline/index] ${brandId}: ${summary.length} chars, ${colorCount} colours, source=${sourceType}`
    );

    return NextResponse.json({
      success: true,
      colors: parsed.colors ?? [],
      typography: parsed.typography ?? null,
      logo: parsed.logo ?? null,
      voice: parsed.voice ?? null,
      summaryChars: summary.length,
    });
  } catch (err) {
    // Refused before any provider call: the guideline already on file (if
    // any) is untouched, and the refusal says why.
    if (err instanceof BudgetRefused) {
      return NextResponse.json(refusalBody(err), { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Indexing failed";
    console.error("[brand-guideline/index]", message);
    // Record the failure so the UI can show it rather than sitting on a spinner.
    if (brandId) {
      await supabase
        .from("brand_guideline")
        .upsert(
          { brand_id: brandId, status: "error", error: message },
          { onConflict: "brand_id" }
        );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
