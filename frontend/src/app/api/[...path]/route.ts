/**
 * Generic API proxy for all backend endpoints
 * Forwards requests to backend API at localhost:8080 to avoid CORS issues
 */

export const dynamic = "force-dynamic";

// Backend base URL. Can be overridden via NEXT_PUBLIC_BACKEND_URL or BACKEND_URL.
const CONFIGURED_API_BASE = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";
const API_BASE_CANDIDATES = CONFIGURED_API_BASE
  ? [CONFIGURED_API_BASE]
  : ["http://127.0.0.1:8080", "http://localhost:8080"];

function buildTargetUrl(apiBase: string, pathParts?: string[], search = "") {
  const path = Array.isArray(pathParts) ? pathParts.join("/") : "";
  // Always hit the backend under /api to match Spring controllers
  const base = `${apiBase.replace(/\/$/, "")}/api/${path}`.replace(/([^:]\/)\/+/, "$1");
  return `${base}${search}`;
}

async function proxy(request: Request, urls: string[]) {
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

  let body: BodyInit | null = null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      const buffer = await request.arrayBuffer();
      body = buffer.byteLength ? buffer : null;
    } catch (e) {
      console.error("Error reading request body:", e);
    }
  }

  let lastError: unknown = null;
  for (const url of urls) {
    try {
      const resp = await fetch(url, {
        method: request.method,
        headers,
        body: body ?? undefined,
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
      lastError = error;
      const errorMsg = `Proxy error for ${url}: ${error instanceof Error ? error.message : String(error)}\n`;
      console.error(errorMsg);
      // Log to a file we can read
      try {
        const fs = require("fs");
        fs.appendFileSync("../proxy-errors.log", errorMsg);
      } catch (e) {}
    }
  }

  return new Response(JSON.stringify({ error: "Backend unavailable", details: String(lastError) }), {
    status: 502,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
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
  const search = new URL(request.url).search;
  const urls = API_BASE_CANDIDATES.map((base) => buildTargetUrl(base, path, search));
  return proxy(request, urls);
}

export async function POST(request: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path } = await ctx.params;
  const urls = API_BASE_CANDIDATES.map((base) => buildTargetUrl(base, path));
  return proxy(request, urls);
}

export async function PUT(request: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path } = await ctx.params;
  const urls = API_BASE_CANDIDATES.map((base) => buildTargetUrl(base, path));
  return proxy(request, urls);
}

export async function PATCH(request: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path } = await ctx.params;
  const urls = API_BASE_CANDIDATES.map((base) => buildTargetUrl(base, path));
  return proxy(request, urls);
}

export async function DELETE(request: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path } = await ctx.params;
  const urls = API_BASE_CANDIDATES.map((base) => buildTargetUrl(base, path));
  return proxy(request, urls);
}
