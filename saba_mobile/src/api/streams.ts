import type { StreamDetail, StreamJoinResponse, StreamSummary } from "../types/models";
import { api, unwrapResponse } from "./client";

export type StreamAdminOverview = {
  liveStreamCount: number;
  totalViewerCount: number;
  liveStreams: StreamSummary[];
  healthCards: Array<Record<string, unknown>>;
};

export async function listStreams() {
  const response = await api.get("/streams");
  return unwrapResponse(response, "Unable to load streams") as StreamSummary[];
}

export async function getStream(streamId: string) {
  const response = await api.get(`/streams/${encodeURIComponent(streamId)}`);
  return unwrapResponse(response, "Unable to load stream") as StreamDetail;
}

export async function createStream(input: {
  title: string;
  description?: string;
  visibility?: "PUBLIC" | "PRIVATE" | "UNLISTED";
  recordingEnabled?: boolean;
  lowLatencyEnabled?: boolean;
  playbackEnabled?: boolean;
  mode?: "ONE_TO_ONE" | "ONE_TO_MANY";
  mediaKind?: "AUDIO" | "VIDEO" | "AUDIO_VIDEO";
  maxParticipants?: number;
  tags?: string[];
}) {
  const response = await api.post("/streams", input);
  return unwrapResponse(response, "Unable to create stream") as StreamDetail;
}

export async function startStream(streamId: string, input?: {
  recordingEnabled?: boolean;
  lowLatencyEnabled?: boolean;
  playbackEnabled?: boolean;
  targetLatencySeconds?: number;
}) {
  const response = await api.post(`/streams/${encodeURIComponent(streamId)}/start`, input ?? {});
  return unwrapResponse(response, "Unable to start stream") as StreamDetail;
}

export async function stopStream(streamId: string) {
  const response = await api.post(`/streams/${encodeURIComponent(streamId)}/stop`);
  return unwrapResponse(response, "Unable to stop stream") as StreamDetail;
}

export async function joinStream(streamId: string, preferredProtocol = "WEBRTC") {
  const response = await api.post(`/streams/${encodeURIComponent(streamId)}/join`, { preferredProtocol });
  return unwrapResponse(response, "Unable to join stream") as StreamJoinResponse;
}

export async function leaveStream(streamId: string) {
  const response = await api.post(`/streams/${encodeURIComponent(streamId)}/leave`);
  return unwrapResponse(response, "Unable to leave stream") as { success?: boolean } | null;
}

export async function getAdminStreamOverview() {
  const response = await api.get("/admin/streams/overview");
  return unwrapResponse(response, "Unable to load stream overview") as StreamAdminOverview;
}

export async function terminateStream(streamId: string, reason: string) {
  const response = await api.post(`/admin/streams/${encodeURIComponent(streamId)}/terminate`, { reason });
  return unwrapResponse(response, "Unable to terminate stream") as StreamDetail;
}

export async function muteStreamViewer(streamId: string, targetUserId: string, reason?: string) {
  const response = await api.post(`/streams/${encodeURIComponent(streamId)}/moderation/mute`, {
    targetUserId,
    reason,
  });
  return unwrapResponse(response, "Unable to mute viewer");
}

export async function kickStreamViewer(streamId: string, targetUserId: string, reason?: string) {
  const response = await api.post(`/streams/${encodeURIComponent(streamId)}/moderation/kick`, {
    targetUserId,
    reason,
  });
  return unwrapResponse(response, "Unable to remove viewer");
}
