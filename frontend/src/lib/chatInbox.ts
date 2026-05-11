"use client";

import { create } from "zustand";
import { type AppNotification, listThreads, type ChatThread } from "./api";
import { connectWs, subscribeUserNotifications, type Subscription } from "./ws";

type State = {
  threads: ChatThread[];
  unreadMessages: number;
  sync: (threads: ChatThread[]) => void;
  refresh: () => Promise<void>;
  connect: () => Promise<void>;
};

let refreshTimer: number | null = null;
let notificationSubscription: Subscription | null = null;

export const useChatInbox = create<State>((set, get) => ({
  threads: [],
  unreadMessages: 0,
  sync: (threads) => set(toState(threads)),
  refresh: async () => {
    const remote = await listThreads().catch(() => []);
    if (!Array.isArray(remote)) {
      return;
    }
    set(toState(remote));
  },
  connect: async () => {
    await connectWs();

    if (!notificationSubscription) {
      notificationSubscription = subscribeUserNotifications((rawBody) => {
        const notification = rawBody as Partial<AppNotification>;
        const type = typeof notification.type === "string" ? notification.type : "";
        const payload = notification.payload && typeof notification.payload === "object"
          ? notification.payload as Record<string, unknown>
          : {};
        const threadId = typeof payload.threadId === "string" ? payload.threadId : "";

        if (!threadId || (type !== "CHAT_MESSAGE" && type !== "CONTACT")) {
          return;
        }

        void get().refresh();
      });
    }

    if (typeof window !== "undefined" && refreshTimer == null) {
      refreshTimer = window.setInterval(() => {
        void get().refresh();
      }, 15000);
    }

    await get().refresh();
  },
}));

function toState(threads: ChatThread[]) {
  const normalizedThreads = [...threads].sort((left, right) => {
    const leftTime = left.lastMessageAt ? Date.parse(left.lastMessageAt) : 0;
    const rightTime = right.lastMessageAt ? Date.parse(right.lastMessageAt) : 0;
    return rightTime - leftTime;
  });

  return {
    threads: normalizedThreads,
    unreadMessages: normalizedThreads.reduce((sum, thread) => sum + Math.max(0, thread.unreadCount || 0), 0),
  };
}
