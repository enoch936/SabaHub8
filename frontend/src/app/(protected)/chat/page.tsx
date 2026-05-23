"use client";

import Link from "next/link";
import {
  Suspense,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  Archive,
  Bot,
  ChevronRight,
  GripVertical,
  Hash,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  Plus,
  Search,
  Settings2,
  Users,
  X,
  UserPlus,
  ShieldAlert as ShieldRoundedIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ChatConversation } from "@/components/chat/ChatConversation";
import { ConversationDetailsRail } from "@/components/chat/ConversationDetailsRail";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatPrimaryButton, ChatSearchInput, ChatSectionCard, ChatSecondaryButton, chatUi } from "@/components/chat/chat-ui";
import { getThreadBadgeLabel, formatRelativeActivity } from "@/components/chat/chat-helpers";
import { useMessageAssets } from "@/components/chat/useMessageAssets";
import {
  getUserById,
  searchUserByEmail,
  searchUserByUsername,
  searchUsersByName,
  type AppUser,
  type ChatThread,
} from "@/lib/api";
import { useSession } from "@/lib/session";
import { useChatStore } from "@/lib/chatStore";
import { useDebounce } from "@/lib/useDebounce";
import { workspaceRoutes } from "@/lib/workspace-routes";

type ThreadFilter = "ALL" | "DIRECT" | "GROUP" | "CHANNEL";
type MailboxView = "INBOX" | "DIRECTORY" | "PINNED" | "ARCHIVED";

const THREAD_FILTERS: Array<{ key: ThreadFilter; label: string; icon: ReactNode }> = [
  { key: "ALL", label: "All", icon: <MessageSquare className="h-4 w-4" /> },
  { key: "GROUP", label: "Groups", icon: <Users className="h-4 w-4" /> },
  { key: "CHANNEL", label: "Channels", icon: <Hash className="h-4 w-4" /> },
];

const MAILBOX_FILTERS: Array<{ key: MailboxView; label: string }> = [
  { key: "INBOX", label: "Inbox" },
  { key: "DIRECTORY", label: "Directory" },
  { key: "PINNED", label: "Pinned" },
  { key: "ARCHIVED", label: "Archived" },
];

type ResizablePane = "inbox" | "details";

const CHAT_INBOX_WIDTH_KEY = "sabahub:chat-inbox-width";
const CHAT_DETAILS_WIDTH_KEY = "sabahub:chat-details-width";
const INBOX_WIDTH_MIN = 320;
const INBOX_WIDTH_MAX = 520;
const DETAILS_WIDTH_MIN = 320;
const DETAILS_WIDTH_MAX = 500;

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildSparklinePath(values: number[], width: number, height: number) {
  if (values.length === 0) {
    return "";
  }

  const maxValue = Math.max(...values, 1);
  const stepX = values.length > 1 ? width / (values.length - 1) : width;

  return values
    .map((value, index) => {
      const x = index * stepX;
      const normalized = value / maxValue;
      const y = height - normalized * (height - 8) - 4;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function DashboardMetricCard({
  label,
  value,
  detail,
  tone = "cyan",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "cyan" | "violet" | "emerald" | "amber";
}) {
  const glowClass =
    tone === "violet"
      ? "from-violet-500/25 to-fuchsia-500/10"
      : tone === "emerald"
        ? "from-emerald-500/20 to-cyan-500/10"
        : tone === "amber"
          ? "from-amber-500/25 to-orange-500/10"
          : "from-cyan-500/25 to-blue-500/10";

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-2xl"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${glowClass} opacity-70`} />
      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
        <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">{value}</div>
        <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
      </div>
    </motion.div>
  );
}

function AIOperatingSystemDashboard({
  profileName,
  profileEmail,
  totalConversations,
  unreadCount,
  activeLiveCount,
  onlineCount,
  activeConversationTitle,
  activeTyping,
  mailboxView,
  filteredCount,
  conversations,
}: {
  profileName: string;
  profileEmail?: string | null;
  totalConversations: number;
  unreadCount: number;
  activeLiveCount: number;
  onlineCount: number;
  activeConversationTitle: string;
  activeTyping: string[];
  mailboxView: MailboxView;
  filteredCount: number;
  conversations: ChatThread[];
}) {
  const sparkValues = useMemo(() => {
    const baseSeries = conversations.slice(0, 8).map((conversation, index) => {
      const unread = Number(conversation.unreadCount ?? 0);
      const pinnedBoost = conversation.pinned ? 3 : 0;
      const archivedPenalty = conversation.archived ? 0 : 1;
      const liveBoost = conversation.participantIds?.length ? Math.min(4, conversation.participantIds.length) : 0;
      return unread + pinnedBoost + archivedPenalty + liveBoost + (8 - index);
    });

    while (baseSeries.length < 8) {
      baseSeries.push(2 + baseSeries.length);
    }

    return baseSeries;
  }, [conversations]);

  const chartPath = useMemo(() => buildSparklinePath(sparkValues, 240, 86), [sparkValues]);
  const latestPulse = sparkValues[sparkValues.length - 1] ?? 0;
  const responseHealth = Math.min(100, Math.round((activeLiveCount + onlineCount + unreadCount) * 6 + 18));
  const productivity = Math.min(100, Math.round(filteredCount * 8 + totalConversations * 3 + (mailboxView === "PINNED" ? 18 : 0)));
  const systemLoad = Math.min(100, Math.round((activeTyping.length * 18) + (unreadCount * 2) + 12));

  const updates = [
    activeTyping.length > 0
      ? `${activeTyping.join(", ")} typing now`
      : activeConversationTitle
        ? `Tracking ${activeConversationTitle}`
        : "No active typing signals",
    unreadCount > 0 ? `${unreadCount} unread signal${unreadCount === 1 ? "" : "s"} queued` : "Inbox synced in real time",
    mailboxView === "PINNED" ? "Pinned command lane in focus" : `${filteredCount} items visible`,
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,11,23,0.9),rgba(7,12,28,0.78))] p-4 shadow-[0_32px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:p-5 mb-4 shrink-0"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.16),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(139,92,246,0.12),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(34,197,94,0.08),transparent_32%)]" />
      <div className="relative grid gap-4 xl:grid-cols-[1.2fr_1fr_0.95fr]">
        <div className="space-y-4 rounded-[1.8rem] border border-white/10 bg-white/6 p-4 backdrop-blur-xl lg:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">AI chat home</p>
              <h2 className="mt-2 font-[family:var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-white lg:text-[2rem]">
                Command center for {profileName}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-7 text-slate-300/90">
                {profileEmail ? `${profileEmail} · ` : ""}Realtime operations, smart widgets, and live collaboration signals in a single glass shell.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.9)]" />
              Live
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardMetricCard label="Threads" value={String(totalConversations)} detail="Active conversations in orbit" tone="cyan" />
            <DashboardMetricCard label="Unread" value={String(unreadCount)} detail="Signals waiting in the queue" tone="violet" />
            <DashboardMetricCard label="Live peers" value={String(onlineCount)} detail="Contacts currently online" tone="emerald" />
            <DashboardMetricCard label="Focus lane" value={mailboxView} detail={activeConversationTitle || "No thread pinned"} tone="amber" />
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-white/10 bg-white/6 p-4 backdrop-blur-xl lg:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Realtime pulse</p>
              <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">Neon activity chart</h3>
            </div>
            <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              {latestPulse} signal level
            </div>
          </div>

          <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-black/20 p-3">
            <svg viewBox="0 0 240 86" className="h-24 w-full overflow-visible">
              <defs>
                <linearGradient id="chat-os-line" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="48%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
                <linearGradient id="chat-os-fill" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(34,211,238,0.45)" />
                  <stop offset="100%" stopColor="rgba(34,211,238,0)" />
                </linearGradient>
                <filter id="chat-os-glow">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {chartPath ? (
                <>
                  <path d={`${chartPath} L 240 86 L 0 86 Z`} fill="url(#chat-os-fill)" opacity="0.55" />
                  <path d={chartPath} fill="none" stroke="url(#chat-os-line)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#chat-os-glow)" />
                </>
              ) : null}
            </svg>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Response health</p>
              <div className="mt-2 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${responseHealth}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-300">{responseHealth}% AI routing strength</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Productivity</p>
              <div className="mt-2 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500" style={{ width: `${productivity}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-300">{productivity}% workspace momentum</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">System load</p>
              <div className="mt-2 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${systemLoad}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-300">{systemLoad}% realtime monitoring</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-white/10 bg-white/6 p-4 backdrop-blur-xl lg:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Smart widgets</p>
              <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">Live AI monitoring</h3>
            </div>
            <Bot className="h-5 w-5 text-cyan-300" />
          </div>

          <div className="mt-4 space-y-3">
            {updates.map((update, index) => (
              <div key={update} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className={`mt-0.5 h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.9)]" : index === 1 ? "bg-violet-400 shadow-[0_0_18px_rgba(168,85,247,0.8)]" : "bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.8)]"}`} />
                <p className="text-sm leading-6 text-slate-300">{update}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/15 to-blue-500/5 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/80">Depth layer</p>
              <div className="mt-2 text-xl font-semibold text-white">Glass</div>
              <p className="mt-1 text-xs text-slate-300">Multi-layer command center</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/15 to-violet-500/5 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-fuchsia-200/80">Realtime</p>
              <div className="mt-2 text-xl font-semibold text-white">{activeTyping.length ? `${activeTyping.length} typing` : "Synced"}</div>
              <p className="mt-1 text-xs text-slate-300">Interactive monitoring system</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function normalizeLookupValue(value?: string | null) {
  return value?.trim().toLowerCase() || "";
}

function ChatContent() {
  const searchParams = useSearchParams();
  const typingResetRef = useRef<number | null>(null);

  const profileName = useSession((state) => state.fullName || state.username || "Workspace member");
  const profileEmail = useSession((state) => state.email);

  const {
    conversations,
    messages,
    typingUsers,
    currentUserId,
    directory,
    activeConversationId,
    isLoading,
    fetchConversations,
    fetchMessages,
    sendMessage,
    sendAssetMessage,
    announceTyping,
    setActiveConversation,
    ensureDirectThread,
    updateThread,
    addParticipants,
    removeParticipant,
    editMessage,
    deleteMessage,
    forwardMessage,
    pinMessage,
    updatePreferences,
    toggleReaction,
    getConversationTitle,
    getDisplayName,
    refreshDirectory,
  } = useChatStore();

  const activeConversation = useMemo(() => 
    conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
  [conversations, activeConversationId]);

  const [filter, setFilter] = useState<ThreadFilter>("ALL");
  const [mailboxView, setMailboxView] = useState<MailboxView>("INBOX");
  const [inboxQuery, setInboxQuery] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "conversation">("list");
  const [rightRailOpen, setRightRailOpen] = useState(false);
  const [inboxWidth, setInboxWidth] = useState(392);
  const [detailsWidth, setDetailsWidth] = useState(384);
  const [draggingPane, setDraggingPane] = useState<ResizablePane | null>(null);
  
  const [groupName, setGroupName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [memberMessagingEnabled, setMemberMessagingEnabled] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [manageQuery, setManageQuery] = useState("");
  const [manageResults, setManageResults] = useState<AppUser[]>([]);
  const [manageLoading, setManageLoading] = useState(false);

  const deferredInboxQuery = useDeferredValue(inboxQuery);

  useEffect(() => {
    if (activeConversation) {
      setGroupName(activeConversation.groupName || "");
      setChannelDescription(activeConversation.channelDescription || "");
      setMemberMessagingEnabled(activeConversation.memberMessagingEnabled ?? true);
    }
  }, [activeConversation]);

  useEffect(() => {
    void fetchConversations();
    void refreshDirectory();
  }, [fetchConversations, refreshDirectory]);

  useEffect(() => {
    if (activeConversationId && !messages[activeConversationId]) {
      void fetchMessages(activeConversationId);
    }
  }, [activeConversationId, messages, fetchMessages]);

  useEffect(() => {
    const threadId = searchParams.get("thread");
    if (threadId) {
      setActiveConversation(threadId);
      setMobileView("conversation");
      return;
    }

    const userId = searchParams.get("user") || searchParams.get("employer");
    if (!userId) {
      return;
    }

    void ensureDirectThread(userId).then((thread) => {
      setActiveConversation(thread.id);
      setMobileView("conversation");
    });
  }, [conversations, ensureDirectThread, searchParams, setActiveConversation]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      if (mailboxView === "INBOX" && conversation.archived) return false;
      if (mailboxView === "PINNED" && (!conversation.pinned || conversation.archived)) return false;
      if (mailboxView === "ARCHIVED" && !conversation.archived) return false;
      if (filter !== "ALL" && (conversation.threadType ?? "DIRECT") !== filter) return false;

      if (!deferredInboxQuery.trim()) return true;

      const query = deferredInboxQuery.trim().toLowerCase();
      const haystack = [
        conversation.id,
        getConversationTitle(conversation),
        conversation.lastMessage,
        conversation.groupName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [conversations, deferredInboxQuery, filter, getConversationTitle, mailboxView]);

  const directoryUsers = useMemo(() => {
    const all = Object.values(directory);
    if (!deferredInboxQuery.trim()) return all;
    const q = deferredInboxQuery.trim().toLowerCase();
    return all.filter(u => 
      u.label.toLowerCase().includes(q) || 
      u.username?.toLowerCase().includes(q) || 
      u.email?.toLowerCase().includes(q)
    );
  }, [directory, deferredInboxQuery]);

  const activeMessages = activeConversationId ? messages[activeConversationId] ?? [] : [];
  const { assetsById } = useMessageAssets(activeMessages);

  const activeTyping = activeConversationId
    ? Array.from(typingUsers[activeConversationId] ?? []).map((userId) => getDisplayName(userId))
    : [];

  const activeParticipantIds = activeConversation?.participantIds ?? [];
  const memberDirectory = activeParticipantIds
    .filter((participantId) => participantId !== currentUserId)
    .map((participantId) => ({
      id: participantId,
      label: getDisplayName(participantId),
      online: Boolean(directory[participantId]?.online),
    }));

  const getConversationLiveCount = (conversation: ChatThread) => {
    const liveIds = new Set<string>();
    (conversation.participantIds ?? []).forEach((participantId) => {
      if (participantId === currentUserId || directory[participantId]?.online) {
        liveIds.add(participantId);
      }
    });
    return liveIds.size;
  };

  const activeLiveCount = activeConversation ? getConversationLiveCount(activeConversation) : 0;
  const activeConversationTitle = getConversationTitle(activeConversation ?? undefined);
  const activeConversationBadge = getThreadBadgeLabel(activeConversation?.threadType);
  const activeMemberSummary = useMemo(() => {
    if (!activeConversation) return "Choose a conversation";
    return `${activeParticipantIds.length} members involved`;
  }, [activeConversation, activeParticipantIds.length]);

  const totalConversations = conversations.length;
  const unreadCount = conversations.reduce((sum, conversation) => sum + Number(conversation.unreadCount ?? 0), 0);
  const onlineCountValue = Object.values(directory).filter((user) => user.online).length;

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversation(conversationId);
    setMobileView("conversation");
  };

  const handleStartDirect = async (userId: string) => {
    try {
      const thread = await ensureDirectThread(userId);
      setActiveConversation(thread.id);
      setMobileView("conversation");
      setMailboxView("INBOX");
    } catch (error) {
      toast.error("Failed to start direct message.");
    }
  };

  const handleSend = (content: string, options?: { replyToMessageId?: string | null }) => {
    if (!activeConversationId) return;
    void sendMessage(activeConversationId, content, "TEXT", options);
  };

  const handleTyping = () => {
    if (!activeConversationId) return;
    void announceTyping(activeConversationId, true);
    if (typingResetRef.current) window.clearTimeout(typingResetRef.current);
    typingResetRef.current = window.setTimeout(() => {
      void announceTyping(activeConversationId, false);
      typingResetRef.current = null;
    }, 1600);
  };

  const handleSaveSettings = async () => {
    if (!activeConversationId) return;
    setSavingSettings(true);
    try {
      await updateThread(activeConversationId, {
        groupName,
        channelDescription,
        memberMessagingEnabled
      });
      toast.success("Settings updated");
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRunManageLookup = async () => {
    if (!manageQuery.trim()) return;
    setManageLoading(true);
    try {
      const results = Object.values(directory).filter(u => 
        u.label.toLowerCase().includes(manageQuery.toLowerCase()) ||
        u.username?.toLowerCase().includes(manageQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(manageQuery.toLowerCase())
      ).map(u => ({ id: u.id, fullName: u.label, username: u.username, email: u.email } as AppUser));
      
      setManageResults(results);
    } catch (error) {
      toast.error("Search failed");
      setManageResults([]);
    } finally {
      setManageLoading(false);
    }
  };

  const handleAddParticipant = async (userId: string) => {
    if (!activeConversationId) return;
    try {
      await addParticipants(activeConversationId, [userId]);
      toast.success("Member added");
      setManageQuery("");
      setManageResults([]);
    } catch (error) {
      toast.error("Failed to add member");
    }
  };

  const startPaneResize = (pane: ResizablePane) => (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = pane === "inbox" ? inboxWidth : detailsWidth;
    
    const handlePointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startX;
      if (pane === "inbox") {
        setInboxWidth(clampNumber(startWidth + delta, INBOX_WIDTH_MIN, INBOX_WIDTH_MAX));
      } else {
        setDetailsWidth(clampNumber(startWidth - delta, DETAILS_WIDTH_MIN, DETAILS_WIDTH_MAX));
      }
    };

    const stopResize = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);
  };

  return (
    <div className="relative h-[calc(100dvh-6rem)] overflow-y-auto custom-scrollbar bg-[#030712] text-slate-100">
      <div className="relative z-10 flex flex-col gap-4 p-3 lg:p-6">
        
        <AIOperatingSystemDashboard
          profileName={profileName}
          profileEmail={profileEmail}
          totalConversations={totalConversations}
          unreadCount={unreadCount}
          activeLiveCount={activeLiveCount}
          onlineCount={onlineCountValue}
          activeConversationTitle={activeConversationTitle}
          activeTyping={activeTyping}
          mailboxView={mailboxView}
          filteredCount={mailboxView === "DIRECTORY" ? directoryUsers.length : filteredConversations.length}
          conversations={conversations}
        />

        <div className="relative flex h-[calc(100dvh-12rem)] min-h-[600px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-3xl shadow-2xl">
          
          <section
            style={{ width: `${inboxWidth}px` }}
            className={`${mobileView === "conversation" ? "hidden lg:flex" : "flex"} flex-col min-h-0 border-r border-white/10 bg-[rgba(8,12,24,0.72)] shrink-0 transition-all duration-300 h-full`}
          >
            <div className="p-6 border-b border-white/10 bg-black/20 shrink-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Inbox</h2>
                <button 
                  onClick={() => setMailboxView("DIRECTORY")}
                  className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all active:scale-95 shadow-lg border border-indigo-500/20"
                >
                  <UserPlus className="h-5 w-5" />
                </button>
              </div>
              
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input 
                  value={inboxQuery}
                  onChange={e => setInboxQuery(e.target.value)}
                  placeholder="Search intelligence..."
                  className="w-full h-12 rounded-2xl bg-black/30 border border-white/10 pl-12 pr-4 text-sm outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {MAILBOX_FILTERS.map(m => (
                  <button 
                    key={m.key}
                    onClick={() => setMailboxView(m.key)}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all border ${
                      mailboxView === m.key ? "bg-white text-gray-950 border-white shadow-xl" : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {mailboxView === "DIRECTORY" ? (
                <div className="p-4 space-y-2">
                  {directoryUsers.length > 0 ? directoryUsers.map(user => (
                    <button 
                      key={user.id}
                      onClick={() => handleStartDirect(user.id)}
                      className="w-full p-4 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-all text-left group border border-transparent hover:border-white/5 shadow-sm"
                    >
                      <div className="relative">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-black text-lg text-white shadow-2xl">
                          {user.label.slice(0, 1)}
                        </div>
                        {user.online && <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-3 border-[#080c18] shadow-[0_0_15px_rgba(16,185,129,0.5)]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-white truncate mb-0.5">{user.label}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">
                          {user.username || user.email || 'Workspace User'}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-700 group-hover:text-cyan-400 transition-colors" />
                    </button>
                  )) : (
                    <div className="py-24 text-center px-6">
                      <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                        <Users className="h-8 w-8 text-slate-700" />
                      </div>
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No matching users</p>
                    </div>
                  )}
                </div>
              ) : (
                <ConversationList
                  conversations={filteredConversations}
                  activeId={activeConversationId}
                  onSelect={handleSelectConversation}
                  resolveTitle={getConversationTitle}
                  resolveSubtitle={(conversation) => getThreadBadgeLabel(conversation.threadType)}
                  resolveLiveCount={getConversationLiveCount}
                  isLoading={isLoading}
                />
              )}
            </div>
          </section>

          <div 
            onPointerDown={startPaneResize("inbox")}
            className="w-1 cursor-col-resize hover:bg-cyan-500/30 transition-all shrink-0 active:bg-cyan-500/50 bg-white/5" 
          />

          <section className="flex-1 min-w-0 bg-[rgba(6,10,20,0.72)] flex flex-col h-full relative">
            {activeConversationId ? (
              <ChatConversation
                conversationId={activeConversationId}
                title={activeConversationTitle}
                subtitle={activeConversationBadge}
                headerMeta={activeMemberSummary}
                typingUsers={activeTyping}
                currentUserId={currentUserId}
                messages={activeMessages}
                activeConversation={activeConversation}
                assetsById={assetsById}
                isLoading={isLoading && activeMessages.length === 0}
                onSend={handleSend}
                onSendAsset={(assetId) => sendAssetMessage(activeConversationId, assetId)}
                onEditMessage={(mid, text) => editMessage(activeConversationId, mid, text)}
                onDeleteMessage={(mid) => deleteMessage(activeConversationId, mid, true)}
                onForwardMessage={(mid) => forwardMessage(activeConversationId, mid)}
                onPinMessage={(mid) => pinMessage(activeConversationId, mid)}
                onReactMessage={(mid, emoji) => toggleReaction(activeConversationId, mid, emoji)}
                onTyping={handleTyping}
                getDisplayName={getDisplayName}
                liveCount={activeLiveCount}
                onBack={() => setMobileView("list")}
                onOpenDetails={() => setRightRailOpen(true)}
                threadType={activeConversation?.threadType ?? "DIRECT"}
                participantIds={activeConversation?.participantIds ?? []}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-16 text-center">
                <div className="h-32 w-32 rounded-[40px] bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 mb-10 shadow-[0_0_50px_rgba(34,211,238,0.1)] relative">
                  <div className="absolute inset-0 bg-cyan-400/20 blur-3xl rounded-full" />
                  <MessageSquare className="h-14 w-14 relative z-10" />
                </div>
                <h3 className="text-4xl font-black tracking-tight text-white mb-6 uppercase">Control Center</h3>
                <p className="max-w-md text-slate-400 leading-relaxed font-bold text-sm uppercase tracking-widest opacity-60">
                  Secure connection established. Select a terminal or browse directory to initiate communication.
                </p>
                <button 
                  onClick={() => setMailboxView("DIRECTORY")}
                  className="mt-12 px-10 py-4 rounded-2xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-500 hover:shadow-indigo-500/20 transition-all active:scale-95 border border-indigo-400/30"
                >
                  Browse Workspace Directory
                </button>
              </div>
            )}
          </section>

          {rightRailOpen && activeConversation && (
            <>
              <div 
                onPointerDown={startPaneResize("details")}
                className="w-1 cursor-col-resize hover:bg-cyan-500/30 transition-all shrink-0 active:bg-cyan-500/50 bg-white/5" 
              />
              <aside style={{ width: `${detailsWidth}px` }} className="shrink-0 bg-[rgba(8,12,24,0.92)] overflow-y-auto custom-scrollbar border-l border-white/10 shadow-2xl h-full">
                <div className="p-8 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0">
                  <h4 className="font-black uppercase tracking-[0.2em] text-xs text-slate-300">Intel Briefing</h4>
                  <button onClick={() => setRightRailOpen(false)} className="p-2.5 rounded-xl hover:bg-white/10 text-slate-500 transition-all">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <ConversationDetailsRail
                    activeConversation={activeConversation}
                    currentUserId={currentUserId}
                    memberDirectory={memberDirectory}
                    messages={activeMessages}
                    assetsById={assetsById}
                    title={activeConversationTitle}
                    subtitle={activeConversationBadge}
                    liveMemberCount={activeLiveCount}
                    canManageConversation={Boolean(activeConversation.ownerUserId === currentUserId)}
                    groupName={groupName}
                    channelDescription={channelDescription}
                    memberMessagingEnabled={memberMessagingEnabled}
                    onGroupNameChange={setGroupName}
                    onChannelDescriptionChange={setChannelDescription}
                    onMemberMessagingEnabledChange={setMemberMessagingEnabled}
                    onSaveSettings={handleSaveSettings}
                    savingSettings={savingSettings}
                    manageQuery={manageQuery}
                    onManageQueryChange={setManageQuery}
                    onRunManageLookup={handleRunManageLookup}
                    manageResults={manageResults}
                    manageLoading={manageLoading}
                    onAddParticipant={handleAddParticipant}
                    onRemoveParticipant={id => removeParticipant(activeConversation.id, id)}
                    onTogglePinned={() => updatePreferences(activeConversation.id, { pinned: !activeConversation.pinned })}
                    onToggleMuted={() => updatePreferences(activeConversation.id, { muted: !activeConversation.muted })}
                    onArchive={() => updatePreferences(activeConversation.id, { archived: true })}
                    onRestore={() => updatePreferences(activeConversation.id, { archived: false })}
                    onClearPin={() => pinMessage(activeConversation.id, null)}
                  />
                </div>
              </aside>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          <p className="text-sm font-medium text-slate-600">Initializing workspace chat...</p>
        </div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
