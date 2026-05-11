"use client";

import type { Asset, ChatThread } from "@/lib/api";

export type ChatAssetKind = "image" | "video" | "audio" | "file";

export function formatConversationTime(iso?: string) {
  if (!iso) {
    return "";
  }

  const value = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfValue = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const diffDays = Math.floor((startOfToday.getTime() - startOfValue.getTime()) / 86_400_000);

  if (diffDays <= 0) {
    return value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) {
    return "Yesterday";
  }

  return value.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function formatMessageTime(iso?: string) {
  if (!iso) {
    return "";
  }

  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDayLabel(iso?: string) {
  if (!iso) {
    return "";
  }

  const value = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const diffDays = Math.floor((today.getTime() - target.getTime()) / 86_400_000);

  if (diffDays === 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "Yesterday";
  }

  return value.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: value.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

export function isSameCalendarDay(left?: string, right?: string) {
  if (!left || !right) {
    return false;
  }

  const leftDate = new Date(left);
  const rightDate = new Date(right);
  return leftDate.toDateString() === rightDate.toDateString();
}

export function getAssetKind(asset?: Asset | null): ChatAssetKind {
  const mimeType = asset?.mimeType?.toLowerCase() ?? "";
  const resourceType = asset?.resourceType?.toLowerCase() ?? "";

  if (mimeType.startsWith("image/") || resourceType === "image") {
    return "image";
  }
  if (mimeType.startsWith("video/") || resourceType === "video") {
    return "video";
  }
  if (mimeType.startsWith("audio/")) {
    return "audio";
  }

  return "file";
}

export function formatAssetLabel(asset?: Asset | null, assetId?: string) {
  if (asset?.title?.trim()) {
    return asset.title.trim();
  }
  if (asset?.mimeType?.trim()) {
    return asset.mimeType.trim();
  }
  if (assetId) {
    return `Attachment ${assetId.slice(0, 6)}`;
  }
  return "Attachment";
}

export function formatAssetSize(size?: number) {
  if (!size || Number.isNaN(size)) {
    return "";
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function isReadableAsset(asset?: Asset | null) {
  const mimeType = asset?.mimeType?.toLowerCase() ?? "";
  const resourceType = asset?.resourceType?.toLowerCase() ?? "";
  const url = asset?.url?.trim();

  if (!url) {
    return false;
  }

  return (
    mimeType === "application/pdf"
    || mimeType.startsWith("text/")
    || mimeType.includes("json")
    || mimeType.includes("xml")
    || mimeType.includes("csv")
    || mimeType.includes("html")
    || resourceType === "raw"
  );
}

export function getAssetAccessUrl(asset?: Asset | null) {
  return asset?.downloadUrl?.trim() || asset?.url?.trim() || "";
}

export function truncateText(value?: string, limit = 90) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (trimmed.length <= limit) {
    return trimmed;
  }

  return `${trimmed.slice(0, limit - 1)}…`;
}

export function getThreadBadgeLabel(threadType?: ChatThread["threadType"]) {
  if (threadType === "GROUP") {
    return "Group";
  }
  if (threadType === "CHANNEL") {
    return "Channel";
  }
  return "Chat";
}

export function getConversationInitial(title?: string) {
  const value = title?.trim();
  if (!value) {
    return "C";
  }

  return value.charAt(0).toUpperCase();
}

export function buildTypingLabel(names: string[]) {
  if (names.length === 0) {
    return "";
  }
  if (names.length === 1) {
    return `${names[0]} is typing…`;
  }
  if (names.length === 2) {
    return `${names[0]} and ${names[1]} are typing…`;
  }
  return `${names[0]}, ${names[1]}, and others are typing…`;
}

export function formatRelativeActivity(iso?: string) {
  if (!iso) {
    return "No activity yet";
  }

  const value = new Date(iso);
  const diffMs = Date.now() - value.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60_000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return formatConversationTime(iso);
}
