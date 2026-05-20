import type { AdminUser } from "../types/models";
import { api, unwrapResponse } from "./client";
import type { StreamAdminOverview } from "./streams";

export async function adminListUsers() {
  const response = await api.get("/admin/users");
  const data = unwrapResponse(response, "Unable to load admin users");
  return Array.isArray(data) ? (data as AdminUser[]) : [];
}

export async function adminPatchUser(userId: string, patch: Record<string, unknown>) {
  const response = await api.patch(`/admin/users/${encodeURIComponent(userId)}`, patch);
  return unwrapResponse(response, "Unable to update user") as AdminUser;
}

export async function adminListStreamsOverview() {
  const response = await api.get("/admin/streams/overview");
  return unwrapResponse(response, "Unable to load stream overview") as StreamAdminOverview;
}

export async function adminTerminateStream(streamId: string, reason: string) {
  const response = await api.post(`/admin/streams/${encodeURIComponent(streamId)}/terminate`, { reason });
  return unwrapResponse(response, "Unable to terminate stream");
}

export async function adminAnalyticsSummary() {
  const response = await api.get("/admin/analytics/summary");
  return unwrapResponse(response, "Unable to load analytics summary") as {
    users: number;
    jobs: number;
    revenue: number;
    disputesOpen: number;
  };
}

export async function adminAnalyticsWorkspace(days = 30) {
  const response = await api.get("/admin/analytics/workspace", { params: { days } });
  return unwrapResponse(response, "Unable to load analytics workspace");
}
