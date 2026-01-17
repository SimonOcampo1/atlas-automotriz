import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const raw = code.trim();
  const candidates = [raw, raw.toUpperCase(), raw.toLowerCase()];

  const { searchParams } = new URL(request.url);
  const size = searchParams.get("size");

  const svgRoot = path.join(process.cwd(), "public", "flags", "SVG");
  const pngRoot = path.join(
    process.cwd(),
    "public",
    "flags",
    size === "128" ? "PNG-128" : "PNG-32"
  );

  const pngPath = candidates
    .map((candidate) => path.join(pngRoot, `${candidate}.png`))
    .find((candidatePath) => fs.existsSync(candidatePath));

  const svgPath = candidates
    .map((candidate) => path.join(svgRoot, `${candidate}.svg`))
    .find((candidatePath) => fs.existsSync(candidatePath));

  const filePath = pngPath ?? svgPath;

  if (!filePath) {
    return new NextResponse("Not found", { status: 404 });
  }

  const isPng = filePath.endsWith(".png");
  const data = isPng ? fs.readFileSync(filePath) : fs.readFileSync(filePath, "utf-8");
  return new NextResponse(data, {
    headers: {
      "Content-Type": isPng ? "image/png" : "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
