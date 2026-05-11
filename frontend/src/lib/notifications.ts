"use client";

import { create } from "zustand";
import { listNotifications, markAllNotificationsRead, markNotificationRead, type AppNotification } from "./api";
import { isTokenUsable } from "./auth";
import { connectWs, subscribeUserNotifications, type Subscription } from "./ws";

export type NotificationItem = AppNotification;

type State = {
  items: NotificationItem[];
  unread: number;
  add: (n: NotificationItem) => void;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  connect: () => Promise<void>;
};

let notificationSubscription: Subscription | null = null;
let refreshTimer: number | null = null;
let connected = false;

export const useNotifications = create<State>((set, get) => ({
  items: [],
  unread: 0,
  add: (n) => set((s) => syncState(mergeItems(s.items, [normalizeItem(n)]))),
  refresh: async () => {
    if (!hasAuthToken()) {
      return;
    }
    const remote = await listNotifications().catch(() => []);
    if (!Array.isArray(remote)) return;
    set((s) => syncState(mergeItems(s.items, remote.map(normalizeItem))));
  },
  markRead: async (id) => {
    const current = get().items.find((item) => item.id === id);
    if (!current || current.read) return;

    if (!isLocalNotification(id)) {
      await markNotificationRead(id).catch(() => null);
    }

    set((s) =>
      syncState(
        s.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
      ),
    );
  },
  markAllRead: async () => {
    const hasRemoteUnread = get().items.some((item) => !item.read && !isLocalNotification(item.id));
    if (hasRemoteUnread) {
      await markAllNotificationsRead().catch(() => null);
    }

    set((s) => syncState(s.items.map((item) => ({ ...item, read: true }))));
  },
  connect: async () => {
    if (!hasAuthToken()) {
      return;
    }

    if (!notificationSubscription) {
      notificationSubscription = subscribeUserNotifications((raw) => {
        useNotifications.getState().add(normalizeItem(raw as NotificationItem));
      });
    }

    if (!connected) {
      connected = true;
      void connectWs();
    }

    if (typeof window !== "undefined" && refreshTimer == null) {
      refreshTimer = window.setInterval(() => {
        void useNotifications.getState().refresh();
      }, 30000);
    }

    await get().refresh();
  },
}));

function normalizeItem(item: Partial<NotificationItem>): NotificationItem {
  return {
    id: typeof item.id === "string" && item.id ? item.id : `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: typeof item.userId === "string" ? item.userId : "local",
    type: typeof item.type === "string" && item.type ? item.type : "GENERAL",
    payload: item.payload && typeof item.payload === "object" ? item.payload : {},
    read: Boolean(item.read),
    createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
  };
}

function mergeItems(existing: NotificationItem[], incoming: NotificationItem[]) {
  const merged = new Map<string, NotificationItem>();

  for (const item of existing) {
    merged.set(item.id, item);
  }

  for (const item of incoming) {
    const previous = merged.get(item.id);
    merged.set(item.id, previous ? { ...previous, ...item } : item);
  }

  return [...merged.values()].sort((left, right) => {
    const leftTime = left.createdAt ? Date.parse(left.createdAt) : 0;
    const rightTime = right.createdAt ? Date.parse(right.createdAt) : 0;
    return rightTime - leftTime;
  });
}

function syncState(items: NotificationItem[]) {
  return {
    items,
    unread: items.filter((item) => !item.read).length,
  };
}

function isLocalNotification(id: string) {
  return id.startsWith("local-");
}

function hasAuthToken() {
  if (typeof window === "undefined") {
    return false;
  }
  const token = localStorage.getItem("auth_token");
  return isTokenUsable(token);
}
