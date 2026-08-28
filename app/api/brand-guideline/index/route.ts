import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { HOUSE_STYLE } from "@/lib/house-style";
import { sanitiseOutput } from "@/lib/sanitise-output";

// Image-heavy guideline PDFs are slow: a 40-page one measured 104s. 300 is the
// Vercel Pro ceiling; on Hobby this is capped at 60 and large PDFs will fail.
export const maxDuration = 300;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
- "summary" is what the assistant reads to answer questions. Include everything of substance: positioning, mission, tone, colour rules, typography, logo usage, imagery, packaging, social. Prefer the guideline's own wording. Long is fine.` + HOUSE_STYLE;

type Body = {
  brandId: string;
  storagePath?: string;
  bucket?: string;
  documentId?: string;
  sourceName?: string;
  images?: { data: string; type: string }[];
};

export async function POST(req: NextRequest) {
  let brandId = "";
  try {
    const body = (await req.json()) as Body;
    brandId = body.brandId;
    const { storagePath, bucket, documentId, sourceName, images } = body;

    if (!brandId) {
      return NextResponse.json({ error: "brandId is required" }, { status: 400 });
    }
    if (!storagePath && !(images && images.length)) {
      return NextResponse.json(
        { error: "Provide either storagePath or images" },
        { status: 400 }
      );
    }

    const content: Anthropic.Messages.ContentBlockParam[] = [];
    let sourceType: "pdf" | "images";
    let pageCount: number | null = null;

    if (storagePath) {
      const { data: blob, error: dlErr } = await supabase.storage
        .from(bucket || "brand-documents")
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

      if (isPdf) {
        sourceType = "pdf";
        content.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: base64 },
        });
      } else {
        sourceType = "images";
        pageCount = 1;
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

    content.push({ type: "text", text: PROMPT });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      // The digest is long by design; this is the one extraction route where a
      // tight cap would truncate the thing we are trying to store.
      thinking: { type: "disabled" },
      max_tokens: 16000,
      messages: [{ role: "user", content }],
    });

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
