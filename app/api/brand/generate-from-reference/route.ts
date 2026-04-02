import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

interface Brief {
  subject: string;
  format: string;
  colour: string;
  mode: string;
  other: string;
}

function mapAspectRatio(format: string): string {
  const map: Record<string, string> = {
    "Square 1:1": "1:1",
    "Portrait 9:16": "9:16",
    "Landscape 16:9": "16:9",
    "Portrait 4:5": "4:5",
  };
  return map[format] || "1:1";
}

export async function POST(req: NextRequest) {
  try {
    const { images, brief, dna } = (await req.json()) as {
      images: string[];
      brief: Brief;
      dna: { headline?: string; datapoints?: { label: string; value: string }[] } | null;
    };

    if (!images?.length || !brief?.subject) {
      return NextResponse.json({ error: "missing_input", message: "Reference images and subject are required" }, { status: 400 });
    }

    const aspectRatio = mapAspectRatio(brief.format);

    const internalPrompt = `
You are generating a professional brand photograph.

Study the reference image(s) provided and create a NEW image of: ${brief.subject}

Match the reference image(s) exactly for:
- Lighting quality, direction, and temperature
- Background treatment and depth of field
- Colour rendering and restraint — do not boost saturation beyond the reference
- Skin tone treatment
- Overall mood and photographic energy

${brief.colour ? `Wardrobe / colour: ${brief.colour}` : ""}
${brief.other ? `Additional: ${brief.other}` : ""}

${dna?.headline ? `Brand visual rules: ${dna.headline}` : ""}

Aspect ratio: ${aspectRatio}

Technical requirements:
- Full-frame camera quality, 85mm equivalent lens
- Sharp focus on subject, professional exposure
- Natural skin tones, no artificial saturation
- Photorealistic — looks like a real photograph, not illustrated or CGI
- Colour grade: natural and restrained, slight lifted shadows, no blown highlights, film-like tonal range
- Do not add text, logos, or watermarks
`;

    // Build parts: reference images first, then text
    const parts: Record<string, unknown>[] = [];

    for (const base64 of images.slice(0, 3)) {
      parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: base64,
        },
      });
    }

    parts.push({ text: internalPrompt });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini error:", err);
      return NextResponse.json({ error: "api_error", message: `Gemini API error: ${err.slice(0, 200)}` }, { status: 500 });
    }

    const data = await response.json();

    // Check for safety blocks
    if (data.candidates?.[0]?.finishReason === "SAFETY") {
      return NextResponse.json({
        error: "safety_block",
        message: "Gemini flagged this request. Try adjusting your subject description or changing the reference image.",
      }, { status: 400 });
    }

    // Find the generated image in parts
    const candidateParts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = candidateParts.find((p: { inline_data?: { data: string; mime_type: string } }) => p.inline_data);

    if (!imagePart?.inline_data?.data) {
      return NextResponse.json({
        error: "no_image",
        message: "Gemini did not return an image. Try simplifying your request or using different reference images.",
      }, { status: 400 });
    }

    return NextResponse.json({
      imageBase64: imagePart.inline_data.data,
      mimeType: imagePart.inline_data.mime_type || "image/jpeg",
    });
  } catch (error) {
    console.error("generate-from-reference error:", error);
    return NextResponse.json({
      error: "api_error",
      message: error instanceof Error ? error.message : "Image generation failed",
    }, { status: 500 });
  }
}
