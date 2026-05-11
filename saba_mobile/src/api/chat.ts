import type { ChatMessage, ChatThread } from "../types/models";
import { api, unwrapResponse } from "./client";

function asChatThread(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === "object" &&
    typeof (payload as Record<string, unknown>).id === "string" &&
    Array.isArray((payload as Record<string, unknown>).participantIds)
  ) {
    return payload as ChatThread;
  }
  throw new Error(fallback);
}

export async function listThreads() {
  const response = await api.get("/chat/threads");
  const data = unwrapResponse(response, "Unable to load threads");
  return Array.isArray(data) ? (data as ChatThread[]) : [];
}

export async function createThread(input: {
  participantIds: string[];
  threadType?: "DIRECT" | "GROUP" | "CHANNEL";
  groupName?: string;
  channelDescription?: string;
  memberMessagingEnabled?: boolean;
}) {
  const response = await api.post("/chat/threads", input);
  return asChatThread(unwrapResponse(response, "Unable to create thread"), "Unable to create thread");
}

export async function listMessages(threadId: string) {
  const response = await api.get(`/chat/threads/${encodeURIComponent(threadId)}/messages`);
  const data = unwrapResponse(response, "Unable to load messages");
  return Array.isArray(data) ? (data as ChatMessage[]) : [];
}

export async function sendMessage(
  threadId: string,
  payload: {
    type: "TEXT" | "ASSET";
    text?: string;
    assetId?: string;
    replyToMessageId?: string | null;
  },
) {
  const response = await api.post(`/chat/threads/${encodeURIComponent(threadId)}/messages`, payload);
  return unwrapResponse(response, "Unable to send message") as ChatMessage;
}

export async function markThreadRead(threadId: string) {
  const response = await api.post(`/chat/threads/${encodeURIComponent(threadId)}/read`);
  return asChatThread(unwrapResponse(response, "Unable to mark thread as read"), "Unable to mark thread as read");
}

export async function sendTyping(threadId: string, typing: boolean) {
  const response = await api.post(`/chat/threads/${encodeURIComponent(threadId)}/typing`, { typing });
  return unwrapResponse(response, "Unable to send typing state");
}
