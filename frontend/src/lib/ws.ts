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

  // Check for auth token in multiple locations
  const token = typeof window !== "undefined" ? 
    (localStorage.getItem("auth_token") || 
     sessionStorage.getItem("auth_token") || 
     localStorage.getItem("token") ||
     sessionStorage.getItem("token")) : null;

  // Silently skip connection if no token found (user not authenticated)
  if (!token) {
    return Promise.resolve();
  }

  ensureClient(token);
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

function ensureClient(token?: string) {
  if (client) return;

  const authToken = token || (typeof window !== "undefined" ? 
    (localStorage.getItem("auth_token") || 
     sessionStorage.getItem("auth_token") || 
     localStorage.getItem("token") ||
     sessionStorage.getItem("token")) : null);

  // Use the same hostname as the frontend, but connect to port 8080
  // This ensures the browser can reach the backend regardless of network setup
  const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss" : "ws";
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  
  let wsUrl: string;
  if (hostname) {
    // Pass token as query parameter for handshake authentication
    const params = authToken ? `?token=${encodeURIComponent(authToken)}` : "";
    wsUrl = `${protocol}://${hostname}:8080/ws${params}`;
  } else {
    // Fallback for SSR context
    wsUrl = `${protocol}://localhost:8080/ws`;
  }

  client = new Client({
    brokerURL: wsUrl,
    connectHeaders: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    reconnectDelay: 10000,
    onConnect: () => {
      connected = true;
      console.debug("WebSocket connected");
      restoreSubscriptions();
      const resolver = resolveConnect;
      resolveConnect = null;
      if (resolver) resolver();
    },
    onStompError: (frame) => {
      console.debug("WebSocket STOMP error:", frame.headers?.message);
    },
    onWebSocketClose: () => {
      connected = false;
    },
    onWebSocketError: (error) => {
      console.debug("WebSocket connection error - will retry", error);
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
