export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const raw = code.trim();
  if (!raw) {
    return new Response("Not found", { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const size = searchParams.get("size");
  const normalized = raw.toUpperCase();
  const pngFolder = size === "128" ? "PNG-128" : "PNG-32";
  const target = size ? `/flags/${pngFolder}/${normalized}.png` : `/flags/SVG/${normalized}.svg`;
  return Response.redirect(new URL(target, request.url), 302);
}
