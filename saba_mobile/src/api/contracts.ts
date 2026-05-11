import type { ContractSummary } from "../types/models";
import { api, unwrapResponse } from "./client";

export async function listContracts() {
  const response = await api.get("/contracts");
  const data = unwrapResponse(response, "Unable to load contracts");
  return Array.isArray(data) ? (data as ContractSummary[]) : [];
}
