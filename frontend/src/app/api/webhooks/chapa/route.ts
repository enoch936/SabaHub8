import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CONFIGURED_API_BASE = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";
const API_BASE_CANDIDATES = CONFIGURED_API_BASE
  ? [CONFIGURED_API_BASE]
  : ["http://127.0.0.1:8080", "http://localhost:8080"];

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const contentType = req.headers.get("content-type") ?? "application/json";
  const signature = req.headers.get("x-chapa-signature") ?? "";
  const idemKey = req.headers.get("idempotency-key") ?? "";

  let lastError: unknown = null;
  for (const base of API_BASE_CANDIDATES) {
    try {
      const response = await fetch(`${base.replace(/\/$/, "")}/api/payments/chapa/webhook`, {
        method: "POST",
        headers: {
          "content-type": contentType,
          "x-chapa-signature": signature,
          "idempotency-key": idemKey,
        },
        body: rawBody,
      });

      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: {
          "content-type": response.headers.get("content-type") ?? "application/json",
        },
      });
    } catch (error) {
      lastError = error;
    }
  }

  return NextResponse.json(
    { error: "backend_unavailable", details: String(lastError) },
    { status: 502 },
  );
}
