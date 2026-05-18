"use client";

import { Archive, BellOff, Hash, Pin, Radio, Users } from "lucide-react";
import type { ChatThread } from "@/lib/api";
import {
  formatConversationTime,
  getConversationInitial,
  getThreadBadgeLabel,
} from "./chat-helpers";
import { ChatSectionCard } from "./chat-ui";

interface ConversationListProps {
  conversations: ChatThread[];
  activeId: string | null;
  onSelect: (id: string) => void;
  resolveTitle: (conversation: ChatThread) => string;
  resolveSubtitle: (conversation: ChatThread) => string;
  resolveLiveCount?: (conversation: ChatThread) => number;
  isLoading?: boolean;
}

function ConversationSkeleton() {
  return (
    <ChatSectionCard className="rounded-[26px] border-white/70 bg-white/70">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-[20px] bg-[#e6ece5]" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-1/2 rounded-full bg-[#e6ece5]" />
          <div className="h-3 w-2/3 rounded-full bg-[#eef2ee]" />
        </div>
      </div>
    </ChatSectionCard>
  );
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  resolveTitle,
  resolveSubtitle,
  resolveLiveCount,
  isLoading = false,
}: ConversationListProps) {
  if (isLoading && conversations.length === 0) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <ConversationSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-[24px] border border-white/70 bg-white/80 text-[#708078] shadow-[0_20px_36px_rgba(38,67,56,0.06)]">
          <Hash className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-[#20332d]">No conversations yet</h3>
        <p className="mt-2 max-w-[240px] text-sm text-[#63716a]">
          Start a direct chat or create a new group or channel to see it appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-3 py-3">
      <div className="space-y-2.5">
        {conversations.map((conversation) => {
          const isActive = conversation.id === activeId;
          const unreadCount = Math.max(0, Number(conversation.unreadCount ?? 0));
          const title = resolveTitle(conversation);
          const subtitle = resolveSubtitle(conversation);
          const liveCount = Math.max(0, Number(resolveLiveCount?.(conversation) ?? 0));
          const typeLabel = getThreadBadgeLabel(conversation.threadType);
          const participantCount = Math.max(
            0,
            (conversation.participantIds?.length ?? 0)
            - ((conversation.threadType ?? "DIRECT") === "DIRECT" ? 1 : 0),
          );
          const preview =
            conversation.lastMessage
            || (conversation.threadType === "CHANNEL" ? conversation.channelDescription : subtitle)
            || "Open conversation";
          const avatarTone =
            conversation.threadType === "CHANNEL"
              ? "from-[#86b4c2] to-[#6589bd]"
              : conversation.threadType === "GROUP"
                ? "from-[#8ab59a] to-[#5f9279]"
                : "from-[#d9b17d] to-[#b18365]";

          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={`w-full rounded-[28px] border px-4 py-4 text-left transition ${
                isActive
                  ? "border-[#d5e4d6] bg-[linear-gradient(135deg,#ffffff,#eef4ee)] shadow-[0_22px_36px_rgba(38,67,56,0.08)]"
                  : "border-transparent bg-white/65 hover:border-white/70 hover:bg-white/90 hover:shadow-[0_20px_32px_rgba(38,67,56,0.05)]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <div
                    className={`flex h-[52px] w-[52px] items-center justify-center rounded-[22px] bg-gradient-to-br ${avatarTone} text-sm font-bold text-white shadow-[0_18px_30px_rgba(51,73,63,0.14)]`}
                  >
                    {getConversationInitial(title)}
                  </div>
                  {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#27463b] px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-[#1f312a]">{title}</p>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b7b73] shadow-[0_6px_14px_rgba(38,67,56,0.04)]">
                          {typeLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#7c8a83]">
                        {conversation.threadType === "DIRECT"
                          ? subtitle
                          : `${participantCount || conversation.participantIds?.length || 0} members`}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-[11px] font-medium text-[#92a097]">
                      {formatConversationTime(conversation.lastMessageAt)}
                    </span>
                  </div>

                  <p className={`mt-2 line-clamp-2 text-sm leading-5 ${unreadCount > 0 ? "font-medium text-[#2c4037]" : "text-[#6b7b73]"}`}>
                    {preview}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#8e9a93]">
                    {conversation.threadType === "GROUP" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                        <Users className="h-3.5 w-3.5" />
                        Group
                      </span>
                    ) : null}
                    {conversation.pinned ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#edf4ec] px-2.5 py-1 text-[#315447]">
                        <Pin className="h-3.5 w-3.5" />
                        Pinned
                      </span>
                    ) : null}
                    {conversation.muted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f5efe5] px-2.5 py-1 text-[#86684a]">
                        <BellOff className="h-3.5 w-3.5" />
                        Muted
                      </span>
                    ) : null}
                    {conversation.archived ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#eef1f5] px-2.5 py-1 text-[#5f7384]">
                        <Archive className="h-3.5 w-3.5" />
                        Archived
                      </span>
                    ) : null}
                    {liveCount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#effaf2] px-2.5 py-1 text-[#287047]">
                        <Radio className="h-3.5 w-3.5" />
                        Live {liveCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
