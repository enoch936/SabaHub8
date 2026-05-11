import type { Asset } from "../types/models";
import { api, unwrapResponse } from "./client";

export async function uploadSignature(params: Record<string, unknown>) {
  const response = await api.post("/assets/signature", params);
  return unwrapResponse(response, "Unable to create upload signature") as {
    cloudName: string;
    apiKey: string;
    signature: string;
    params?: Record<string, string>;
  };
}

export async function saveAssetMetadata(input: {
  scope: string;
  title?: string;
  secureUrl: string;
  publicId: string;
  resourceType?: string;
  mimeType?: string;
  size?: number;
}) {
  const response = await api.post("/assets", input);
  return unwrapResponse(response, "Unable to save attachment metadata") as Asset;
}
