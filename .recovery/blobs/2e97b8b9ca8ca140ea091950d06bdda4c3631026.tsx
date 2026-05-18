"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  CornerUpLeft,
  Download,
  Eye,
  FileText,
  Forward,
  Image as ImageIcon,
  Pencil,
  Pin,
  SmilePlus,
  Trash2,
  Video,
} from "lucide-react";
import type { Asset, ChatMessage } from "@/lib/api";
import {
  formatAssetLabel,
  formatAssetSize,
  formatMessageTime,
  getAssetAccessUrl,
  getAssetKind,
  isReadableAsset,
} from "./chat-helpers";
import { VoiceMessageUI } from "./VoiceMessageUI";

interface MessageBubbleProps {
  message: ChatMessage;
  asset?: Asset | null;
  isMe: boolean;
  currentUserId?: string | null;
  senderLabel?: string;
  showSender?: boolean;
  replyPreview?: string | null;
  highlightQuery?: string | null;
  onReply?: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onForward?: (message: ChatMessage) => void;
  onPin?: (message: ChatMessage) => void;
  onReact?: (message: ChatMessage, emoji: string) => void;
}

const QUICK_REACTIONS = ["👍", "❤️", "🔥", "🎉"];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text?: string | null, query?: string | null) {
  if (!text) {
    return text || "";
  }

  const trimmedQuery = query?.trim();
  if (!trimmedQuery) {
    return text;
  }

  const pattern = new RegExp(`(${escapeRegExp(trimmedQuery)})`, "ig");
  return text.split(pattern).map((part, index) => {
    if (part.toLowerCase() === trimmedQuery.toLowerCase()) {
      return (
        <mark
          key={`${part}-${index}`}
          className="rounded bg-[#f4dba4]/80 px-1 text-inherit"
        >
          {part}
        </mark>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function ActionButton({
  label,
  onClick,
  icon,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  icon: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
        tone === "danger"
          ? "border-[#f1cbc1] bg-white/95 text-[#b45a4b] hover:bg-[#fff5f2]"
          : "border-white/80 bg-white/95 text-[#5f6d65] hover:border-[#d6dfd5] hover:text-[#27463b]"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function MessageBubble({
  message,
  asset,
  isMe,
  currentUserId,
  senderLabel,
  showSender = false,
  replyPreview,
  highlightQuery,
  onReply,
  onEdit,
  onDelete,
  onForward,
  onPin,
  onReact,
}: MessageBubbleProps) {
  const assetKind = getAssetKind(asset);
  const canEdit = isMe && message.type === "TEXT" && !message.deletedAt;
  const canDelete = isMe && !message.deletedAt;
  const containerTone = isMe
    ? "border-[#d5e4d2] bg-[#f1f6ea] text-[#22362d] shadow-[0_18px_30px_rgba(56,87,65,0.08)]"
    : "border-white/75 bg-white/92 text-[#26352f] shadow-[0_18px_30px_rgba(64,74,61,0.06)]";
  const subtleTone = "text-[#6c7d74]";
  const replyTone = isMe
    ? "border-[#d2e3d0] bg-[#e8f2e3] text-[#365247]"
    : "border-[#e8ddd1] bg-[#faf4ec] text-[#7a5d35]";

  const renderAsset = () => {
    const assetLabel = formatAssetLabel(asset, message.assetId);
    const detailLine =
      [asset?.mimeType, formatAssetSize(asset?.size)].filter(Boolean).join(" • ")
      || "Uploaded file";
    const accessUrl = getAssetAccessUrl(asset);
    const canReadInline = isReadableAsset(asset);

    if (assetKind === "image" && asset?.url) {
      return (
        <div className={`overflow-hidden rounded-[24px] border ${containerTone}`}>
          <img src={asset.url} alt={assetLabel} className="max-h-[340px] w-full object-cover" />
          <div className="space-y-2 px-4 py-3">
            <p className="text-sm font-semibold">{highlightText(assetLabel, highlightQuery)}</p>
            <p className={`text-xs ${subtleTone}`}>{detailLine}</p>
          </div>
        </div>
      );
    }

    if (assetKind === "video" && asset?.url) {
      return (
        <div className={`overflow-hidden rounded-[24px] border ${containerTone}`}>
          <video controls className="max-h-[340px] w-full bg-black object-cover">
            <source src={asset.url} />
          </video>
          <div className="space-y-2 px-4 py-3">
            <p className="text-sm font-semibold">{highlightText(assetLabel, highlightQuery)}</p>
            <p className={`text-xs ${subtleTone}`}>{detailLine}</p>
          </div>
        </div>
      );
    }

    if (assetKind === "audio" && asset?.url) {
      return (
        <div className={`rounded-[24px] border px-3 py-3 ${containerTone}`}>
          <VoiceMessageUI audioUrl={asset.url} />
          <div className={`mt-3 text-xs ${subtleTone}`}>
            {assetLabel}
            {detailLine ? ` • ${detailLine}` : ""}
          </div>
        </div>
      );
    }

    const assetIcon =
      assetKind === "video"
        ? <Video className="h-4 w-4" />
        : assetKind === "image"
          ? <ImageIcon className="h-4 w-4" />
          : <FileText className="h-4 w-4" />;

    return (
      <div className={`w-[320px] max-w-full rounded-[24px] border px-4 py-3 ${containerTone}`}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 rounded-2xl p-2 ${isMe ? "bg-white/75" : "bg-[#f4f7f2]"}`}>{assetIcon}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{highlightText(assetLabel, highlightQuery)}</p>
            <p className={`mt-1 text-xs ${subtleTone}`}>{detailLine}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {accessUrl ? (
                <Link
                  href={accessUrl}
                  target="_blank"
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    isMe ? "bg-[#27463b] text-white" : "bg-[#20332d] text-white"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Open
                </Link>
              ) : null}
              {asset?.downloadUrl ? (
                <Link
                  href={asset.downloadUrl}
                  target="_blank"
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    isMe ? "border-[#d1ddd0] text-[#315447]" : "border-[#d8dfd7] text-[#5f6d65]"
                  }`}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Link>
              ) : null}
            </div>

            {canReadInline ? (
              <div className="mt-4 overflow-hidden rounded-[20px] border border-[#d8e0d6] bg-white">
                <div className="flex items-center gap-2 border-b border-[#e3e9e2] px-3 py-2 text-xs font-semibold text-[#42554c]">
                  <Eye className="h-3.5 w-3.5" />
                  Inline preview
                </div>
                <iframe
                  title={assetLabel}
                  src={accessUrl}
                  className="h-[320px] w-full bg-white"
                  loading="lazy"
                />
              </div>
            ) : accessUrl ? (
              <div className="mt-4 rounded-[18px] border border-[#d8e0d6] bg-[#f7faf6] px-3 py-3 text-xs leading-5 text-[#63716a]">
                This file is available in chat. Browser preview depends on the file type.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`group flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[86%] flex-col ${isMe ? "items-end" : "items-start"}`}>
        {showSender && !isMe && senderLabel ? (
          <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d8c84]">
            {senderLabel}
          </div>
        ) : null}

        {replyPreview ? (
          <div className={`mb-2 max-w-[360px] rounded-[18px] border px-3 py-2 text-xs ${replyTone}`}>
            <span className="font-semibold">Replying to</span>
            <p className="mt-1 line-clamp-2">{highlightText(replyPreview, highlightQuery)}</p>
          </div>
        ) : null}

        {message.type === "ASSET" ? (
          renderAsset()
        ) : (
          <div className={`rounded-[24px] border px-4 py-3 text-sm leading-6 ${containerTone}`}>
            <div className="max-h-[22rem] overflow-y-auto overscroll-contain pr-1">
              <p className={`whitespace-pre-wrap break-words ${message.deletedAt ? "italic opacity-75" : ""}`}>
                {highlightText(message.text || "", highlightQuery)}
              </p>
            </div>
          </div>
        )}

        <div className="mx-1 mt-1.5 flex flex-wrap items-center gap-2 text-[10px] font-medium text-[#7d8c84]">
          <span>{formatMessageTime(message.createdAt)}</span>
          {message.editedAt ? <span>Edited</span> : null}
          {message.forwardedFromMessageId ? <span>Forwarded</span> : null}
        </div>

        {message.reactions && Object.keys(message.reactions).length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(message.reactions).map(([emoji, userIds]) => {
              const reacted = Boolean(currentUserId && userIds.includes(currentUserId));
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReact?.(message, emoji)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                    reacted
                      ? "border-[#d3e3d2] bg-[#edf4ec] text-[#315447]"
                      : "border-white/80 bg-white/90 text-[#5f6d65] hover:border-[#d6dfd5] hover:text-[#27463b]"
                  }`}
                >
                  {emoji} {userIds.length}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
          {onReply ? (
            <ActionButton
              label="Reply"
              onClick={() => onReply(message)}
              icon={<CornerUpLeft className="h-3.5 w-3.5" />}
            />
          ) : null}
          {onForward ? (
            <ActionButton
              label="Forward"
              onClick={() => onForward(message)}
              icon={<Forward className="h-3.5 w-3.5" />}
            />
          ) : null}
          {onPin ? (
            <ActionButton
              label="Pin"
              onClick={() => onPin(message)}
              icon={<Pin className="h-3.5 w-3.5" />}
            />
          ) : null}
          {onReact
            ? QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReact(message, emoji)}
                  className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#5f6d65] transition hover:border-[#d6dfd5] hover:text-[#27463b]"
                >
                  <SmilePlus className="h-3.5 w-3.5" />
                  <span>{emoji}</span>
                </button>
              ))
            : null}
          {canEdit && onEdit ? (
            <ActionButton
              label="Edit"
              onClick={() => onEdit(message)}
              icon={<Pencil className="h-3.5 w-3.5" />}
            />
          ) : null}
          {canDelete && onDelete ? (
            <ActionButton
              label="Delete"
              onClick={() => onDelete(message)}
              icon={<Trash2 className="h-3.5 w-3.5" />}
              tone="danger"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
