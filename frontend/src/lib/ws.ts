"use client";

import { Client, IMessage } from "@stomp/stompjs";

let client: Client | null = null;
let connected = false;

export type Subscription = { unsubscribe: () => void };

export function connectWs(): Promise<void> {
  if (client && connected) return Promise.resolve();
  return new Promise((resolve) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    
    // NOTE: In Codespaces, port 8080 must be set to "Public" visibility in the Ports panel
    // Otherwise WebSocket connections will fail with 302 redirect
    const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";
    const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss" : "ws";
    
    let wsUrl: string;
    if (isLocalhost) {
      // Local development - connect directly to backend
      wsUrl = `ws://localhost:8080/ws`;
    } else {
      // Codespaces or production - use current host with port 8080
      const host = typeof window !== "undefined" ? window.location.hostname : "";
      // Codespaces URLs are like: turbo-dollop-pj6r5p4x4v4736rq9-3000.app.github.dev
      // We need to change the port number from 3000 to 8080
      const wsHost = host.replace(/-3000\./, "-8080.");
      wsUrl = `${protocol}://${wsHost}/ws`;
    }
    
    client = new Client({
      brokerURL: wsUrl,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 10000, // Retry every 10 seconds
      onConnect: () => { connected = true; resolve(); },
      onStompError: (frame) => { 
        console.warn("WebSocket STOMP error (port 8080 must be public in Codespaces):", frame.headers?.message);
      },
      onWebSocketClose: () => { connected = false; },
      onWebSocketError: (event) => {
        console.warn("WebSocket connection error - check that port 8080 is public in Codespaces");
      },
    });
    client.activate();
  });
}

export function subscribeThread(threadId: string, onMessage: (body: Record<string, unknown>) => void): Subscription | null {
  if (!client || !connected) return null;
  const sub = client.subscribe(`/topic/threads/${threadId}/message.new`, (msg: IMessage) => {
    try { onMessage(JSON.parse(msg.body)); } catch {}
  });
  return { unsubscribe: () => sub.unsubscribe() };
}

export function subscribeAnnouncements(onMessage: (body: Record<string, unknown>) => void): Subscription | null {
  if (!client || !connected) return null;
  const sub = client.subscribe(`/topic/announcements`, (msg: IMessage) => {
    try { onMessage(JSON.parse(msg.body)); } catch {}
  });
  return { unsubscribe: () => sub.unsubscribe() };
}

export function sendThreadMessage(threadId: string, payload: Record<string, unknown>) {
  if (!client || !connected) return;
  client.publish({ destination: `/app/threads/${threadId}/message.send`, body: JSON.stringify(payload) });
}
