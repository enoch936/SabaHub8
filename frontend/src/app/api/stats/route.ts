import { NextResponse } from "next/server";
import { HERO_STATS } from "../../../components/landing/landing-data";

const BACKEND = process.env.BACKEND_API_URL || process.env.SABAHUB_API_URL || "http://localhost:8080";
const CANDIDATES = [
  process.env.STATS_ENDPOINT,
  `${BACKEND}/api/stats`,
  `${BACKEND}/stats`,
  `${BACKEND}/api/public/stats`,
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
    if (data) {
      // Normalize common shapes
      const normalized = {
        activeFreelancers: data.activeFreelancers ?? data.active_freelancers ?? data.active ?? data.activeFreelancers,
        jobsPosted: data.jobsPosted ?? data.jobs_posted ?? data.jobs ?? data.jobsPosted,
        paidToFreelancers: data.paidToFreelancers ?? data.paid_to_freelancers ?? data.paid ?? data.paidToFreelancers,
      };
      return NextResponse.json(normalized);
    }
  }

  // Fallback: convert HERO_STATS to a minimal normalized object
  const fallback = {
    activeFreelancers: HERO_STATS[0].value,
    jobsPosted: HERO_STATS[1].value,
    paidToFreelancers: HERO_STATS[2].value,
  };
  return NextResponse.json(fallback);
}
