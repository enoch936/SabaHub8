/**
 * Generic API proxy for all backend endpoints
 * Forwards requests to backend API at localhost:8080 to avoid CORS issues
 */

export const dynamic = "force-dynamic";

const API_BASE = "http://localhost:8080";

function buildTargetUrl(pathParts?: string[]) {
  const path = Array.isArray(pathParts) ? pathParts.join("/") : "";
  return `${API_BASE.replace(/\/$/, "")}/${path}`.replace(/([^:]\/)\/+/, "$1");
}

async function proxy(request: Request, url: string) {
  const headers = new Headers(request.headers);
  // Remove headers that cause issues
  headers.delete("host");
  headers.delete("origin");
  headers.delete("Origin");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD" && request.method !== "OPTIONS") {
    init.body = await request.text();
  }

  const resp = await fetch(url, init);
  const respHeaders = new Headers(resp.headers);
  respHeaders.set("Access-Control-Allow-Origin", "*");
  respHeaders.set("Access-Control-Allow-Headers", "*");
  respHeaders.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");

  return new Response(resp.body, {
    status: resp.status,
    headers: respHeaders,
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
