"use client";

import type { NotificationItem } from "./notifications";

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function humanizeType(type: string) {
  const normalized = readString(type);
  if (!normalized) {
    return "New notification";
  }

  return normalized
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getNotificationTitle(notification: NotificationItem) {
  return readString(notification.payload?.title) || humanizeType(notification.type);
}

export function getNotificationMessage(notification: NotificationItem) {
  return readString(notification.payload?.message);
}
