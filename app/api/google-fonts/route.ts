import { NextRequest, NextResponse } from "next/server";

const POPULAR_FONTS = [
  "Inter", "Roboto", "Open Sans", "Montserrat", "Lato", "Poppins",
  "Raleway", "Oswald", "Nunito", "Playfair Display", "DM Sans",
  "DM Serif Display", "DM Mono", "Syne", "Space Grotesk", "Outfit",
  "Plus Jakarta Sans", "Manrope", "Urbanist", "Lexend", "Archivo",
  "Source Sans 3", "Noto Sans", "Work Sans", "Barlow", "Quicksand",
  "Mulish", "Rubik", "Karla", "Cabin", "Libre Baskerville",
  "Merriweather", "Lora", "Crimson Text", "EB Garamond", "Cormorant",
  "Space Mono", "JetBrains Mono", "Fira Code", "IBM Plex Mono",
  "Source Code Pro", "Roboto Mono", "Inconsolata",
];

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.toLowerCase() || "";

  const filtered = query
    ? POPULAR_FONTS.filter((f) => f.toLowerCase().includes(query))
    : POPULAR_FONTS;

  return NextResponse.json({ fonts: filtered.slice(0, 20) });
}
