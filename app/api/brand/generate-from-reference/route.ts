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
    const { images, brief } = (await req.json()) as {
      images: string[];
      brief: Brief;
    };

    if (!images?.length || !brief?.subject) {
      return NextResponse.json({ error: "missing_input", message: "Reference images and subject are required" }, { status: 400 });
    }

    const aspectRatio = mapAspectRatio(brief.format);

    // Build a clean, simple prompt
    let prompt = `Generate a new photograph that closely matches the visual style of the attached reference image. `;
    prompt += `The new image should show: ${brief.subject}. `;
    if (brief.colour) prompt += `They are wearing ${brief.colour}. `;
    if (brief.other) prompt += `${brief.other}. `;
    prompt += `IMPORTANT: Match the reference image exactly for light direction, light temperature, light intensity, shadow softness, color saturation level, color grading tone, contrast level, and overall color palette. `;
    prompt += `The generated image should feel like it was taken in the same photoshoot as the reference — same camera, same lighting setup, same color grade applied in post. `;
    prompt += `Professional photography, sharp focus, natural skin tones. `;
    prompt += `Aspect ratio ${aspectRatio}.`;

    // Build parts: text FIRST, then only 1 reference image
    const parts: Record<string, unknown>[] = [];

    // Text instruction first
    parts.push({ text: prompt });

    // Only send the first reference image
    parts.push({
      inline_data: {
        mime_type: "image/jpeg",
        data: images[0],
      },
    });

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

    const responseText = await response.text();

    if (!response.ok) {
      console.error("Gemini error:", responseText.slice(0, 300));
      return NextResponse.json({ error: "api_error", message: `Gemini API error: ${responseText.slice(0, 200)}` }, { status: 500 });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("Gemini non-JSON response:", responseText.slice(0, 300));
      return NextResponse.json({ error: "api_error", message: `Gemini returned invalid response: ${responseText.slice(0, 150)}` }, { status: 500 });
    }

    // Check for safety blocks
    const finishReason = data.candidates?.[0]?.finishReason;
    if (finishReason === "SAFETY" || finishReason === "BLOCKED") {
      return NextResponse.json({
        error: "safety_block",
        message: "Gemini flagged this request. Try a simpler subject description or a different reference image.",
      }, { status: 400 });
    }

    // Find the generated image in parts
    const candidateParts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = candidateParts.find(
      (p: { inlineData?: { data: string; mimeType: string }; inline_data?: { data: string; mime_type: string } }) =>
        p.inlineData || p.inline_data
    );

    // Gemini sometimes uses camelCase (inlineData) instead of snake_case (inline_data)
    const imageData = imagePart?.inlineData?.data || imagePart?.inline_data?.data;
    const mimeType = imagePart?.inlineData?.mimeType || imagePart?.inline_data?.mime_type || "image/png";

    if (!imageData) {
      const debugInfo = JSON.stringify(data).slice(0, 400);
      console.error("Gemini response (no image):", debugInfo);
      return NextResponse.json({
        error: "no_image",
        message: `No image returned. Debug: ${debugInfo}`,
      }, { status: 400 });
    }

    return NextResponse.json({
      imageBase64: imageData,
      mimeType,
    });
  } catch (error) {
    console.error("generate-from-reference error:", error);
    return NextResponse.json({
      error: "api_error",
      message: error instanceof Error ? error.message : "Image generation failed",
    }, { status: 500 });
  }
}
