import { NextRequest, NextResponse } from "next/server";
import { colorMediaType } from "@/lib/brand-colors";
import { extractColors } from "@/lib/brand-colors-server";
import { requireUser } from '@/lib/api-auth'

/**
 * Colours out of a file the caller holds, without saving anything.
 *
 * The extraction itself lives in lib/brand-colors.ts because the guideline
 * upload needs the same thing — it used to be written out twice, once here and
 * once inside /api/brand-assets/upload, with two prompts that had drifted.
 */
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  /*
    Signed in, or nothing happens.

    This route spends money on every call. Left open it is an uncapped model
    bill for anyone who finds the URL, and nothing about it would look wrong —
    no data leaves, the graph just climbs.
  */
  const auth = await requireUser(req)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const type = formData.get("type") as string | null;
    const mediaType = type === "pdf" ? "application/pdf" : colorMediaType(file.name, file.type);
    if (!mediaType) return NextResponse.json({ error: "Not a readable file" }, { status: 400 });

    const colors = await extractColors(Buffer.from(await file.arrayBuffer()), mediaType);
    return NextResponse.json({ colors });
  } catch (error) {
    console.error("Color extraction error:", error);
    const message = error instanceof Error ? error.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
