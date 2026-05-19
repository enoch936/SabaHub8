"use client";

import Link from "next/link";
import Image from "next/image";
import {
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
  Activity,
  Bot,
  ChevronRight,
  GripVertical,
  Hash,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  Plus,
  Radio,
  Search,
  Settings2,
  Users,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
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
type MailboxView = "INBOX" | "PINNED" | "ARCHIVED";

const THREAD_FILTERS: Array<{ key: ThreadFilter; label: string; icon: ReactNode }> = [
  { key: "ALL", label: "All", icon: <MessageSquare className="h-4 w-4" /> },
  { key: "GROUP", label: "Groups", icon: <Users className="h-4 w-4" /> },
  { key: "CHANNEL", label: "Channels", icon: <Hash className="h-4 w-4" /> },
];

const MAILBOX_FILTERS: Array<{ key: MailboxView; label: string }> = [
  { key: "INBOX", label: "Inbox" },
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
    mailboxView === "PINNED" ? "Pinned command lane in focus" : `${filteredCount} conversations visible`,
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,11,23,0.9),rgba(7,12,28,0.78))] p-4 shadow-[0_32px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:p-5"
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

function normalizeDisplayName(user: AppUser) {
  return user.fullName?.trim() || user.username?.trim() || user.email?.trim() || user.id;
}

function normalizeLookupValue(value?: string | null) {
  return value?.trim().toLowerCase() || "";
}

function getExactUserMatch(users: AppUser[], query: string) {
  const normalizedQuery = normalizeLookupValue(query);
  return (
    users.find((user) => normalizeLookupValue(user.id) === normalizedQuery)
    || users.find((user) => normalizeLookupValue(user.username) === normalizedQuery)
    || users.find((user) => normalizeLookupValue(user.email) === normalizedQuery)
    || null
  );
}

async function resolveUsersFromQuery(query: string) {
  const trimmed = query.trim();
  if (!trimmed) {
    return [] as AppUser[];
  }

  const results: AppUser[] = [];
  const seen = new Set<string>();
  const pushUnique = (user?: AppUser | null) => {
    if (user?.id && !seen.has(user.id)) {
      seen.add(user.id);
      results.push(user);
    }
  };

  if (!trimmed.includes(" ")) {
    pushUnique(await getUserById(trimmed).catch(() => null));
    pushUnique(await searchUserByUsername(trimmed).catch(() => null));
    if (trimmed.includes("@")) {
      pushUnique(await searchUserByEmail(trimmed).catch(() => null));
    }
  }

  const nameMatches = await searchUsersByName(trimmed).catch(() => ({ results: [] as AppUser[] }));
  nameMatches.results.forEach((user) => pushUnique(user));

  return results;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const typingResetRef = useRef<number | null>(null);

  const profileName = useSession((state) => state.fullName || state.username || "Workspace member");
  const profileEmail = useSession((state) => state.email);
  const profilePictureUrl = useSession((state) => state.profilePictureUrl);
  const sessionRoles = useSession((state) => state.roles ?? []);

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
    createManagedThread,
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
  } = useChatStore();

  const [filter, setFilter] = useState<ThreadFilter>("ALL");
  const [mailboxView, setMailboxView] = useState<MailboxView>("INBOX");
  const [inboxQuery, setInboxQuery] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "conversation">("list");
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightRailOpen, setRightRailOpen] = useState(false);
  const [inboxWidth, setInboxWidth] = useState(392);
  const [detailsWidth, setDetailsWidth] = useState(384);
  const [draggingPane, setDraggingPane] = useState<ResizablePane | null>(null);
  const [showComposerPanel, setShowComposerPanel] = useState(true);
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResults, setLookupResults] = useState<AppUser[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [composeMode, setComposeMode] = useState<"DIRECT" | "GROUP" | "CHANNEL">("DIRECT");
  const [selectedUsers, setSelectedUsers] = useState<AppUser[]>([]);
  const [groupName, setGroupName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [memberMessagingEnabled, setMemberMessagingEnabled] = useState(false);
  const [manageQuery, setManageQuery] = useState("");
  const [manageResults, setManageResults] = useState<AppUser[]>([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [unreadSnapshotByConversation, setUnreadSnapshotByConversation] = useState<Record<string, number>>({});
  const [missedCallCounts, setMissedCallCounts] = useState<Record<string, number>>({});

  const deferredInboxQuery = useDeferredValue(inboxQuery);
  const debouncedLookupQuery = useDebounce(lookupQuery, 280);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedInboxWidth = Number(window.localStorage.getItem(CHAT_INBOX_WIDTH_KEY));
    const storedDetailsWidth = Number(window.localStorage.getItem(CHAT_DETAILS_WIDTH_KEY));

    if (Number.isFinite(storedInboxWidth) && storedInboxWidth > 0) {
      setInboxWidth(clampNumber(storedInboxWidth, INBOX_WIDTH_MIN, INBOX_WIDTH_MAX));
    }

    if (Number.isFinite(storedDetailsWidth) && storedDetailsWidth > 0) {
      setDetailsWidth(clampNumber(storedDetailsWidth, DETAILS_WIDTH_MIN, DETAILS_WIDTH_MAX));
    }

    if (!window.matchMedia("(min-width: 1024px)").matches) {
      setShowComposerPanel(false);
    }
  }, []);

  useEffect(() => {
    if (mobileView === "conversation") {
      setShowComposerPanel(false);
    }
  }, [mobileView]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (rightRailOpen && !window.matchMedia("(min-width: 1280px)").matches) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
    return;
  }, [rightRailOpen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(CHAT_INBOX_WIDTH_KEY, String(inboxWidth));
  }, [inboxWidth]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(CHAT_DETAILS_WIDTH_KEY, String(detailsWidth));
  }, [detailsWidth]);

  useEffect(() => {
    if (activeConversationId && !messages[activeConversationId]) {
      void fetchMessages(activeConversationId);
    }
  }, [activeConversationId, messages, fetchMessages]);

  useEffect(() => {
    const threadId = searchParams.get("thread");
    if (threadId) {
      const selected = conversations.find((conversation) => conversation.id === threadId);
      setUnreadSnapshotByConversation((current) => ({
        ...current,
        [threadId]: Math.max(0, Number(selected?.unreadCount ?? 0)),
      }));
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

  useEffect(() => {
    if (!activeConversationId) {
      setMobileView("list");
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (activeConversationId && typeof window !== "undefined" && window.matchMedia("(min-width: 1280px)").matches) {
      setRightRailOpen(true);
    }
  }, [activeConversationId]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      if (mailboxView === "INBOX" && conversation.archived) {
        return false;
      }
      if (mailboxView === "PINNED" && (!conversation.pinned || conversation.archived)) {
        return false;
      }
      if (mailboxView === "ARCHIVED" && !conversation.archived) {
        return false;
      }
      if (filter !== "ALL" && (conversation.threadType ?? "DIRECT") !== filter) {
        return false;
      }

      if (!deferredInboxQuery.trim()) {
        return true;
      }

      const query = deferredInboxQuery.trim().toLowerCase();
      const participantSearchTerms = (conversation.participantIds ?? []).flatMap((participantId) => {
        const participant = directory[participantId];
        return [participantId, participant?.label, participant?.fullName, participant?.username, participant?.email];
      });
      const haystack = [
        conversation.id,
        getConversationTitle(conversation),
        conversation.lastMessage,
        conversation.groupName,
        conversation.channelDescription,
        ...participantSearchTerms,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [conversations, deferredInboxQuery, directory, filter, getConversationTitle, mailboxView]);

  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) ?? null;
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
    if (!activeConversation) {
      return "Choose a conversation from your inbox";
    }

    if ((activeConversation.threadType ?? "DIRECT") === "DIRECT") {
      const counterpart = memberDirectory[0];
      if (counterpart?.online) {
        return `${counterpart.label} is active now`;
      }
      return activeConversation.lastMessageAt
        ? `Last activity ${formatRelativeActivity(activeConversation.lastMessageAt)}`
        : counterpart?.label || "Direct message";
    }

    if ((activeConversation.threadType ?? "DIRECT") === "GROUP") {
      return `${activeParticipantIds.length} members collaborating here`;
    }

    return activeConversation.memberMessagingEnabled
      ? `${activeParticipantIds.length} people can post`
      : "Owner-only posting is enabled";
  }, [activeConversation, activeParticipantIds.length, memberDirectory]);

  const totalConversations = conversations.length;
  const unreadCount = conversations.reduce((sum, conversation) => sum + Number(conversation.unreadCount ?? 0), 0);
  const onlineCount = Object.values(directory).filter((user) => user.online).length;

  const isChannelReadOnly = Boolean(
    activeConversation
      && (activeConversation.threadType ?? "DIRECT") === "CHANNEL"
      && !activeConversation.memberMessagingEnabled
      && activeConversation.ownerUserId !== currentUserId,
  );

  const canManageConversation = Boolean(
    activeConversation
      && (activeConversation.threadType ?? "DIRECT") !== "DIRECT"
      && (activeConversation.ownerUserId === currentUserId || sessionRoles.includes("ADMIN")),
  );

  const resetComposer = () => {
    setSelectedUsers([]);
    setGroupName("");
    setChannelDescription("");
    setMemberMessagingEnabled(false);
    setLookupQuery("");
    setLookupResults([]);
  };

  const handleSelectConversation = (conversationId: string) => {
    const selected = conversations.find((conversation) => conversation.id === conversationId);
    setUnreadSnapshotByConversation((current) => ({
      ...current,
      [conversationId]: Math.max(0, Number(selected?.unreadCount ?? 0)),
    }));
    setLookupQuery("");
    setLookupResults([]);
    setManageQuery("");
    setManageResults([]);
    setShowComposerPanel(false);
    setMissedCallCounts((current) => ({ ...current, [conversationId]: 0 }));
    setActiveConversation(conversationId);
    setMobileView("conversation");
  };

  const handleOpenComposer = () => {
    setActiveConversation(null);
    setRightRailOpen(false);
    setShowComposerPanel(true);
    setMobileView("list");
  };

  const runLookup = async () => {
    if (!lookupQuery.trim()) {
      setLookupResults([]);
      return;
    }

    setLookupLoading(true);
    try {
      const users = await resolveUsersFromQuery(lookupQuery);
      setLookupResults(users.filter((user) => user.id !== currentUserId));
      if (users.length === 0) {
        toast.info("No users matched that username, email, or ID.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to search for users.");
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    const query = debouncedLookupQuery.trim();
    if (!query) {
      setLookupResults([]);
      setLookupLoading(false);
      return;
    }

    let cancelled = false;
    setLookupLoading(true);
    void resolveUsersFromQuery(query)
      .then((users) => {
        if (cancelled) {
          return;
        }
        setLookupResults(users.filter((user) => user.id !== currentUserId));
      })
      .catch(() => {
        if (!cancelled) {
          setLookupResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLookupLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUserId, debouncedLookupQuery]);

  const handleStartDirectFromUser = async (user: AppUser) => {
    try {
      const thread = await ensureDirectThread(user.id);
      setUnreadSnapshotByConversation((current) => ({ ...current, [thread.id]: 0 }));
      setActiveConversation(thread.id);
      setMobileView("conversation");
      setShowComposerPanel(false);
      toast.success(`Direct chat opened with ${normalizeDisplayName(user)}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open direct chat.");
    }
  };

  const runManageLookup = async () => {
    if (!manageQuery.trim()) {
      setManageResults([]);
      return;
    }

    setManageLoading(true);
    try {
      const users = await resolveUsersFromQuery(manageQuery);
      setManageResults(
        users.filter((user) => user.id !== currentUserId && !activeParticipantIds.includes(user.id)),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to search members.");
    } finally {
      setManageLoading(false);
    }
  };

  const addSelectedUser = (user: AppUser) => {
    setSelectedUsers((current) => (current.some((item) => item.id === user.id) ? current : [...current, user]));
  };

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers((current) => current.filter((user) => user.id !== userId));
  };

  const handleStartConversation = async () => {
    if (composeMode === "DIRECT") {
      if (selectedUsers.length !== 1) {
        toast.error("Choose exactly one user to start a direct conversation.");
        return;
      }
      await handleStartDirectFromUser(selectedUsers[0]);
      resetComposer();
      return;
    }

    if (!groupName.trim()) {
      toast.error(composeMode === "CHANNEL" ? "Channel name is required." : "Group name is required.");
      return;
    }
    if (composeMode === "GROUP" && selectedUsers.length < 2) {
      toast.error("Group chat needs at least two other participants.");
      return;
    }

    try {
      const thread = await createManagedThread({
        participantIds: selectedUsers.map((user) => user.id),
        threadType: composeMode,
        groupName: groupName.trim(),
        channelDescription: composeMode === "CHANNEL" ? channelDescription.trim() : undefined,
        memberMessagingEnabled,
      });
      setUnreadSnapshotByConversation((current) => ({ ...current, [thread.id]: 0 }));
      setActiveConversation(thread.id);
      setMobileView("conversation");
      setShowComposerPanel(false);
      resetComposer();
      toast.success(composeMode === "CHANNEL" ? "Channel created." : "Group created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create conversation.");
    }
  };

  const handleSend = (content: string, options?: { replyToMessageId?: string | null }) => {
    if (!activeConversationId) {
      return;
    }
    void sendMessage(activeConversationId, content, "TEXT", options);
  };

  const handleSendAsset = (assetId: string) => {
    if (!activeConversationId) {
      return;
    }
    void sendAssetMessage(activeConversationId, assetId);
  };

  const handleTyping = () => {
    if (!activeConversationId) {
      return;
    }

    void announceTyping(activeConversationId, true);
    if (typingResetRef.current != null) {
      window.clearTimeout(typingResetRef.current);
    }
    typingResetRef.current = window.setTimeout(() => {
      void announceTyping(activeConversationId, false);
      typingResetRef.current = null;
    }, 1600);
  };

  const handleSaveSettings = async () => {
    if (!activeConversation || !canManageConversation) {
      return;
    }

    setSavingSettings(true);
    try {
      await updateThread(activeConversation.id, {
        groupName: groupName.trim() || activeConversation.groupName,
        channelDescription:
          (activeConversation.threadType ?? "DIRECT") === "CHANNEL" ? channelDescription.trim() : undefined,
        memberMessagingEnabled:
          (activeConversation.threadType ?? "DIRECT") === "CHANNEL" ? memberMessagingEnabled : undefined,
      });
      toast.success("Conversation settings updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddParticipant = async (userId: string) => {
    if (!activeConversation) {
      return;
    }

    try {
      await addParticipants(activeConversation.id, [userId]);
      toast.success("Participant added.");
      setManageResults((current) => current.filter((user) => user.id !== userId));
      setManageQuery("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add participant.");
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!activeConversation) {
      return;
    }

    try {
      await removeParticipant(activeConversation.id, participantId);
      if (participantId === currentUserId) {
        setMobileView("list");
        setRightRailOpen(false);
      }
      toast.success(participantId === currentUserId ? "You left the conversation." : "Participant removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove participant.");
    }
  };

  const handleToggleConversationPin = () => {
    if (!activeConversation) {
      return;
    }
    void updatePreferences(activeConversation.id, { pinned: !activeConversation.pinned });
  };

  const handleToggleConversationMute = () => {
    if (!activeConversation) {
      return;
    }
    void updatePreferences(activeConversation.id, { muted: !activeConversation.muted });
  };

  const handleToggleConversationArchive = () => {
    if (!activeConversation) {
      return;
    }
    void updatePreferences(activeConversation.id, { archived: !activeConversation.archived });
  };

  useEffect(() => {
    if (!activeConversation) {
      return;
    }
    setGroupName(activeConversation.groupName ?? "");
    setChannelDescription(activeConversation.channelDescription ?? "");
    setMemberMessagingEnabled(Boolean(activeConversation.memberMessagingEnabled));
  }, [activeConversation]);

  const inboxPanelStyle = {
    "--chat-inbox-width": `${inboxWidth}px`,
  } as CSSProperties;

  const detailsRailStyle = {
    "--chat-details-width": `${detailsWidth}px`,
  } as CSSProperties;

  const startPaneResize =
    (pane: ResizablePane) => (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      const startX = event.clientX;
      const startWidth = pane === "inbox" ? inboxWidth : detailsWidth;
      const previousCursor = document.body.style.cursor;
      const previousUserSelect = document.body.style.userSelect;

      setDraggingPane(pane);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX;
        if (pane === "inbox") {
          setInboxWidth(clampNumber(startWidth + delta, INBOX_WIDTH_MIN, INBOX_WIDTH_MAX));
          return;
        }
        setDetailsWidth(clampNumber(startWidth - delta, DETAILS_WIDTH_MIN, DETAILS_WIDTH_MAX));
      };

      const stopResize = () => {
        setDraggingPane(null);
        document.body.style.cursor = previousCursor;
        document.body.style.userSelect = previousUserSelect;
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", stopResize);
        window.removeEventListener("pointercancel", stopResize);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", stopResize);
      window.addEventListener("pointercancel", stopResize);
    };

  return (
    <div className="relative h-[calc(100dvh-6rem)] overflow-hidden rounded-[2rem] border border-white/10 bg-[#030712] text-slate-100 shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_85%_12%,rgba(139,92,246,0.12),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(34,197,94,0.08),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_22%,transparent_78%,rgba(255,255,255,0.02))]" />
      <div className="relative z-10 flex h-full flex-col gap-4 p-3 lg:p-4">
        <header className="flex items-center justify-between rounded-[1.6rem] border border-white/10 bg-white/6 px-4 py-3 backdrop-blur-2xl lg:px-5">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="SabaHub" width={44} height={44} className="rounded-2xl object-cover shadow-[0_0_30px_rgba(34,211,238,0.15)]" style={{ width: "auto", height: "auto" }} priority />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300/70">SabaHub AI OS</p>
              <h1 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-white">Chat command center</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLeftPanelOpen((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              {leftPanelOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              Workspace rail
            </button>
            <Link
              href={workspaceRoutes.settings}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-3 py-2 text-sm font-semibold text-white transition hover:scale-[1.01]"
            >
              <Settings2 className="h-4 w-4" />
              Settings
            </Link>
          </div>
        </header>

        <AIOperatingSystemDashboard
          profileName={profileName}
          profileEmail={profileEmail}
          totalConversations={totalConversations}
          unreadCount={unreadCount}
          activeLiveCount={activeLiveCount}
          onlineCount={onlineCount}
          activeConversationTitle={activeConversationTitle}
          activeTyping={activeTyping}
          mailboxView={mailboxView}
          filteredCount={filteredConversations.length}
          conversations={conversations}
        />

        <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-2xl">

        <section
          style={inboxPanelStyle}
          className={`${mobileView === "conversation" ? "hidden lg:flex" : "flex"} ${leftPanelOpen ? "lg:flex" : "lg:hidden"} min-h-0 w-full max-w-full flex-col overflow-hidden border-r border-white/10 bg-[rgba(8,12,24,0.72)] lg:w-[var(--chat-inbox-width)] lg:flex-shrink-0`}
        >
          {/* Fixed header: title + search + filters */}
          <div className="shrink-0 border-b border-white/10 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300/70">Focused inbox</p>
                <h2 className="mt-2 font-[family:var(--font-display)] text-[1.45rem] font-semibold leading-none text-white">
                  Messages
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  Calm, fast chat for direct work, groups, and live channels.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowComposerPanel((current) => !current)}
                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
                  showComposerPanel
                    ? "border-white/10 bg-white/8 text-white shadow-[0_16px_30px_rgba(40,63,53,0.08)]"
                    : "border-transparent bg-cyan-500 text-white shadow-[0_16px_30px_rgba(34,211,238,0.2)]"
                }`}
                aria-label={showComposerPanel ? "Hide composer panel" : "Show composer panel"}
              >
                {showComposerPanel ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </button>
            </div>

            <ChatSearchInput className="mt-3 rounded-xl border-white/10 bg-black/20 px-3 py-2.5">
              <Search className="h-4.5 w-4.5 text-slate-400" />
              <input
                value={inboxQuery}
                onChange={(event) => setInboxQuery(event.target.value)}
                placeholder="Search people, groups, channels, and messages"
                className={chatUi.input}
              />
            </ChatSearchInput>

            <div className="mt-3 flex flex-wrap gap-2">
              {THREAD_FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setFilter(item.key);
                    setMailboxView("INBOX");
                  }}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${
                    filter === item.key && mailboxView === "INBOX"
                      ? "bg-cyan-500 text-white shadow-[0_14px_24px_rgba(34,211,238,0.2)]"
                      : "bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {MAILBOX_FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setMailboxView(item.key);
                    if (item.key !== "INBOX") {
                      setFilter("ALL");
                    }
                  }}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                    mailboxView === item.key
                      ? "bg-white/12 text-white"
                      : "bg-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

          </div>

          {showComposerPanel ? (
            <div className="flex shrink-0 flex-col overflow-hidden border-b border-white/10 bg-[rgba(8,12,24,0.62)]" style={{ maxHeight: "55%" }}>
              {/* Composer header */}
              <div className="flex items-center justify-between border-b border-white/10 bg-black/25 px-4 py-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">New conversation</p>
                  <h3 className="mt-0.5 text-sm font-semibold text-white">
                    {composeMode === "DIRECT" ? "Direct message" : composeMode === "GROUP" ? "Create group" : "Create channel"}
                  </h3>
                </div>
                {/* Mode tabs */}
                <div className="flex gap-1 rounded-[14px] bg-white/5 p-1">
                  {([
                    { key: "DIRECT", label: "DM" },
                    { key: "GROUP", label: "Group" },
                    { key: "CHANNEL", label: "Channel" },
                  ] as const).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setComposeMode(item.key)}
                      className={`rounded-[10px] px-2.5 py-1.5 text-[11px] font-semibold transition ${
                        composeMode === item.key ? "bg-cyan-400 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable body */}
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">

                {/* User search */}
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {composeMode === "DIRECT" ? "Find person" : "Add members"}
                  </p>
                  <div className="flex items-center gap-2 rounded-[14px] border border-white/10 bg-black/25 px-3 py-2.5 shadow-sm">
                    <Search className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      value={lookupQuery}
                      onChange={(event) => setLookupQuery(event.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") void runLookup(); }}
                      placeholder="Name, username, email, or ID"
                      className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => void runLookup()}
                      className="shrink-0 rounded-full bg-cyan-500 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-cyan-400"
                    >
                      {lookupLoading ? "…" : "Find"}
                    </button>
                  </div>

                  {/* Search results */}
                  {lookupResults.length > 0 ? (
                    <div className="mt-2 space-y-1.5 rounded-[14px] border border-white/10 bg-black/25 p-2">
                      {lookupResults.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between gap-2 rounded-[10px] px-3 py-2.5 transition hover:bg-white/5"
                        >
                          <button type="button" onClick={() => addSelectedUser(user)} className="min-w-0 flex-1 text-left">
                            <p className="truncate text-sm font-semibold text-white">{normalizeDisplayName(user)}</p>
                            <p className="truncate text-xs text-slate-400">{user.username || user.email || user.id}</p>
                          </button>
                          <div className="flex shrink-0 gap-1.5">
                            <button
                              type="button"
                              onClick={() => addSelectedUser(user)}
                              className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:bg-white/10"
                            >
                              + Add
                            </button>
                            {composeMode === "DIRECT" ? (
                              <button
                                type="button"
                                onClick={() => void handleStartDirectFromUser(user)}
                                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:bg-white/10"
                              >
                                Open
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Selected users */}
                {selectedUsers.length > 0 ? (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Selected ({selectedUsers.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-1.5 pl-3 pr-2 text-xs font-medium text-slate-200"
                        >
                          <span className="max-w-[100px] truncate">{normalizeDisplayName(user)}</span>
                          <button
                            type="button"
                            onClick={() => removeSelectedUser(user.id)}
                            className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-slate-200 transition hover:bg-white/20"
                            aria-label={`Remove ${normalizeDisplayName(user)}`}
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Group / Channel fields */}
                {composeMode !== "DIRECT" ? (
                  <div className="space-y-3">
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {composeMode === "CHANNEL" ? "Channel name" : "Group name"}
                      </p>
                      <input
                        value={groupName}
                        onChange={(event) => setGroupName(event.target.value)}
                        placeholder={composeMode === "CHANNEL" ? "e.g. design-feedback" : "e.g. Project Alpha"}
                        className="w-full rounded-[14px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 transition"
                      />
                    </div>

                    {composeMode === "CHANNEL" ? (
                      <>
                        <div>
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Description</p>
                          <textarea
                            value={channelDescription}
                            onChange={(event) => setChannelDescription(event.target.value)}
                            rows={3}
                            placeholder="What is this channel for?"
                            className="w-full resize-none rounded-[14px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 transition"
                          />
                        </div>
                        <label className="flex cursor-pointer items-center gap-3 rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10">
                          <input
                            type="checkbox"
                            checked={memberMessagingEnabled}
                            onChange={(event) => setMemberMessagingEnabled(event.target.checked)}
                            className="h-4 w-4 accent-cyan-400"
                          />
                          <div>
                            <p className="text-sm font-medium text-white">Allow members to post</p>
                            <p className="text-xs text-slate-400">Members can send messages in this channel</p>
                          </div>
                        </label>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {/* Sticky action bar */}
              <div className="border-t border-white/10 bg-black/25 px-4 py-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleStartConversation()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {composeMode === "DIRECT" ? "Open direct" : composeMode === "GROUP" ? "Create group" : "Create channel"}
                </button>
                <button
                  type="button"
                  onClick={resetComposer}
                  className="rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-hidden">
            <ConversationList
              conversations={filteredConversations}
              maxItems={10}
              missedCallCounts={missedCallCounts}
              activeId={activeConversationId}
              onSelect={handleSelectConversation}
              resolveTitle={getConversationTitle}
              resolveSubtitle={(conversation) => getThreadBadgeLabel(conversation.threadType)}
              resolveLiveCount={getConversationLiveCount}
              isLoading={isLoading}
            />
          </div>

        </section>

        {leftPanelOpen ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize conversation sidebar"
            onPointerDown={startPaneResize("inbox")}
            className={`hidden w-2 cursor-col-resize items-center justify-center border-r border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white lg:flex ${
                draggingPane === "inbox" ? "bg-white/10 text-white" : ""
            }`}
          >
            <GripVertical className="h-4 w-4" />
          </div>
        ) : null}

          <section className={`${mobileView === "conversation" ? "flex" : "hidden lg:flex"} h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-[rgba(6,10,20,0.72)]`}>
          {activeConversationId ? (
            <ChatConversation
              conversationId={activeConversationId}
              title={activeConversationTitle}
              subtitle={activeConversationBadge}
              headerMeta={activeMemberSummary}
              typingUsers={activeTyping}
              currentUserId={currentUserId}
              messages={activeMessages}
              assetsById={assetsById}
              isLoading={isLoading && activeMessages.length === 0}
              onSend={handleSend}
              onSendAsset={handleSendAsset}
              onEditMessage={(messageId, text) => {
                if (!activeConversationId) {
                  return;
                }
                void editMessage(activeConversationId, messageId, text);
              }}
              onDeleteMessage={(messageId) => {
                if (!activeConversationId) {
                  return;
                }
                void deleteMessage(activeConversationId, messageId, true);
              }}
              onForwardMessage={(messageId) => {
                if (!activeConversationId) {
                  return;
                }
                void forwardMessage(activeConversationId, messageId);
              }}
              onPinMessage={(messageId) => {
                if (!activeConversationId) {
                  return;
                }
                void pinMessage(activeConversationId, messageId);
              }}
              onReactMessage={(messageId, emoji) => {
                if (!activeConversationId) {
                  return;
                }
                void toggleReaction(activeConversationId, messageId, emoji);
              }}
              onTyping={handleTyping}
              getDisplayName={getDisplayName}
              inputDisabled={isChannelReadOnly}
              readOnlyNote={
                isChannelReadOnly
                  ? "This channel is configured for owner-only posting. You can read updates, but only the channel owner can publish messages."
                  : null
              }
              pinnedMessageId={activeConversation?.pinnedMessageId ?? null}
              isPinned={Boolean(activeConversation?.pinned)}
              isMuted={Boolean(activeConversation?.muted)}
              isArchived={Boolean(activeConversation?.archived)}
              liveCount={activeLiveCount}
              unreadCountAtOpen={activeConversationId ? (unreadSnapshotByConversation[activeConversationId] ?? 0) : 0}
              threadType={activeConversation?.threadType ?? "DIRECT"}
              participantIds={activeConversation?.participantIds ?? []}
              onMissedCall={(conversationId) => {
                setMissedCallCounts((current) => ({
                  ...current,
                  [conversationId]: Math.min(99, Math.max(0, Number(current[conversationId] ?? 0)) + 1),
                }));
              }}
              onBack={() => setMobileView("list")}
              onOpenDetails={() => setRightRailOpen(true)}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="grid h-24 w-24 place-items-center rounded-[30px] border border-white/10 bg-white/5 text-cyan-200 shadow-[0_24px_48px_rgba(38,67,56,0.08)]">
                <MessageSquare className="h-9 w-9" />
              </div>
              <h2 className="mt-6 font-[family:var(--font-display)] text-3xl font-semibold text-white">
                Open a real conversation
              </h2>
              <p className="mt-3 max-w-[460px] text-sm leading-6 text-slate-300">
                Choose an existing direct chat, group, or channel from the inbox, or create a new one from the composer panel.
              </p>
              <button
                type="button"
                onClick={handleOpenComposer}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(39,70,59,0.18)] transition hover:brightness-110"
              >
                <Plus className="h-4 w-4" />
                Start a conversation
              </button>
            </div>
          )}
        </section>

        {rightRailOpen && activeConversation ? (
          <>
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize conversation details"
              onPointerDown={startPaneResize("details")}
              className={`hidden w-2 cursor-col-resize items-center justify-center border-l border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white xl:flex ${
                draggingPane === "details" ? "bg-white/10 text-white" : ""
              }`}
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <aside
              style={detailsRailStyle}
              className="hidden flex-shrink-0 overflow-y-auto border-l border-white/10 bg-[rgba(8,12,24,0.86)] xl:block xl:w-[var(--chat-details-width)]"
            >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Context</p>
                <h2 className="mt-2 text-base font-semibold text-white">Conversation details</h2>
              </div>
              <button
                type="button"
                onClick={() => setRightRailOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                aria-label="Close conversation details"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>
            <ConversationDetailsRail
              activeConversation={activeConversation}
              currentUserId={currentUserId}
              memberDirectory={memberDirectory}
              messages={activeMessages}
              assetsById={assetsById}
              title={activeConversationTitle}
              subtitle={activeConversationBadge}
              liveMemberCount={activeLiveCount}
              canManageConversation={canManageConversation}
              groupName={groupName}
              channelDescription={channelDescription}
              memberMessagingEnabled={memberMessagingEnabled}
              onGroupNameChange={setGroupName}
              onChannelDescriptionChange={setChannelDescription}
              onMemberMessagingEnabledChange={setMemberMessagingEnabled}
              onSaveSettings={() => void handleSaveSettings()}
              savingSettings={savingSettings}
              manageQuery={manageQuery}
              onManageQueryChange={setManageQuery}
              onRunManageLookup={() => void runManageLookup()}
              manageResults={manageResults}
              manageLoading={manageLoading}
              onAddParticipant={(userId) => void handleAddParticipant(userId)}
              onRemoveParticipant={(participantId) => void handleRemoveParticipant(participantId)}
              onTogglePinned={handleToggleConversationPin}
              onToggleMuted={handleToggleConversationMute}
              onArchive={() => activeConversation && void updatePreferences(activeConversation.id, { archived: true })}
              onRestore={() => activeConversation && void updatePreferences(activeConversation.id, { archived: false })}
              onClearPin={() => activeConversation && void pinMessage(activeConversation.id, null)}
            />
            </aside>
          </>
        ) : null}
      </div>

      {rightRailOpen && activeConversation ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[1px] xl:hidden">
          <div className="ml-auto h-full w-full max-w-[420px] overflow-y-auto bg-[rgba(8,12,24,0.98)] shadow-[0_28px_60px_rgba(15,23,42,0.38)]">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Context</p>
                <h2 className="mt-2 text-base font-semibold text-white">Conversation details</h2>
              </div>
              <button
                type="button"
                onClick={() => setRightRailOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200"
                aria-label="Close conversation details"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <ConversationDetailsRail
              activeConversation={activeConversation}
              currentUserId={currentUserId}
              memberDirectory={memberDirectory}
              messages={activeMessages}
              assetsById={assetsById}
              title={activeConversationTitle}
              subtitle={activeConversationBadge}
              liveMemberCount={activeLiveCount}
              canManageConversation={canManageConversation}
              groupName={groupName}
              channelDescription={channelDescription}
              memberMessagingEnabled={memberMessagingEnabled}
              onGroupNameChange={setGroupName}
              onChannelDescriptionChange={setChannelDescription}
              onMemberMessagingEnabledChange={setMemberMessagingEnabled}
              onSaveSettings={() => void handleSaveSettings()}
              savingSettings={savingSettings}
              manageQuery={manageQuery}
              onManageQueryChange={setManageQuery}
              onRunManageLookup={() => void runManageLookup()}
              manageResults={manageResults}
              manageLoading={manageLoading}
              onAddParticipant={(userId) => void handleAddParticipant(userId)}
              onRemoveParticipant={(participantId) => void handleRemoveParticipant(participantId)}
              onTogglePinned={handleToggleConversationPin}
              onToggleMuted={handleToggleConversationMute}
              onArchive={() => activeConversation && void updatePreferences(activeConversation.id, { archived: true })}
              onRestore={() => activeConversation && void updatePreferences(activeConversation.id, { archived: false })}
              onClearPin={() => activeConversation && void pinMessage(activeConversation.id, null)}
            />
          </div>
        </div>
      ) : null}
    </div>
    </div>
  );
}
