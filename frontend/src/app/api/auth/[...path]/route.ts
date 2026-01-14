/**
 * API proxy for auth endpoints
 * Forwards requests to backend API to avoid CORS issues
 */

// Use a single env var consistently
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

function buildTargetUrl(pathParts: string[] | undefined) {
  const path = Array.isArray(pathParts) ? pathParts.join("/") : "";
  // Normalize slashes and ensure we always hit backend /api/auth
  return `${API_BASE.replace(/\/$/, "")}/api/auth/${path}`.replace(/([^:]\/)\/+/, "$1");
}

async function proxy(request: Request, url: string) {
  const headers = new Headers(request.headers);
  // Ensure auth header survives the proxy hop
  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  // Do not forward host header from Next.js runtime
  headers.delete("host");
  // Strip Origin to avoid triggering backend CORS on server-to-server call
  headers.delete("origin");
  headers.delete("Origin");

  const init: RequestInit = {
    method: request.method,
    // Forward credentials-related headers
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD" && request.method !== "OPTIONS") {
    // Clone body if present
    init.body = await request.text();
  }

  let resp: Response;
  try {
    resp = await fetch(url, init);
  } catch (error: any) {
    return Response.json(
      {
        error: "BACKEND_UNREACHABLE",
        message: error?.message || "Failed to reach backend",
        target: url,
      },
      { status: 502 },
    );
  }
  const respHeaders = new Headers(resp.headers);
  respHeaders.set("Access-Control-Allow-Origin", "*");
  respHeaders.set("Access-Control-Allow-Headers", "*");
  respHeaders.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");

  // Stream back the response as-is
  return new Response(resp.body, {
    status: resp.status,
    headers: respHeaders,
  });
}

export async function OPTIONS(
  request: Request,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await ctx.params;
  const url = buildTargetUrl(path);
  // Respond OK for preflight
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    },
  });
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await ctx.params;
  const url = buildTargetUrl(path);
  return proxy(request, url);
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await ctx.params;
  const url = buildTargetUrl(path);
  return proxy(request, url);
}

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await ctx.params;
  const url = buildTargetUrl(path);
  return proxy(request, url);
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await ctx.params;
  const url = buildTargetUrl(path);
  return proxy(request, url);
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await ctx.params;
  const url = buildTargetUrl(path);
  return proxy(request, url);
}
