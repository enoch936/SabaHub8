import { create } from "zustand";
import type { ChatMessage, ChatThread } from "../types/models";
import { listMessages, listThreads, markThreadRead, sendMessage } from "../api/chat";
import { describeCallInvite, parseCallInviteMessage } from "../services/chat/call-invites";
import { stompService } from "../services/websocket/stomp-client";

type ChatState = {
  loadingThreads: boolean;
  loadingMessages: boolean;
  threads: ChatThread[];
  messagesByThread: Record<string, ChatMessage[]>;
  typingByThread: Record<string, string[]>;
  subscriptionsByThread: Record<string, Array<() => void>>;
  loadThreads: () => Promise<void>;
  loadMessages: (threadId: string) => Promise<void>;
  sendText: (threadId: string, text: string) => Promise<void>;
  sendAsset: (threadId: string, assetId: string) => Promise<void>;
  markRead: (threadId: string) => Promise<void>;
  subscribeThreadRealtime: (threadId: string) => Promise<void>;
  unsubscribeThreadRealtime: (threadId: string) => void;
  clear: () => void;
};

function appendMessage(existing: ChatMessage[], incoming: ChatMessage) {
  const next = [...existing];
  const index = next.findIndex((message) => message.id === incoming.id);
  if (index >= 0) {
    next[index] = incoming;
    return next;
  }
  next.push(incoming);
  next.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
  return next;
}

function previewMessage(message: ChatMessage) {
  if (message.type === "ASSET") {
    return "[Attachment]";
  }
  const invite = parseCallInviteMessage(message.text);
  if (invite) {
    return describeCallInvite(invite);
  }
  return message.text?.trim() || "";
}

function updateThreadAfterMessage(threads: ChatThread[], threadId: string, message: ChatMessage) {
  return threads.map((thread) => {
    if (thread.id !== threadId) {
      return thread;
    }
    return {
      ...thread,
      lastMessage: previewMessage(message),
      lastMessageAt: message.createdAt,
      lastMessageSenderId: message.senderId,
    };
  });
}

export const useChatStore = create<ChatState>((set, get) => ({
  loadingThreads: false,
  loadingMessages: false,
  threads: [],
  messagesByThread: {},
  typingByThread: {},
  subscriptionsByThread: {},

  loadThreads: async () => {
    set({ loadingThreads: true });
    try {
      const threads = await listThreads();
      set({ threads });
    } finally {
      set({ loadingThreads: false });
    }
  },

  loadMessages: async (threadId) => {
    set({ loadingMessages: true });
    try {
      const messages = await listMessages(threadId);
      set((state) => ({
        messagesByThread: {
          ...state.messagesByThread,
          [threadId]: messages,
        },
      }));
    } finally {
      set({ loadingMessages: false });
    }
  },

  sendText: async (threadId, text) => {
    const message = await sendMessage(threadId, { type: "TEXT", text });
    set((state) => ({
      threads: updateThreadAfterMessage(state.threads, threadId, message),
      messagesByThread: {
        ...state.messagesByThread,
        [threadId]: appendMessage(state.messagesByThread[threadId] ?? [], message),
      },
    }));
  },

  sendAsset: async (threadId, assetId) => {
    const message = await sendMessage(threadId, { type: "ASSET", assetId });
    set((state) => ({
      threads: updateThreadAfterMessage(state.threads, threadId, message),
      messagesByThread: {
        ...state.messagesByThread,
        [threadId]: appendMessage(state.messagesByThread[threadId] ?? [], message),
      },
    }));
  },

  markRead: async (threadId) => {
    const updated = await markThreadRead(threadId);
    set((state) => ({
      threads: state.threads.map((thread) => (thread.id === updated.id ? updated : thread)),
    }));
  },

  subscribeThreadRealtime: async (threadId) => {
    const state = get();
    if (state.subscriptionsByThread[threadId]?.length) {
      return;
    }
    await stompService.ensureConnected();
    const unsubNewMessage = stompService.subscribe(`/topic/threads/${threadId}/message.new`, (payload) => {
      const message = payload as ChatMessage;
      if (!message.id) {
        return;
      }
      set((inner) => ({
        threads: updateThreadAfterMessage(inner.threads, threadId, message),
        messagesByThread: {
          ...inner.messagesByThread,
          [threadId]: appendMessage(inner.messagesByThread[threadId] ?? [], message),
        },
      }));
    });

    const unsubTyping = stompService.subscribe(`/topic/threads/${threadId}/typing`, (payload) => {
      const userId = typeof payload.userId === "string" ? payload.userId : "";
      const typing = Boolean(payload.typing);
      if (!userId) {
        return;
      }
      set((inner) => {
        const current = inner.typingByThread[threadId] ?? [];
        const next = typing ? [...new Set([...current, userId])] : current.filter((id) => id !== userId);
        return {
          typingByThread: {
            ...inner.typingByThread,
            [threadId]: next,
          },
        };
      });
    });

    set((inner) => ({
      subscriptionsByThread: {
        ...inner.subscriptionsByThread,
        [threadId]: [unsubNewMessage, unsubTyping],
      },
    }));
  },

  unsubscribeThreadRealtime: (threadId) => {
    const subs = get().subscriptionsByThread[threadId] ?? [];
    subs.forEach((unsubscribe) => unsubscribe());
    set((state) => ({
      subscriptionsByThread: {
        ...state.subscriptionsByThread,
        [threadId]: [],
      },
      typingByThread: {
        ...state.typingByThread,
        [threadId]: [],
      },
    }));
  },

  clear: () => {
    const subs = get().subscriptionsByThread;
    Object.values(subs).flat().forEach((unsubscribe) => unsubscribe());
    set({
      loadingThreads: false,
      loadingMessages: false,
      threads: [],
      messagesByThread: {},
      typingByThread: {},
      subscriptionsByThread: {},
    });
  },
}));
