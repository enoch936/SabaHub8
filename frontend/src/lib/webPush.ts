"use client";

import {
  deleteWebPushSubscription,
  getWebPushPublicKey,
  saveWebPushSubscription,
  type BrowserPushSubscription,
} from "./api";

let syncInFlight: Promise<void> | null = null;

export async function setupWebPush(): Promise<void> {
  if (syncInFlight) {
    return syncInFlight;
  }

  syncInFlight = syncWebPush().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

async function syncWebPush(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    await removeStaleSubscription();
    return;
  }

  const publicKey = await getWebPushPublicKey().catch(() => "");
  if (!publicKey) {
    return;
  }

  const registration = await navigator.serviceWorker.register("/push-sw.js");
  await navigator.serviceWorker.ready;

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  const payload = toSubscriptionPayload(subscription);
  if (!payload) {
    return;
  }

  await saveWebPushSubscription(payload).catch(() => undefined);
}

async function removeStaleSubscription() {
  const registration = await navigator.serviceWorker.getRegistration("/push-sw.js");
  if (!registration) {
    return;
  }

  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    return;
  }

  await deleteWebPushSubscription(subscription.endpoint).catch(() => undefined);
  await subscription.unsubscribe().catch(() => undefined);
}

function toSubscriptionPayload(subscription: PushSubscription): BrowserPushSubscription | null {
  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!subscription.endpoint || !p256dh || !auth) {
    return null;
  }

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh,
      auth,
    },
  };
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const normalized = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(normalized);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray.buffer;
}
