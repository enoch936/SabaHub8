export const dynamic = "force-dynamic";

const CONFIGURED_HLS_BASE = process.env.HLS_PUBLIC_ORIGIN || "http://localhost:8081/hls";
const HLS_BASE_CANDIDATES = CONFIGURED_HLS_BASE
  ? [CONFIGURED_HLS_BASE]
  : ["http://127.0.0.1:8081/hls", "http://localhost:8081/hls"];

function buildTargetUrl(hlsBase: string, pathParts?: string[], search = "") {
  const path = Array.isArray(pathParts) ? pathParts.join("/") : "";
  const base = `${hlsBase.replace(/\/$/, "")}/${path}`.replace(/([^:]\/)\/+/, "$1");
  return `${base}${search}`;
}

async function proxy(request: Request, urls: string[]) {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  let body: BodyInit | null = null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      const buffer = await request.arrayBuffer();
      body = buffer.byteLength ? buffer : null;
    } catch (error) {
      console.error("Error reading HLS request body:", error);
    }
  }

  let lastError: unknown = null;
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: request.method,
        headers,
        body: body ?? undefined,
      });

      const responseHeaders = new Headers(response.headers);
      responseHeaders.set("Cache-Control", "public, max-age=6");

      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    } catch (error) {
      lastError = error;
      console.error(`HLS proxy error for ${url}:`, error);
    }
  }

  return new Response(JSON.stringify({ error: "HLS origin unavailable", details: String(lastError) }), {
    status: 502,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function GET(request: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path } = await ctx.params;
  const search = new URL(request.url).search;
  const urls = HLS_BASE_CANDIDATES.map((base) => buildTargetUrl(base, path, search));
  return proxy(request, urls);
}

export async function HEAD(request: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path } = await ctx.params;
  const search = new URL(request.url).search;
  const urls = HLS_BASE_CANDIDATES.map((base) => buildTargetUrl(base, path, search));
  return proxy(request, urls);
}