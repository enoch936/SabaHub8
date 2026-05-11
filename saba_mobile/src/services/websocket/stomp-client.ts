import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { WS_BASE_URL } from "../../config/env";
import { useSessionStore } from "../../store/session-store";

type MessageHandler = (payload: Record<string, unknown>) => void;

class StompService {
  private client: Client | null = null;
  private connected = false;
  private connectPromise: Promise<void> | null = null;
  private subscriptions = new Map<string, { destination: string; handler: MessageHandler; sub: StompSubscription | null }>();
  private sequence = 0;

  async ensureConnected() {
    if (this.connected) {
      return;
    }
    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = new Promise<void>((resolve) => {
      const token = useSessionStore.getState().token;
      if (!this.client) {
        this.client = new Client({
          brokerURL: WS_BASE_URL,
          connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
          reconnectDelay: 5000,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          onConnect: () => {
            this.connected = true;
            this.restoreSubscriptions();
            resolve();
          },
          onWebSocketClose: () => {
            this.connected = false;
          },
          onStompError: () => {
            this.connected = false;
          },
        });
      } else {
        this.client.configure({
          connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        });
      }

      if (!this.client.active) {
        this.client.activate();
      }

      setTimeout(() => resolve(), 2000);
    }).finally(() => {
      this.connectPromise = null;
    });

    return this.connectPromise;
  }

  disconnect() {
    this.client?.deactivate();
    this.connected = false;
  }

  publish(destination: string, body: Record<string, unknown>) {
    if (!this.client || !this.connected) {
      return;
    }
    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }

  subscribe(destination: string, handler: MessageHandler) {
    const id = `sub-${this.sequence++}`;
    this.subscriptions.set(id, { destination, handler, sub: null });
    if (this.connected) {
      this.activateSubscription(id);
    }
    return () => {
      const entry = this.subscriptions.get(id);
      if (entry?.sub) {
        entry.sub.unsubscribe();
      }
      this.subscriptions.delete(id);
    };
  }

  private restoreSubscriptions() {
    [...this.subscriptions.keys()].forEach((id) => this.activateSubscription(id));
  }

  private activateSubscription(id: string) {
    const entry = this.subscriptions.get(id);
    if (!entry || !this.client || !this.connected) {
      return;
    }
    entry.sub?.unsubscribe();
    entry.sub = this.client.subscribe(entry.destination, (message: IMessage) => {
      try {
        const payload = JSON.parse(message.body);
        if (payload && typeof payload === "object") {
          entry.handler(payload as Record<string, unknown>);
        } else {
          entry.handler({});
        }
      } catch {
        entry.handler({});
      }
    });
    this.subscriptions.set(id, entry);
  }
}

export const stompService = new StompService();
