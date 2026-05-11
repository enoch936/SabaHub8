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
  maxItems?: number;
  missedCallCounts?: Record<string, number>;
}

function ConversationSkeleton() {
  return (
    <ChatSectionCard className="rounded-2xl border-slate-200 bg-white">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-slate-200" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-1/2 rounded-full bg-slate-200" />
          <div className="h-3 w-2/3 rounded-full bg-slate-100" />
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
  maxItems = 10,
  missedCallCounts = {},
}: ConversationListProps) {
  const visibleConversations = conversations.slice(0, maxItems);

  if (isLoading && conversations.length === 0) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <ConversationSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (visibleConversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm">
          <Hash className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-slate-900">No conversations yet</h3>
        <p className="mt-2 max-w-[240px] text-sm text-slate-500">
          Start a direct chat or create a new group or channel to see it appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto overscroll-contain scroll-smooth px-2 py-2">
      <div className="space-y-2">
        {visibleConversations.map((conversation, index) => {
          const isActive = conversation.id === activeId;
          const unreadCount = Math.max(0, Number(conversation.unreadCount ?? 0));
          const title = resolveTitle(conversation);
          const subtitle = resolveSubtitle(conversation);
          const liveCount = Math.max(0, Number(resolveLiveCount?.(conversation) ?? 0));
          const missedCallCount = Math.max(0, Number(missedCallCounts[conversation.id] ?? 0));
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
            <div key={conversation.id}>
              <button
                type="button"
                onClick={() => onSelect(conversation.id)}
                className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                  isActive
                    ? "border-slate-300 bg-white shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <div
                    className={`flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-gradient-to-br ${avatarTone} text-sm font-bold text-white shadow-sm`}
                  >
                    {getConversationInitial(title)}
                  </div>
                  {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                          {typeLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {conversation.threadType === "DIRECT"
                          ? subtitle
                          : `${participantCount || conversation.participantIds?.length || 0} members`}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-[11px] font-medium text-slate-400">
                      {formatConversationTime(conversation.lastMessageAt)}
                    </span>
                  </div>

                  <p className={`mt-2 line-clamp-2 text-sm leading-5 ${unreadCount > 0 ? "font-medium text-slate-800" : "text-slate-500"}`}>
                    {preview}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
                    {conversation.threadType === "GROUP" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                        <Users className="h-3.5 w-3.5" />
                        Group
                      </span>
                    ) : null}
                    {conversation.pinned ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                        <Pin className="h-3.5 w-3.5" />
                        Pinned
                      </span>
                    ) : null}
                    {conversation.muted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                        <BellOff className="h-3.5 w-3.5" />
                        Muted
                      </span>
                    ) : null}
                    {conversation.archived ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                        <Archive className="h-3.5 w-3.5" />
                        Archived
                      </span>
                    ) : null}
                    {liveCount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                        <Radio className="h-3.5 w-3.5" />
                        Live {liveCount}
                      </span>
                    ) : null}
                    {missedCallCount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">
                        Missed call {missedCallCount > 9 ? "9+" : missedCallCount}
                      </span>
                    ) : null}
                  </div>
                </div>
                </div>
              </button>
              {index < visibleConversations.length - 1 ? <div className="mx-2 mt-2 h-px bg-slate-200" /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
