"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Phone, Video, Archive, ArrowLeft, BellOff, BellRing, Info, Pin, Radio, Search, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
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
import { VideoCallModal } from "@/components/call/VideoCallModal";
import { AudioCallOverlay } from "@/components/call/AudioCallOverlay";
import useCallStore from "@/lib/callStore";

interface ChatConversationProps {
  conversationId: string;
  title: string;
  subtitle: string;
  headerMeta?: string;
  typingUsers?: string[];
  currentUserId: string | null;
  messages: ChatMessage[];
  activeConversation?: {
    lastReadAtByUser?: Record<string, string>;
    [key: string]: any;
  } | null;
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
  backgroundColor: "#030712",
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
        className={`h-24 w-full max-w-[320px] rounded-[28px] border border-white/10 ${
          align === "right" ? "bg-indigo-500/10" : "bg-white/5"
        } shadow-xl backdrop-blur-xl animate-pulse`}
      />
    </div>
  );
}

function HeaderActionButton({
  label,
  onClick,
  icon,
  active = false,
  tone = "neutral"
}: {
  label: string;
  onClick?: () => void;
  icon: ReactNode;
  active?: boolean;
  tone?: "neutral" | "primary" | "success" | "error";
}) {
  if (!onClick) {
    return null;
  }

  const toneClasses = {
    neutral: active ? "border-white/20 bg-white text-gray-950" : "border-transparent bg-transparent text-slate-400 hover:bg-white/10 hover:text-white",
    primary: "border-indigo-500/20 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300",
    error: "border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all active:scale-95 ${toneClasses[tone]}`}
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
  activeConversation = null,
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

  const initiateAudioCall = async () => {
    const initiatCall = useCallStore.getState().initiatCall;

    // Get participant ID from thread type
    if (threadType === "DIRECT" && participantIds && participantIds.length > 0) {
      const participantId = participantIds[0];
      const participantName = title;
      try {
        await initiatCall(participantId, participantName, "audio");
        toast.success("Initiating audio call...");
      } catch (error) {
        toast.error("Failed to initiate call");
      }
    } else {
      toast.error("Audio calls only available in direct messages");
    }
  };

  const initiateVideoCall = async () => {
    const initiatCall = useCallStore.getState().initiatCall;

    // Get participant ID from thread type
    if (threadType === "DIRECT" && participantIds && participantIds.length > 0) {
      const participantId = participantIds[0];
      const participantName = title;
      try {
        await initiatCall(participantId, participantName, "video");
        toast.success("Initiating video call...");
      } catch (error) {
        toast.error("Failed to initiate call");
      }
    } else {
      toast.error("Video calls only available in direct messages");
    }
  };

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
      className="flex h-full min-h-0 flex-col bg-[#030712]"
    >
      <div className="border-b border-white/10 bg-black/40 px-4 sm:px-6 py-4 backdrop-blur-3xl shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : null}

            <div className="relative">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-black text-white shadow-2xl">
                {title.charAt(0).toUpperCase() || "C"}
              </div>
              {liveCount > 0 && (
                <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-[#030712] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="truncate text-lg font-black tracking-tight text-white uppercase">
                  {title}
                </h2>
                <span className="hidden sm:inline-flex rounded-lg border border-white/5 bg-white/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {subtitle}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {typingLabel ? (
                  <span className="text-cyan-400 flex items-center gap-1.5 animate-pulse">
                    <Radio className="h-3 w-3" />
                    {typingLabel}
                  </span>
                ) : (
                  <span>{headerMeta || "Secure Communication Channel"}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="flex items-center gap-1.5 mr-2 pr-2 border-r border-white/10">
              <HeaderActionButton
                label="Voice Call"
                onClick={initiateAudioCall}
                icon={<Phone className="h-4.5 w-4.5" />}
                tone="primary"
              />
              <HeaderActionButton
                label="Video Call"
                onClick={initiateVideoCall}
                icon={<Video className="h-4.5 w-4.5" />}
                tone="primary"
              />
            </div>

            <HeaderActionButton
              label="Search"
              onClick={() => setSearchOpen(!searchOpen)}
              icon={<Search className="h-4.5 w-4.5" />}
              active={searchOpen}
            />
            <HeaderActionButton
              label="Details"
              onClick={onOpenDetails}
              icon={<Info className="h-4.5 w-4.5" />}
            />
          </div>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <ChatSearchInput className="mt-4 rounded-2xl bg-white/5 border-white/10 px-4 py-3">
                <Search className="h-4.5 w-4.5 text-slate-500" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search messages and attachments..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                />
                {hasSearchQuery ? (
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase">
                    {visibleMessages.length} match{visibleMessages.length === 1 ? "" : "es"}
                  </span>
                ) : null}
              </ChatSearchInput>
            </motion.div>
          )}
        </AnimatePresence>

        {pinnedMessage ? (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 text-sm text-indigo-200 backdrop-blur-xl">
            <div className="mt-0.5 rounded-xl bg-indigo-500/20 p-2 text-indigo-400">
              <Pin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/80">Pinned signal</p>
              <p className="mt-1 line-clamp-1 font-medium text-indigo-100/90">
                {pinnedMessage.type === "ASSET" ? "Satellite attachment" : pinnedMessage.text || "Direct intercept"}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 custom-scrollbar" style={conversationCanvasStyle}>
        <div className="mx-auto max-w-4xl space-y-6">
          {isLoading && messages.length === 0 ? (
            <div className="space-y-4">
              <MessageSkeleton />
              <MessageSkeleton align="right" />
              <MessageSkeleton />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-20 text-center opacity-40">
              <div className="h-20 w-20 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mb-6">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest text-white">No signals detected</h3>
              <p className="mt-2 max-w-[280px] text-xs font-bold uppercase tracking-tighter text-slate-500">
                Initiate first contact via text or asset transmission.
              </p>
            </div>
          ) : (
            <>
              {visibleMessages.map((message, index) => {
                const previous = index > 0 ? visibleMessages[index - 1] : null;
                const showDate = !previous || !isSameCalendarDay(previous.createdAt, message.createdAt);
                const isMe = Boolean(currentUserId && message.senderId === currentUserId);
                
                return (
                  <div key={message.id} className="space-y-4">
                    {showDate ? (
                      <div className="flex justify-center">
                        <span className="rounded-xl border border-white/5 bg-white/5 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 backdrop-blur-xl">
                          {formatDayLabel(message.createdAt)}
                        </span>
                      </div>
                    ) : null}

                    <MessageBubble
                      message={message}
                      asset={message.assetId ? assetsById[message.assetId] : null}
                      isMe={isMe}
                      currentUserId={currentUserId}
                      senderLabel={getDisplayName?.(message.senderId)}
                      showSender={!previous || previous.senderId !== message.senderId}
                      isRead={true}
                      isDelivered={true}
                      onReply={(target) => setReplyToId(target.id)}
                      onDelete={(target) => onDeleteMessage?.(target.id)}
                    />
                  </div>
                );
              })}
              {typingUsers.length > 0 && (
                <TypingIndicator label={typingLabel || "Typing…"} />
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-white/10 bg-black/40 backdrop-blur-3xl px-4 py-4">
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

      {/* Call modals */}
      <VideoCallModal />
      <AudioCallOverlay />
    </div>
  );
}
