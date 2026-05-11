/**
 * API proxy for auth endpoints (alternative path)
 * This route avoids any external rewrites and strips Origin to bypass backend CORS checks.
 */

export const dynamic = "force-dynamic";

const CONFIGURED_API_BASE =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "";

const API_BASE_CANDIDATES = Array.from(
  new Set(
    [CONFIGURED_API_BASE, "http://127.0.0.1:8080", "http://localhost:8080"].filter(Boolean),
  ),
);

function shouldRetryAcrossHosts(method: string): boolean {
  const upper = method.toUpperCase();
  return upper === "GET" || upper === "HEAD" || upper === "OPTIONS";
}

async function selectReachableBase(candidates: string[]): Promise<string> {
  for (const base of candidates) {
    try {
      const healthUrl = `${base.replace(/\/$/, "")}/actuator/health`;
      const resp = await fetch(healthUrl, {
        method: "GET",
        signal: AbortSignal.timeout(1500),
      });
      if (resp.ok) return base;
    } catch {
      // Continue checking next candidate.
    }
  }
  return candidates[0];
}

function buildTargetUrl(apiBase: string, pathParts?: string[]) {
  const path = Array.isArray(pathParts) ? pathParts.join("/") : "";
  return `${apiBase.replace(/\/$/, "")}/api/auth/${path}`.replace(
    /([^:]\/)\/+/g,
    "$1",
  );
}

async function proxy(request: Request, urls: string[]) {
  const headers = new Headers(request.headers);
  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  headers.delete("host");
  headers.delete("origin");
  headers.delete("Origin");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    request.method !== "OPTIONS"
  ) {
    init.body = await request.text();
  }

  let lastError: unknown = null;
  for (const url of urls) {
    try {
      const resp = await fetch(url, init);
      const respHeaders = new Headers(resp.headers);
      respHeaders.set("Access-Control-Allow-Origin", "*");
      respHeaders.set("Access-Control-Allow-Headers", "*");
      respHeaders.set(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      );

      return new Response(resp.body, {
        status: resp.status,
        headers: respHeaders,
      });
    } catch (error) {
      lastError = error;
      console.error(`Auth proxy error for ${url}:`, error);
    }
  }

  return Response.json(
    {
      error: "BACKEND_UNREACHABLE",
      message: "Failed to reach backend",
      details: String(lastError),
    },
    { status: 503 },
  );
}

export async function OPTIONS(
  request: Request,
  ctx: { params: Promise<{ path?: string[] }> },
) {
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
  const urls = API_BASE_CANDIDATES.map((base) => buildTargetUrl(base, path));
  return proxy(request, urls);
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await ctx.params;
  const base = await selectReachableBase(API_BASE_CANDIDATES);
  const urls = shouldRetryAcrossHosts(request.method)
    ? API_BASE_CANDIDATES.map((candidate) => buildTargetUrl(candidate, path))
    : [buildTargetUrl(base, path)];
  return proxy(request, urls);
}

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await ctx.params;
  const base = await selectReachableBase(API_BASE_CANDIDATES);
  const urls = shouldRetryAcrossHosts(request.method)
    ? API_BASE_CANDIDATES.map((candidate) => buildTargetUrl(candidate, path))
    : [buildTargetUrl(base, path)];
  return proxy(request, urls);
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await ctx.params;
  const base = await selectReachableBase(API_BASE_CANDIDATES);
  const urls = shouldRetryAcrossHosts(request.method)
    ? API_BASE_CANDIDATES.map((candidate) => buildTargetUrl(candidate, path))
    : [buildTargetUrl(base, path)];
  return proxy(request, urls);
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await ctx.params;
  const base = await selectReachableBase(API_BASE_CANDIDATES);
  const urls = shouldRetryAcrossHosts(request.method)
    ? API_BASE_CANDIDATES.map((candidate) => buildTargetUrl(candidate, path))
    : [buildTargetUrl(base, path)];
  return proxy(request, urls);
}
