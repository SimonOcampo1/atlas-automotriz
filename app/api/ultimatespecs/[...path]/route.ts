export const runtime = "edge";

export function GET() {
  return new Response("Not found", { status: 404 });
}
