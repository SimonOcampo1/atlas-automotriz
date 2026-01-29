export const runtime = "edge";

const ALLOWED_PREFIXES = [
  "logos/thumb/",
  "logos/optimized/",
  "logos/original/",
  "local-logos/",
];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const relativePath = resolvedParams.path?.join("/") ?? "";
  const normalized = relativePath.replace(/\\/g, "/");

  if (!normalized || normalized.includes("..") || normalized.startsWith("/")) {
    return new Response("Not found", { status: 404 });
  }

  const isAllowed = ALLOWED_PREFIXES.some((prefix) =>
    normalized.startsWith(prefix)
  );

  if (!isAllowed) {
    return new Response("Not found", { status: 404 });
  }

  const target = `/car-logos-dataset/${normalized}`;
  return Response.redirect(new URL(target, request.url), 302);
}
