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
"[project]/src/app/api/auth/[...path]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * API proxy for auth endpoints
 * Forwards requests to backend API to avoid CORS issues
 */ // Use a single env var consistently
__turbopack_context__.s([
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
    ()=>PUT
]);
const API_BASE = ("TURBOPACK compile-time value", "http://localhost:8080") || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
function buildTargetUrl(pathParts) {
    const path = Array.isArray(pathParts) ? pathParts.join("/") : "";
    // Normalize slashes and ensure we always hit backend /api/auth
    return `${API_BASE.replace(/\/$/, "")}/api/auth/${path}`.replace(/([^:]\/)\/+/, "$1");
}
async function proxy(request, url) {
    const headers = new Headers(request.headers);
    // Ensure auth header survives the proxy hop
    const auth = request.headers.get("authorization");
    if (auth) headers.set("authorization", auth);
    // Do not forward host header from Next.js runtime
    headers.delete("host");
    // Strip Origin to avoid triggering backend CORS on server-to-server call
    headers.delete("origin");
    headers.delete("Origin");
    const init = {
        method: request.method,
        // Forward credentials-related headers
        headers,
        redirect: "manual"
    };
    if (request.method !== "GET" && request.method !== "HEAD" && request.method !== "OPTIONS") {
        // Clone body if present
        init.body = await request.text();
    }
    let resp;
    try {
        resp = await fetch(url, init);
    } catch (error) {
        return Response.json({
            error: "BACKEND_UNREACHABLE",
            message: error?.message || "Failed to reach backend",
            target: url
        }, {
            status: 502
        });
    }
    const respHeaders = new Headers(resp.headers);
    respHeaders.set("Access-Control-Allow-Origin", "*");
    respHeaders.set("Access-Control-Allow-Headers", "*");
    respHeaders.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    // Stream back the response as-is
    return new Response(resp.body, {
        status: resp.status,
        headers: respHeaders
    });
}
async function OPTIONS(request, ctx) {
    const { path } = await ctx.params;
    const url = buildTargetUrl(path);
    // Respond OK for preflight
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

//# sourceMappingURL=%5Broot-of-the-server%5D__6762b204._.js.map