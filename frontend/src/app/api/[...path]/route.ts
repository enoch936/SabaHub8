/**
 * Generic API proxy for all backend endpoints
 * Forwards requests to backend API at localhost:8080 to avoid CORS issues
 */

export const dynamic = "force-dynamic";

// Backend base URL. Can be overridden via NEXT_PUBLIC_BACKEND_URL or BACKEND_URL.
const API_BASE =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:8080";

function buildTargetUrl(pathParts?: string[]) {
  const path = Array.isArray(pathParts) ? pathParts.join("/") : "";
  // Always hit the backend under /api to match Spring controllers
  return `${API_BASE.replace(/\/$/, "")}/api/${path}`.replace(/([^:]\/)\/+/, "$1");
}

async function proxy(request: Request, url: string) {
  const headers = new Headers(request.headers);
  // Explicitly forward Authorization if present (Next can strip hop-by-hop headers)
  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);

  // Remove headers that can break proxying in Next.js / Node.
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  // Ensure we pass the real client IP info through (optional, but useful).
  if (!headers.has("x-forwarded-host") && request.headers.get("host")) {
    headers.set("x-forwarded-host", request.headers.get("host")!);
  }

  try {
    // Clone the request to read body if needed
    let body: BodyInit | null = null;
    if (request.method !== "GET" && request.method !== "HEAD") {
      try {
        body = await request.text();
      } catch (e) {
        console.error("Error reading request body:", e);
      }
    }

    const resp = await fetch(url, {
      method: request.method,
      headers,
      body: body || undefined,
    });

    const respHeaders = new Headers(resp.headers);
    respHeaders.set("Access-Control-Allow-Origin", "*");
    respHeaders.set("Access-Control-Allow-Headers", "*");
    respHeaders.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");

    return new Response(resp.body, {
      status: resp.status,
      headers: respHeaders,
    });
  } catch (error) {
    console.error(`Proxy error for ${url}:`, error);
    return new Response(JSON.stringify({ error: "Backend unavailable", details: String(error) }), {
      status: 502,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}

export async function OPTIONS(request: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    },
  });
}

export async function GET(request: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path } = await ctx.params;
  const url = buildTargetUrl(path);
  return proxy(request, url);
}

export async function POST(request: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path } = await ctx.params;
  const url = buildTargetUrl(path);
  return proxy(request, url);
}

export async function PUT(request: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path } = await ctx.params;
  const url = buildTargetUrl(path);
  return proxy(request, url);
}

export async function PATCH(request: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path } = await ctx.params;
  const url = buildTargetUrl(path);
  return proxy(request, url);
}

export async function DELETE(request: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path } = await ctx.params;
  const url = buildTargetUrl(path);
  return proxy(request, url);
}
