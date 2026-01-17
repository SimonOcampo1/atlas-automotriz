import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const IMAGE_ROOT = path.join(process.cwd(), "public", "ultimatespecs");

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const relativePath = resolvedParams.path?.join("/") ?? "";
  const normalized = relativePath.replace(/\\/g, "/");

  if (!normalized || normalized.includes("..") || normalized.startsWith("/")) {
    return new Response("Not found", { status: 404 });
  }

  const absolutePath = path.join(IMAGE_ROOT, normalized);

  try {
    const file = await fs.readFile(absolutePath);
    const contentType =
      MIME_BY_EXT[path.extname(absolutePath).toLowerCase()] ||
      "application/octet-stream";

    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
