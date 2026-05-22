"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Archive, ArrowLeft, BellOff, BellRing, Info, Pin, Radio, Search } from "lucide-react";
import type { Asset, ChatMessage } from "@/lib/api";
import {
  buildTypingLabel,
  formatAssetLabel,
  formatDayLabel,
  isSameCalendarDay,
} from "./chat-helpers";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { ChatSearchInput, chatUi } from "./chat-ui";

interface ChatConversationProps {
  conversationId: string;
  title: string;
  subtitle: string;
  headerMeta?: string;
  typingUsers?: string[];
  currentUserId: string | null;
  messages: ChatMessage[];
  assetsById?: Record<string, Asset | null>;
  isLoading?: boolean;
  inputDisabled?: boolean;
  readOnlyNote?: string | null;
  pinnedMessageId?: string | null;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  liveCount?: number;
  unreadCountAtOpen?: number;
  threadType?: "DIRECT" | "GROUP" | "CHANNEL";
  participantIds?: string[];
  onSend: (content: string, options?: { replyToMessageId?: string | null }) => void;
  onSendAsset?: (assetId: string) => void;
  onEditMessage?: (messageId: string, text: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onForwardMessage?: (messageId: string) => void;
  onPinMessage?: (messageId: string) => void;
  onReactMessage?: (messageId: string, emoji: string) => void;
  onTyping?: () => void;
  getDisplayName?: (userId?: string | null) => string;
  onBack?: () => void;
  onOpenDetails?: () => void;
  onTogglePinned?: () => void;
  onToggleMuted?: () => void;
  onToggleArchived?: () => void;
  onMissedCall?: (conversationId: string) => void;
}

const conversationCanvasStyle = {
  backgroundColor: "#e6efe6",
  backgroundImage: [
    "radial-gradient(circle at 18% 18%, rgba(255,255,255,0.55) 0, rgba(255,255,255,0) 24%)",
    "radial-gradient(circle at 82% 12%, rgba(241,224,198,0.38) 0, rgba(241,224,198,0) 20%)",
    "radial-gradient(circle at 12% 86%, rgba(202,221,205,0.42) 0, rgba(202,221,205,0) 24%)",
    "linear-gradient(180deg, rgba(250,247,239,0.38), rgba(224,235,225,0.82))",
  ].join(", "),
};

function messageMatchesQuery(
  message: ChatMessage,
  assetsById: Record<string, Asset | null>,
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const asset = message.assetId ? assetsById[message.assetId] : null;
  const haystack = [
    message.text,
    message.type,
    formatAssetLabel(asset, message.assetId),
    asset?.mimeType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function MessageSkeleton({ align = "left" }: { align?: "left" | "right" }) {
  return (
    <div className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}>
      <div
        className={`h-24 w-full max-w-[320px] rounded-[28px] border border-white/70 ${
          align === "right" ? "bg-[#eef5e8]" : "bg-white/85"
        } shadow-[0_18px_30px_rgba(38,67,56,0.05)]`}
      />
    </div>
  );
}

function HeaderActionButton({
  label,
  onClick,
  icon,
  active = false,
}: {
  label: string;
  onClick?: () => void;
  icon: ReactNode;
  active?: boolean;
}) {
  if (!onClick) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
        active
          ? "border-[#cfe0d0] bg-[#ecf4ec] text-[#315447]"
          : "border-[#d8e0d6] bg-white text-[#5f6d65] hover:bg-[#f6f8f3] hover:text-[#315447]"
      }`}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

export function ChatConversation({
  conversationId,
  title,
  subtitle,
  headerMeta,
  typingUsers = [],
  currentUserId,
  messages,
  assetsById = {},
  isLoading = false,
  inputDisabled = false,
  readOnlyNote = null,
  pinnedMessageId = null,
  isPinned = false,
  isMuted = false,
  isArchived = false,
  liveCount = 0,
  unreadCountAtOpen = 0,
  threadType = "DIRECT",
  participantIds = [],
  onSend,
  onSendAsset,
  onEditMessage,
  onDeleteMessage,
  onForwardMessage,
  onPinMessage,
  onReactMessage,
  onTyping,
  getDisplayName,
  onBack,
  onOpenDetails,
  onTogglePinned,
  onToggleMuted,
  onToggleArchived,
  onMissedCall,
}: ChatConversationProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [draftText, setDraftText] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const hasSearchQuery = deferredSearchQuery.trim().length > 0;

  useEffect(() => {
    if (hasSearchQuery) {
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [hasSearchQuery, messages, typingUsers]);

  const pinnedMessage = useMemo(
    () => (pinnedMessageId ? messages.find((message) => message.id === pinnedMessageId) : null),
    [messages, pinnedMessageId],
  );
  const replyTarget = useMemo(
    () => (replyToId ? messages.find((message) => message.id === replyToId) : null),
    [messages, replyToId],
  );
  const visibleMessages = useMemo(
    () =>
      messages.filter((message) =>
        messageMatchesQuery(message, assetsById, deferredSearchQuery),
      ),
    [assetsById, deferredSearchQuery, messages],
  );

  const typingLabel = buildTypingLabel(typingUsers);
  const contextLabel = editingMessageId
    ? "Editing message"
    : replyTarget
      ? `Replying to: ${replyTarget.text || "attachment"}`
      : null;
  const secondaryStatus = typingLabel || headerMeta || subtitle;
  void unreadCountAtOpen;
  void threadType;
  void participantIds;
  void onMissedCall;

  const handleSend = (content: string) => {
    if (editingMessageId && onEditMessage) {
      onEditMessage(editingMessageId, content);
      setEditingMessageId(null);
      setReplyToId(null);
      setDraftText("");
      return;
    }

    onSend(content, { replyToMessageId: replyToId });
    setReplyToId(null);
    setDraftText("");
  };

  return (
    <div
      data-thread-id={conversationId}
      className="flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,rgba(250,247,239,0.72),rgba(231,239,231,0.9))]"
    >
      <div className="border-b border-[#d8e0d6] bg-[rgba(250,247,239,0.88)] px-4 py-4 backdrop-blur-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-[#d8e0d6] bg-white text-[#5f6d65] transition hover:bg-[#f6f8f3] hover:text-[#315447] lg:hidden"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="h-4.5 w-4.5" />
              </button>
            ) : null}

            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#8eb6a0,#6f95d2)] text-base font-semibold text-white shadow-[0_18px_32px_rgba(84,111,151,0.18)]">
              {title.charAt(0).toUpperCase() || "C"}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-[family:var(--font-display)] text-xl font-semibold text-[#20332d]">
                  {title}
                </h2>
                <span className="rounded-full border border-[#d8e0d6] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6b7b73]">
                  {subtitle}
                </span>
                {isPinned ? (
                  <span className="rounded-full bg-[#edf4ec] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#315447]">
                    Pinned
                  </span>
                ) : null}
                {isMuted ? (
                  <span className="rounded-full bg-[#f4efe5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#86684a]">
                    Muted
                  </span>
                ) : null}
                {isArchived ? (
                  <span className="rounded-full bg-[#eef1f5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#617182]">
                    Archived
                  </span>
                ) : null}
                {liveCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cce7d5] bg-[#effaf2] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#287047]">
                    <span className="h-2 w-2 rounded-full bg-[#2fbe62] shadow-[0_0_0_3px_rgba(47,190,98,0.16)]" />
                    Live {liveCount}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#5f6d65]">
                {liveCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-[#315447]">
                    <Radio className="h-4 w-4" />
                    Live view active
                  </span>
                ) : null}
                <span>{secondaryStatus}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <HeaderActionButton
              label={searchOpen ? "Hide in-thread search" : "Search this conversation"}
              onClick={() => {
                setSearchOpen((current) => {
                  const next = !current;
                  if (!next) {
                    setSearchQuery("");
                  }
                  return next;
                });
              }}
              icon={<Search className="h-4.5 w-4.5" />}
              active={searchOpen}
            />
            <HeaderActionButton
              label={isPinned ? "Unpin conversation" : "Pin conversation"}
              onClick={onTogglePinned}
              icon={<Pin className="h-4.5 w-4.5" />}
              active={isPinned}
            />
            <HeaderActionButton
              label={isMuted ? "Unmute conversation" : "Mute conversation"}
              onClick={onToggleMuted}
              icon={isMuted ? <BellRing className="h-4.5 w-4.5" /> : <BellOff className="h-4.5 w-4.5" />}
              active={isMuted}
            />
            <HeaderActionButton
              label={isArchived ? "Restore conversation" : "Archive conversation"}
              onClick={onToggleArchived}
              icon={<Archive className="h-4.5 w-4.5" />}
              active={isArchived}
            />
            <HeaderActionButton
              label="Open conversation details"
              onClick={onOpenDetails}
              icon={<Info className="h-4.5 w-4.5" />}
            />
          </div>
        </div>

        {searchOpen ? (
          <ChatSearchInput className="mt-4 rounded-[22px] px-4 py-3">
            <Search className="h-4.5 w-4.5 text-[#7d8c84]" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search messages and attachments in this conversation"
              className={chatUi.input}
            />
            {hasSearchQuery ? (
              <span className={chatUi.subtlePill}>
                {visibleMessages.length} match{visibleMessages.length === 1 ? "" : "es"}
              </span>
            ) : null}
          </ChatSearchInput>
        ) : null}

        {readOnlyNote ? (
          <div className="mt-4 rounded-[22px] border border-[#f0d5ae] bg-[#fbf2df] px-4 py-3 text-sm font-medium text-[#7a5d35]">
            {readOnlyNote}
          </div>
        ) : null}

        {pinnedMessage ? (
          <div className="mt-4 flex items-start gap-3 rounded-[24px] border border-[#d8e7d8] bg-[#edf4ec] px-4 py-3 text-sm text-[#27463b]">
            <div className="mt-0.5 rounded-2xl bg-white p-2 text-[#315447] shadow-[0_12px_24px_rgba(38,67,56,0.06)]">
              <Pin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6c7d74]">Pinned message</p>
              <p className="mt-2 line-clamp-2">
                {pinnedMessage.type === "ASSET" ? "Pinned attachment" : pinnedMessage.text || "Pinned message"}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 lg:px-8" style={conversationCanvasStyle}>
        {isLoading && messages.length === 0 ? (
          <div className="mx-auto max-w-4xl space-y-4">
            <MessageSkeleton />
            <MessageSkeleton align="right" />
            <MessageSkeleton />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-[24px] border border-white/70 bg-white/80 text-[#5f6d65] shadow-[0_24px_40px_rgba(38,67,56,0.06)]">
              <Info className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#20332d]">No messages yet</h3>
            <p className="mt-2 max-w-[340px] text-sm text-[#5f6d65]">
              Start the conversation with a message, file, image, video, or voice note.
            </p>
          </div>
        ) : hasSearchQuery && visibleMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-[24px] border border-white/70 bg-white/80 text-[#5f6d65] shadow-[0_24px_40px_rgba(38,67,56,0.06)]">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#20332d]">No search matches</h3>
            <p className="mt-2 max-w-[340px] text-sm text-[#5f6d65]">
              Try another keyword. Search looks through message text and shared attachment names.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-5">
            {hasSearchQuery ? (
              <div className="flex justify-center">
                <span className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold text-[#5f6d65] shadow-[0_14px_24px_rgba(38,67,56,0.05)]">
                  Showing {visibleMessages.length} result{visibleMessages.length === 1 ? "" : "s"} from {messages.length} messages
                </span>
              </div>
            ) : null}

            {visibleMessages.map((message, index) => {
              const previous = index > 0 ? visibleMessages[index - 1] : null;
              const showDate = !previous || !isSameCalendarDay(previous.createdAt, message.createdAt);
              const previousTime = previous?.createdAt ? Date.parse(previous.createdAt) : 0;
              const currentTime = message.createdAt ? Date.parse(message.createdAt) : 0;
              const showSender =
                !previous
                || previous.senderId !== message.senderId
                || Math.abs(currentTime - previousTime) > 5 * 60_000;

              return (
                <div key={message.id} className="space-y-3">
                  {showDate ? (
                    <div className="flex justify-center">
                      <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c7d74] shadow-[0_12px_24px_rgba(38,67,56,0.05)]">
                        {formatDayLabel(message.createdAt)}
                      </span>
                    </div>
                  ) : null}

                  <MessageBubble
                    message={message}
                    asset={message.assetId ? assetsById[message.assetId] : null}
                    isMe={Boolean(currentUserId && message.senderId === currentUserId)}
                    currentUserId={currentUserId}
                    senderLabel={getDisplayName?.(message.senderId)}
                    showSender={showSender}
                    replyPreview={
                      message.replyToMessageId
                        ? messages.find((item) => item.id === message.replyToMessageId)?.text || "Reply"
                        : null
                    }
                    highlightQuery={hasSearchQuery ? deferredSearchQuery : null}
                    onReply={(target) => {
                      setReplyToId(target.id);
                      setEditingMessageId(null);
                    }}
                    onEdit={
                      onEditMessage
                        ? (target) => {
                            setEditingMessageId(target.id);
                            setReplyToId(null);
                            setDraftText(target.text || "");
                          }
                        : undefined
                    }
                    onDelete={onDeleteMessage ? (target) => onDeleteMessage(target.id) : undefined}
                    onForward={onForwardMessage ? (target) => onForwardMessage(target.id) : undefined}
                    onPin={onPinMessage ? (target) => onPinMessage(target.id) : undefined}
                    onReact={onReactMessage ? (target, emoji) => onReactMessage(target.id, emoji) : undefined}
                  />
                </div>
              );
            })}

            {typingUsers.length > 0 && !hasSearchQuery ? (
              <div className="flex justify-start">
                <TypingIndicator label={typingLabel || "Typing…"} />
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-[#d8e0d6] bg-[rgba(250,247,239,0.9)] backdrop-blur-sm">
        <MessageInput
          onSend={handleSend}
          onSendAsset={onSendAsset}
          onTyping={onTyping}
          disabled={inputDisabled}
          draftText={draftText}
          onDraftChange={setDraftText}
          contextLabel={contextLabel}
          onClearContext={() => {
            setReplyToId(null);
            setEditingMessageId(null);
            setDraftText("");
          }}
        />
      </div>
    </div>
  );
}
