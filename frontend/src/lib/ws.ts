"use client";

import { Client, IMessage, type StompSubscription } from "@stomp/stompjs";

let client: Client | null = null;
let connected = false;
let connectPromise: Promise<void> | null = null;
let resolveConnect: (() => void) | null = null;
let connectTimeoutId: ReturnType<typeof setTimeout> | null = null;
let subscriptionSequence = 0;

type ManagedSubscription = {
  destination: string;
  handler: (body: Record<string, unknown>) => void;
  active: StompSubscription | null;
};

const managedSubscriptions = new Map<string, ManagedSubscription>();

export type Subscription = { unsubscribe: () => void };

export function connectWs(): Promise<void> {
  if (connected) return Promise.resolve();
  if (connectPromise) return connectPromise;

  ensureClient();
  if (client && !client.active) {
    client.activate();
  }

  connectPromise = new Promise((resolve) => {
    resolveConnect = () => {
      if (connectTimeoutId) {
        clearTimeout(connectTimeoutId);
        connectTimeoutId = null;
      }
      connectPromise = null;
      resolve();
    };

    // Let REST-driven pages continue loading even if the socket is late.
    connectTimeoutId = setTimeout(() => {
      const resolver = resolveConnect;
      resolveConnect = null;
      if (resolver) resolver();
    }, 1500);
  });

  return connectPromise;
}

export function subscribeThread(threadId: string, onMessage: (body: Record<string, unknown>) => void): Subscription | null {
  return registerSubscription(`/topic/threads/${threadId}/message.new`, onMessage);
}

export function subscribeThreadTyping(threadId: string, onMessage: (body: Record<string, unknown>) => void): Subscription | null {
  return registerSubscription(`/topic/threads/${threadId}/typing`, onMessage);
}

export function subscribeAnnouncements(onMessage: (body: Record<string, unknown>) => void): Subscription | null {
  return registerSubscription(`/topic/announcements`, onMessage);
}

export function subscribeUserNotifications(onMessage: (body: Record<string, unknown>) => void): Subscription | null {
  return registerSubscription(`/user/queue/notifications`, onMessage);
}

export function sendThreadMessage(threadId: string, payload: Record<string, unknown>) {
  if (!client || !connected) return;
  client.publish({ destination: `/app/threads/${threadId}/message.send`, body: JSON.stringify(payload) });
}

export function sendThreadTyping(threadId: string, payload: Record<string, unknown>) {
  if (!client || !connected) return;
  client.publish({ destination: `/app/threads/${threadId}/typing`, body: JSON.stringify(payload) });
}

export function subscribeStreamChat(streamId: string, onMessage: (body: Record<string, unknown>) => void): Subscription | null {
  return registerSubscription(`/topic/streams/${streamId}/chat`, onMessage);
}

export function subscribeStreamPresence(streamId: string, onMessage: (body: Record<string, unknown>) => void): Subscription | null {
  return registerSubscription(`/topic/streams/${streamId}/presence`, onMessage);
}

export function subscribeStreamSignals(streamId: string, onMessage: (body: Record<string, unknown>) => void): Subscription | null {
  return registerSubscription(`/topic/streams/${streamId}/signal`, onMessage);
}

export function subscribeLiveActivities(onMessage: (body: Record<string, unknown>) => void): Subscription | null {
  return registerSubscription(`/topic/live-activities`, onMessage);
}

export function sendStreamChat(streamId: string, payload: Record<string, unknown>) {
  if (!client || !connected) return;
  client.publish({ destination: `/app/streams/${streamId}/chat.send`, body: JSON.stringify(payload) });
}

export function sendStreamPresenceJoin(streamId: string) {
  if (!client || !connected) return;
  client.publish({ destination: `/app/streams/${streamId}/presence.join`, body: JSON.stringify({}) });
}

export function sendStreamPresenceLeave(streamId: string) {
  if (!client || !connected) return;
  client.publish({ destination: `/app/streams/${streamId}/presence.leave`, body: JSON.stringify({}) });
}

export function sendStreamSignal(streamId: string, payload: Record<string, unknown>) {
  if (!client || !connected) return;
  client.publish({ destination: `/app/streams/${streamId}/signal.publish`, body: JSON.stringify(payload) });
}

function ensureClient() {
  if (client) return;

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  // NOTE: In Codespaces, port 8080 must be set to "Public" visibility in the Ports panel
  // Otherwise WebSocket connections will fail with 302 redirect
  const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";
  const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss" : "ws";

  let wsUrl: string;
  if (isLocalhost) {
    wsUrl = `ws://localhost:8080/ws`;
  } else {
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    const wsHost = host.replace(/-3000\./, "-8080.");
    wsUrl = `${protocol}://${wsHost}/ws`;
  }

  client = new Client({
    brokerURL: wsUrl,
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: 10000,
    onConnect: () => {
      connected = true;
      restoreSubscriptions();
      const resolver = resolveConnect;
      resolveConnect = null;
      if (resolver) resolver();
    },
    onStompError: (frame) => {
      console.warn("WebSocket STOMP error (port 8080 must be public in Codespaces):", frame.headers?.message);
    },
    onWebSocketClose: () => {
      connected = false;
    },
    onWebSocketError: () => {
      console.warn("WebSocket connection error - check that port 8080 is public in Codespaces");
    },
  });
}

function registerSubscription(destination: string, handler: (body: Record<string, unknown>) => void): Subscription {
  const id = `managed-sub-${subscriptionSequence++}`;
  const subscription: ManagedSubscription = { destination, handler, active: null };

  managedSubscriptions.set(id, subscription);
  if (connected) {
    activateSubscription(subscription);
  }

  return {
    unsubscribe: () => {
      subscription.active?.unsubscribe();
      managedSubscriptions.delete(id);
    },
  };
}

function restoreSubscriptions() {
  for (const subscription of managedSubscriptions.values()) {
    activateSubscription(subscription);
  }
}

function activateSubscription(subscription: ManagedSubscription) {
  if (!client || !connected) return;

  subscription.active?.unsubscribe();
  subscription.active = client.subscribe(subscription.destination, (msg: IMessage) => {
    try {
      const parsed = JSON.parse(msg.body);
      subscription.handler(parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {});
    } catch {
      subscription.handler({});
    }
  });
}
