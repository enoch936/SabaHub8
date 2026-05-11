import { createStream, startStream } from "../../api/streams";
import type { ChatThread, MediaKind, StreamMode } from "../../types/models";

export const CALL_INVITE_PREFIX = "[sabahub-call]";

export type ThreadType = "DIRECT" | "GROUP" | "CHANNEL";
export type ThreadCallMode = "DIRECT_CALL" | "GROUP_CALL" | "CHANNEL_BROADCAST";

export type CallInvitePayload = {
  version: 1;
  streamId: string;
  threadId: string;
  threadType: ThreadType;
  callMode: ThreadCallMode;
  streamMode: StreamMode;
  mediaKind: MediaKind;
  interactive: boolean;
  title: string;
  startedByUserId: string;
  startedByDisplayName: string;
  startedAt: number;
};

function resolveThreadType(thread: ChatThread): ThreadType {
  if (thread.threadType === "GROUP" || thread.threadType === "CHANNEL" || thread.threadType === "DIRECT") {
    return thread.threadType;
  }
  return thread.participantIds.length > 2 ? "GROUP" : "DIRECT";
}

function buildCallTitle(thread: ChatThread, mediaKind: MediaKind) {
  const baseName = thread.groupName?.trim() || "Conversation";
  const callLabel = mediaKind === "AUDIO" ? "Audio" : "Video";
  const threadType = resolveThreadType(thread);

  if (threadType === "CHANNEL") {
    return `${baseName} ${callLabel} Broadcast`;
  }
  if (threadType === "GROUP") {
    return `${baseName} ${callLabel} Room`;
  }
  return `${callLabel} Call`;
}

export function resolveThreadCallConfig(thread: ChatThread, mediaKind: MediaKind) {
  const threadType = resolveThreadType(thread);
  const streamMode: StreamMode = threadType === "DIRECT" ? "ONE_TO_ONE" : "ONE_TO_MANY";
  const callMode: ThreadCallMode =
    threadType === "CHANNEL" ? "CHANNEL_BROADCAST" : threadType === "GROUP" ? "GROUP_CALL" : "DIRECT_CALL";
  const interactive = threadType !== "CHANNEL";
  const maxParticipants =
    threadType === "DIRECT" ? 2 : Math.max(thread.participantIds.length || 0, threadType === "GROUP" ? 8 : 25);

  return {
    threadType,
    callMode,
    streamMode,
    interactive,
    mediaKind,
    maxParticipants,
    title: buildCallTitle(thread, mediaKind),
  };
}

export async function createThreadCallInvite(input: {
  thread: ChatThread;
  mediaKind: MediaKind;
  startedByUserId: string;
  startedByDisplayName: string;
}) {
  const { thread, mediaKind, startedByDisplayName, startedByUserId } = input;
  const config = resolveThreadCallConfig(thread, mediaKind);

  const draft = await createStream({
    title: config.title,
    description: `Realtime ${config.callMode.toLowerCase().replace(/_/g, " ")} for thread ${thread.id}`,
    visibility: "UNLISTED",
    recordingEnabled: false,
    lowLatencyEnabled: true,
    playbackEnabled: false,
    mode: config.streamMode,
    mediaKind: config.mediaKind,
    maxParticipants: config.maxParticipants,
    tags: [
      "chat-call",
      `thread:${thread.id}`,
      `thread-type:${config.threadType.toLowerCase()}`,
      `call-mode:${config.callMode.toLowerCase()}`,
    ],
  });

  const live = await startStream(draft.id, {
    recordingEnabled: false,
    lowLatencyEnabled: true,
    playbackEnabled: false,
    targetLatencySeconds: 2,
  });

  return {
    version: 1 as const,
    streamId: live.id,
    threadId: thread.id,
    threadType: config.threadType,
    callMode: config.callMode,
    streamMode: config.streamMode,
    mediaKind: config.mediaKind,
    interactive: config.interactive,
    title: live.title || config.title,
    startedByUserId,
    startedByDisplayName,
    startedAt: Date.now(),
  };
}

export function buildCallInviteMessage(invite: CallInvitePayload) {
  return `${CALL_INVITE_PREFIX}${JSON.stringify(invite)}`;
}

export function parseCallInviteMessage(text?: string | null) {
  if (!text || !text.startsWith(CALL_INVITE_PREFIX)) {
    return null;
  }
  try {
    const payload = JSON.parse(text.slice(CALL_INVITE_PREFIX.length)) as Partial<CallInvitePayload>;
    if (
      payload.version === 1 &&
      typeof payload.streamId === "string" &&
      typeof payload.threadId === "string" &&
      typeof payload.title === "string" &&
      typeof payload.startedByUserId === "string" &&
      typeof payload.startedByDisplayName === "string" &&
      typeof payload.startedAt === "number" &&
      (payload.threadType === "DIRECT" || payload.threadType === "GROUP" || payload.threadType === "CHANNEL") &&
      (payload.callMode === "DIRECT_CALL" || payload.callMode === "GROUP_CALL" || payload.callMode === "CHANNEL_BROADCAST") &&
      (payload.streamMode === "ONE_TO_ONE" || payload.streamMode === "ONE_TO_MANY") &&
      (payload.mediaKind === "AUDIO" || payload.mediaKind === "VIDEO" || payload.mediaKind === "AUDIO_VIDEO")
    ) {
      return {
        ...payload,
        interactive: Boolean(payload.interactive),
      } as CallInvitePayload;
    }
  } catch {
    return null;
  }
  return null;
}

export function describeCallInvite(invite: CallInvitePayload) {
  const mediaLabel = invite.mediaKind === "AUDIO" ? "audio" : "video";
  if (invite.callMode === "CHANNEL_BROADCAST") {
    return `Started a ${mediaLabel} broadcast`;
  }
  if (invite.callMode === "GROUP_CALL") {
    return `Started a group ${mediaLabel} call`;
  }
  return `Started a ${mediaLabel} call`;
}

export function callInviteActionLabel(invite: CallInvitePayload) {
  if (invite.callMode === "CHANNEL_BROADCAST") {
    return invite.mediaKind === "AUDIO" ? "Join Audio Broadcast" : "Join Live Broadcast";
  }
  return invite.mediaKind === "AUDIO" ? "Join Audio Call" : "Join Video Call";
}
