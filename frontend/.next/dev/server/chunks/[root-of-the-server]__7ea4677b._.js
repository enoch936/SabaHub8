module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/src/app/api/[...path]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Generic API proxy for all backend endpoints
 * Forwards requests to backend API at localhost:8080 to avoid CORS issues
 */ __turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "OPTIONS",
    ()=>OPTIONS,
    "PATCH",
    ()=>PATCH,
    "POST",
    ()=>POST,
    "PUT",
    ()=>PUT,
    "dynamic",
    ()=>dynamic
]);
const dynamic = "force-dynamic";
// Backend base URL. Can be overridden via NEXT_PUBLIC_BACKEND_URL or BACKEND_URL.
const API_BASE = process.env.BACKEND_URL || ("TURBOPACK compile-time value", "http://localhost:8080") || "http://localhost:8080";
function buildTargetUrl(pathParts) {
    const path = Array.isArray(pathParts) ? pathParts.join("/") : "";
    // Always hit the backend under /api to match Spring controllers
    return `${API_BASE.replace(/\/$/, "")}/api/${path}`.replace(/([^:]\/)\/+/, "$1");
}
async function proxy(request, url) {
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
        headers.set("x-forwarded-host", request.headers.get("host"));
    }
    try {
        // Clone the request to read body if needed
        let body = null;
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
            body: body || undefined
        });
        const respHeaders = new Headers(resp.headers);
        respHeaders.set("Access-Control-Allow-Origin", "*");
        respHeaders.set("Access-Control-Allow-Headers", "*");
        respHeaders.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
        return new Response(resp.body, {
            status: resp.status,
            headers: respHeaders
        });
    } catch (error) {
        console.error(`Proxy error for ${url}:`, error);
        return new Response(JSON.stringify({
            error: "Backend unavailable",
            details: String(error)
        }), {
            status: 502,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    }
}
async function OPTIONS(request, ctx) {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS"
        }
    });
}
async function GET(request, ctx) {
    const { path } = await ctx.params;
    const url = buildTargetUrl(path);
    return proxy(request, url);
}
async function POST(request, ctx) {
    const { path } = await ctx.params;
    const url = buildTargetUrl(path);
    return proxy(request, url);
}
async function PUT(request, ctx) {
    const { path } = await ctx.params;
    const url = buildTargetUrl(path);
    return proxy(request, url);
}
async function PATCH(request, ctx) {
    const { path } = await ctx.params;
    const url = buildTargetUrl(path);
    return proxy(request, url);
}
async function DELETE(request, ctx) {
    const { path } = await ctx.params;
    const url = buildTargetUrl(path);
    return proxy(request, url);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__7ea4677b._.js.map