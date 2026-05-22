import { NextResponse } from "next/server";
import { VIDEO_STORIES } from "../../../components/landing/landing-data";

const BACKEND = process.env.BACKEND_API_URL || process.env.SABAHUB_API_URL || "http://localhost:8080";
const CANDIDATES = [
  process.env.STORIES_ENDPOINT,
  `${BACKEND}/api/stories`,
  `${BACKEND}/stories`,
  `${BACKEND}/api/public/stories`,
].filter(Boolean) as string[];

async function tryFetch(url: string) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (e) {
    return null;
  }
}

export async function GET() {
  for (const url of CANDIDATES) {
    const data = await tryFetch(url);
    if (data && Array.isArray(data) && data.length > 0) {
      return NextResponse.json(data);
    }
  }

  // No upstream data found — return 502 so frontend doesn't render fallback
  return NextResponse.json({ error: "no upstream data" }, { status: 502 });
}
