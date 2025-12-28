"use client";

import { create } from "zustand";
import { connectWs } from "./ws";

export type NotificationItem = {
  id: string;
  type: string;
  payload?: any;
  read?: boolean;
  createdAt?: string;
};

type State = {
  items: NotificationItem[];
  unread: number;
  add: (n: NotificationItem) => void;
  markAllRead: () => void;
  connect: () => Promise<void>;
};

export const useNotifications = create<State>((set, get) => ({
  items: [],
  unread: 0,
  add: (n) => set((s) => ({ items: [n, ...s.items], unread: s.unread + 1 })),
  markAllRead: () => set((s) => ({ unread: 0, items: s.items.map((i) => ({ ...i, read: true })) })),
  connect: async () => {
    await connectWs();
    // For demo: subscribe to a broadcast topic if backend provides.
    // If backend broadcasts to /topic/notifications or /user/queue/notifications, adapt this in ws.ts.
    // This file expects backend to publish notification.new events in a consistent format.
  },
}));
