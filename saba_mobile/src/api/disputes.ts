import type { DisputeSummary } from "../types/models";
import { api, unwrapResponse } from "./client";

export async function listDisputes() {
  const response = await api.get("/disputes");
  const data = unwrapResponse(response, "Unable to load disputes");
  return Array.isArray(data) ? (data as DisputeSummary[]) : [];
}

export async function openDispute(input: {
  contractId: string;
  reason: string;
  details?: string;
  evidenceAssetIds?: string[];
}) {
  const response = await api.post("/disputes", input);
  return unwrapResponse(response, "Unable to open dispute") as DisputeSummary;
}
