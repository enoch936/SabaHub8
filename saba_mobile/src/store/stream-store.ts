import { create } from "zustand";
import { createStream, getStream, joinStream, leaveStream, listStreams, startStream } from "../api/streams";
import type { PresenceEvent, SignalEnvelope, StreamDetail, StreamJoinResponse, StreamSummary } from "../types/models";
import { stompService } from "../services/websocket/stomp-client";

export type StreamChatEvent = {
  senderDisplayName?: string;
  senderUserId?: string;
  body?: string;
  occurredAt?: number;
};

type StreamState = {
  streams: StreamSummary[];
  loading: boolean;
  activeStream: StreamDetail | null;
  joinInfo: StreamJoinResponse | null;
  chatEvents: StreamChatEvent[];
  presenceEvents: PresenceEvent[];
  viewerCount: number;
  signals: SignalEnvelope[];
  streamSubscriptions: Array<() => void>;
  loadStreams: () => Promise<void>;
  startQuickStream: () => Promise<string>;
  openStream: (streamId: string) => Promise<void>;
  closeStream: () => Promise<void>;
  sendStreamChat: (streamId: string, body: string) => void;
  sendPresenceJoin: (streamId: string) => void;
  sendPresenceLeave: (streamId: string) => void;
  sendSignal: (streamId: string, payload: Record<string, unknown>) => void;
};

export const useStreamStore = create<StreamState>((set, get) => ({
  streams: [],
  loading: false,
  activeStream: null,
  joinInfo: null,
  chatEvents: [],
  presenceEvents: [],
  viewerCount: 0,
  signals: [],
  streamSubscriptions: [],

  loadStreams: async () => {
    set({ loading: true });
    try {
      const streams = await listStreams();
      set({ streams });
    } finally {
      set({ loading: false });
    }
  },

  startQuickStream: async () => {
    set({ loading: true });
    try {
      const suffix = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const draft = await createStream({
        title: `Mobile Live ${suffix}`,
        description: "Started from the mobile streaming panel.",
        visibility: "PUBLIC",
        recordingEnabled: false,
        lowLatencyEnabled: true,
        playbackEnabled: false,
        mode: "ONE_TO_MANY",
        mediaKind: "AUDIO_VIDEO",
        maxParticipants: 200,
      });

      const live = await startStream(draft.id, {
        recordingEnabled: false,
        lowLatencyEnabled: true,
        playbackEnabled: false,
        targetLatencySeconds: 2,
      });

      const streams = await listStreams();
      set({ streams });
      return live.id;
    } finally {
      set({ loading: false });
    }
  },

  openStream: async (streamId) => {
    set({ loading: true });
    try {
      const [detail, joinInfo] = await Promise.all([getStream(streamId), joinStream(streamId)]);
      await stompService.ensureConnected();

      const subs: Array<() => void> = [];
      subs.push(
        stompService.subscribe(`/topic/streams/${streamId}/chat`, (payload) => {
          const event = payload as StreamChatEvent;
          set((state) => ({
            chatEvents: [...state.chatEvents.slice(-100), event],
          }));
        }),
      );
      subs.push(
        stompService.subscribe(`/topic/streams/${streamId}/presence`, (payload) => {
          const event = payload as PresenceEvent;
          set((state) => ({
            presenceEvents: [...state.presenceEvents.slice(-100), event],
            viewerCount: typeof payload.viewerCount === "number" ? payload.viewerCount : state.viewerCount,
          }));
        }),
      );
      subs.push(
        stompService.subscribe(`/topic/streams/${streamId}/signal`, (payload) => {
          const signal = payload as SignalEnvelope;
          set((state) => ({
            signals: [...state.signals.slice(-200), signal],
          }));
        }),
      );

      set({
        activeStream: detail,
        joinInfo,
        viewerCount: detail.viewerCount,
        chatEvents: [],
        presenceEvents: [],
        signals: [],
        streamSubscriptions: subs,
      });
    } finally {
      set({ loading: false });
    }
  },

  closeStream: async () => {
    const state = get();
    const streamId = state.activeStream?.id;
    state.streamSubscriptions.forEach((unsubscribe) => unsubscribe());
    if (streamId) {
      try {
        await leaveStream(streamId);
      } catch {
        // Ignore leave errors while closing viewer screen.
      }
    }
    set({
      activeStream: null,
      joinInfo: null,
      chatEvents: [],
      presenceEvents: [],
      signals: [],
      viewerCount: 0,
      streamSubscriptions: [],
    });
  },

  sendStreamChat: (streamId, body) => {
    stompService.publish(`/app/streams/${streamId}/chat.send`, { body });
  },

  sendPresenceJoin: (streamId) => {
    stompService.publish(`/app/streams/${streamId}/presence.join`, {});
  },

  sendPresenceLeave: (streamId) => {
    stompService.publish(`/app/streams/${streamId}/presence.leave`, {});
  },

  sendSignal: (streamId, payload) => {
    stompService.publish(`/app/streams/${streamId}/signal.publish`, payload);
  },
}));
