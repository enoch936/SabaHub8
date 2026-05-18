"use client";

import Link from "next/link";
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
  Bell,
  ChevronRight,
  Clock3,
  Eye,
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
  Shield,
  Sparkles,
  Users,
  X,
} from "lucide-react";
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

const RECENT_CHAT_VIEWS_KEY = "sabahub:chat-recent-views";
const CHAT_INBOX_WIDTH_KEY = "sabahub:chat-inbox-width";
const CHAT_DETAILS_WIDTH_KEY = "sabahub:chat-details-width";
const INBOX_WIDTH_MIN = 320;
const INBOX_WIDTH_MAX = 520;
const DETAILS_WIDTH_MIN = 320;
const DETAILS_WIDTH_MAX = 500;

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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
  const [recentConversationIds, setRecentConversationIds] = useState<string[]>([]);
  const [showComposerPanel, setShowComposerPanel] = useState(true);
  const [directIdentifier, setDirectIdentifier] = useState("");
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResults, setLookupResults] = useState<AppUser[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [directSuggestions, setDirectSuggestions] = useState<AppUser[]>([]);
  const [directSuggestionsLoading, setDirectSuggestionsLoading] = useState(false);
  const [inboxGlobalResults, setInboxGlobalResults] = useState<AppUser[]>([]);
  const [inboxGlobalLoading, setInboxGlobalLoading] = useState(false);
  const [composeMode, setComposeMode] = useState<"DIRECT" | "GROUP" | "CHANNEL">("DIRECT");
  const [selectedUsers, setSelectedUsers] = useState<AppUser[]>([]);
  const [groupName, setGroupName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [memberMessagingEnabled, setMemberMessagingEnabled] = useState(false);
  const [manageQuery, setManageQuery] = useState("");
  const [manageResults, setManageResults] = useState<AppUser[]>([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const deferredInboxQuery = useDeferredValue(inboxQuery);
  const debouncedLookupQuery = useDebounce(lookupQuery, 280);
  const debouncedDirectIdentifier = useDebounce(directIdentifier, 280);
  const debouncedInboxQuery = useDebounce(inboxQuery, 280);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedInboxWidth = Number(window.localStorage.getItem(CHAT_INBOX_WIDTH_KEY));
    const storedDetailsWidth = Number(window.localStorage.getItem(CHAT_DETAILS_WIDTH_KEY));
    const storedRecentViews = window.localStorage.getItem(RECENT_CHAT_VIEWS_KEY);

    if (Number.isFinite(storedInboxWidth) && storedInboxWidth > 0) {
      setInboxWidth(clampNumber(storedInboxWidth, INBOX_WIDTH_MIN, INBOX_WIDTH_MAX));
    }

    if (Number.isFinite(storedDetailsWidth) && storedDetailsWidth > 0) {
      setDetailsWidth(clampNumber(storedDetailsWidth, DETAILS_WIDTH_MIN, DETAILS_WIDTH_MAX));
    }

    if (storedRecentViews) {
      try {
        const parsed = JSON.parse(storedRecentViews) as unknown;
        if (Array.isArray(parsed)) {
          setRecentConversationIds(parsed.filter((item): item is string => typeof item === "string").slice(0, 6));
        }
      } catch {
        window.localStorage.removeItem(RECENT_CHAT_VIEWS_KEY);
      }
    }
  }, []);

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
  }, [ensureDirectThread, searchParams, setActiveConversation]);

  useEffect(() => {
    if (!activeConversationId) {
      setMobileView("list");
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (!activeConversationId || !conversations.some((conversation) => conversation.id === activeConversationId)) {
      return;
    }

    setRecentConversationIds((current) => {
      const next = [
        activeConversationId,
        ...current.filter((conversationId) => conversationId !== activeConversationId),
      ].slice(0, 6);

      if (next.join("|") === current.join("|")) {
        return current;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(RECENT_CHAT_VIEWS_KEY, JSON.stringify(next));
      }

      return next;
    });

    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1280px)").matches) {
      setRightRailOpen(true);
    }
  }, [activeConversationId, conversations]);

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
  const totalLiveCount = useMemo(() => {
    const liveIds = new Set<string>();
    conversations.forEach((conversation) => {
      (conversation.participantIds ?? []).forEach((participantId) => {
        if (participantId === currentUserId || directory[participantId]?.online) {
          liveIds.add(participantId);
        }
      });
    });
    return liveIds.size;
  }, [conversations, currentUserId, directory]);

  const recentConversations = useMemo(
    () =>
      recentConversationIds
        .map((conversationId) => conversations.find((conversation) => conversation.id === conversationId))
        .filter((conversation): conversation is ChatThread => Boolean(conversation)),
    [conversations, recentConversationIds],
  );

  const totalUnread = conversations.reduce(
    (sum, conversation) => sum + Math.max(0, Number(conversation.unreadCount ?? 0)),
    0,
  );
  const pinnedCount = conversations.filter((conversation) => conversation.pinned && !conversation.archived).length;
  const archivedCount = conversations.filter((conversation) => conversation.archived).length;
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

  const threadCounts = useMemo(
    () => ({
      chats: conversations.filter((item) => (item.threadType ?? "DIRECT") === "DIRECT").length,
      groups: conversations.filter((item) => item.threadType === "GROUP").length,
      channels: conversations.filter((item) => item.threadType === "CHANNEL").length,
    }),
    [conversations],
  );

  const railItems = [
    {
      key: "all",
      label: "All chats",
      count: conversations.length,
      icon: <MessageSquare className="h-5 w-5" />,
      active: filter === "ALL" && mailboxView === "INBOX",
      onClick: () => {
        setFilter("ALL");
        setMailboxView("INBOX");
        setMobileView("list");
      },
    },
    {
      key: "groups",
      label: "Groups",
      count: threadCounts.groups,
      icon: <Users className="h-5 w-5" />,
      active: filter === "GROUP" && mailboxView === "INBOX",
      onClick: () => {
        setFilter("GROUP");
        setMailboxView("INBOX");
        setMobileView("list");
      },
    },
    {
      key: "channels",
      label: "Channels",
      count: threadCounts.channels,
      icon: <Hash className="h-5 w-5" />,
      active: filter === "CHANNEL" && mailboxView === "INBOX",
      onClick: () => {
        setFilter("CHANNEL");
        setMailboxView("INBOX");
        setMobileView("list");
      },
    },
    {
      key: "pinned",
      label: "Pinned",
      count: pinnedCount,
      icon: <Pin className="h-5 w-5" />,
      active: mailboxView === "PINNED",
      onClick: () => {
        setFilter("ALL");
        setMailboxView("PINNED");
        setMobileView("list");
      },
    },
    {
      key: "archived",
      label: "Archive",
      count: archivedCount,
      icon: <Archive className="h-5 w-5" />,
      active: mailboxView === "ARCHIVED",
      onClick: () => {
        setFilter("ALL");
        setMailboxView("ARCHIVED");
        setMobileView("list");
      },
    },
  ];

  const resetComposer = () => {
    setSelectedUsers([]);
    setGroupName("");
    setChannelDescription("");
    setMemberMessagingEnabled(false);
    setLookupQuery("");
    setLookupResults([]);
  };

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversation(conversationId);
    setMobileView("conversation");
  };

  const handleOpenComposer = () => {
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

  useEffect(() => {
    const query = debouncedDirectIdentifier.trim();
    if (!query || query.length < 2) {
      setDirectSuggestions([]);
      setDirectSuggestionsLoading(false);
      return;
    }

    let cancelled = false;
    setDirectSuggestionsLoading(true);
    void resolveUsersFromQuery(query)
      .then((users) => {
        if (cancelled) {
          return;
        }
        setDirectSuggestions(users.filter((user) => user.id !== currentUserId).slice(0, 5));
      })
      .catch(() => {
        if (!cancelled) {
          setDirectSuggestions([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDirectSuggestionsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUserId, debouncedDirectIdentifier]);

  useEffect(() => {
    const query = debouncedInboxQuery.trim();
    if (query.length < 2) {
      setInboxGlobalResults([]);
      setInboxGlobalLoading(false);
      return;
    }

    let cancelled = false;
    setInboxGlobalLoading(true);
    void resolveUsersFromQuery(query)
      .then((users) => {
        if (cancelled) {
          return;
        }
        setInboxGlobalResults(users.filter((user) => user.id !== currentUserId).slice(0, 6));
      })
      .catch(() => {
        if (!cancelled) {
          setInboxGlobalResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setInboxGlobalLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUserId, debouncedInboxQuery]);

  const handleStartDirectFromUser = async (user: AppUser) => {
    try {
      const thread = await ensureDirectThread(user.id);
      setActiveConversation(thread.id);
      setMobileView("conversation");
      setShowComposerPanel(false);
      toast.success(`Direct chat opened with ${normalizeDisplayName(user)}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open direct chat.");
    }
  };

  const handleStartDirectFromIdentifier = async () => {
    const identifier = directIdentifier.trim();
    if (!identifier) {
      toast.error("Enter a username, email, or user ID.");
      return;
    }

    try {
      const users = await resolveUsersFromQuery(identifier);
      const user = getExactUserMatch(users, identifier);
      if (!user?.id) {
        toast.error("No user found with that username, email, or ID.");
        return;
      }
      if (user.id === currentUserId) {
        toast.error("You cannot open a conversation with yourself.");
        return;
      }
      await handleStartDirectFromUser(user);
      setDirectIdentifier("");
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
    <div className="relative h-[calc(100dvh-6rem)] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
      <div className="relative flex h-full min-h-0">
        <aside className="hidden w-[92px] flex-shrink-0 flex-col border-r border-white/40 bg-[linear-gradient(180deg,#20332d_0%,#182822_100%)] px-3 py-4 lg:flex">
          <div className="rounded-[24px] border border-white/10 bg-white/5 px-3 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55">SabaHub</p>
            <h1 className="mt-2 text-sm font-semibold leading-5">Message deck</h1>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/80">
              <Radio className="h-3.5 w-3.5 text-[#42dc75]" />
              {totalLiveCount}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {railItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={item.onClick}
                className={`flex w-full flex-col items-center rounded-[24px] px-2 py-3 text-center transition ${
                  item.active
                    ? "bg-white text-[#1f352d] shadow-[0_18px_30px_rgba(12,24,18,0.18)]"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-black/10">
                  {item.icon}
                </span>
                <span className="mt-2 text-[11px] font-semibold leading-4">{item.label}</span>
                <span
                  className={`mt-2 inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    item.active ? "bg-[#e6efe6] text-[#33554a]" : "bg-white/12 text-white/80"
                  }`}
                >
                  {item.count}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-auto space-y-2">
            <button
              type="button"
              onClick={() => setLeftPanelOpen((current) => !current)}
              className="flex w-full flex-col items-center rounded-[24px] px-2 py-3 text-center text-white/75 transition hover:bg-white/10 hover:text-white"
              aria-label={leftPanelOpen ? "Hide conversation sidebar" : "Show conversation sidebar"}
              title={leftPanelOpen ? "Hide sidebar" : "Show sidebar"}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-black/10">
                {leftPanelOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
              </span>
              <span className="mt-2 text-[11px] font-semibold leading-4">
                {leftPanelOpen ? "Hide" : "Show"}
              </span>
            </button>

            <Link
              href={workspaceRoutes.notifications}
              className="flex w-full flex-col items-center rounded-[24px] px-2 py-3 text-center text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-black/10">
                <Bell className="h-5 w-5" />
              </span>
              <span className="mt-2 text-[11px] font-semibold leading-4">Alerts</span>
              <span className="mt-2 inline-flex min-w-7 items-center justify-center rounded-full bg-[#2a453c] px-2 py-0.5 text-[10px] font-semibold text-white">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            </Link>

            <Link
              href={workspaceRoutes.settings}
              className="flex w-full flex-col items-center rounded-[24px] px-2 py-3 text-center text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-black/10">
                <Settings2 className="h-5 w-5" />
              </span>
              <span className="mt-2 text-[11px] font-semibold leading-4">Settings</span>
            </Link>

            <div className="rounded-[26px] border border-white/10 bg-white/5 px-3 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="flex justify-center">
                {profilePictureUrl ? (
                  <img src={profilePictureUrl} alt={profileName} className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8fc7b1,#6e94d5)] text-sm font-semibold text-white">
                    {profileName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <p className="mt-3 truncate text-center text-xs font-semibold">{profileName}</p>
              <p className="mt-1 truncate text-center text-[11px] text-white/55">{profileEmail || "Workspace member"}</p>
            </div>
          </div>
        </aside>

        <section
          style={inboxPanelStyle}
          className={`${mobileView === "conversation" ? "hidden lg:flex" : "flex"} ${leftPanelOpen ? "lg:flex" : "lg:hidden"} min-h-0 w-full max-w-full flex-col overflow-hidden border-r border-[#dfe5dc] bg-[rgba(248,246,240,0.95)] backdrop-blur-sm lg:w-[var(--chat-inbox-width)] lg:flex-shrink-0`}
        >
          <div className="border-b border-[#dfe5dc] px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#718279]">Focused inbox</p>
                <h2 className="mt-2 font-[family:var(--font-display)] text-[1.45rem] font-semibold leading-none text-[#20332d]">
                  Messages
                </h2>
                <p className="mt-2 text-sm text-[#5e6d65]">
                  Calm, fast chat for direct work, groups, and live channels.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowComposerPanel((current) => !current)}
                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
                  showComposerPanel
                    ? "border-[#d2dbd0] bg-white text-[#264338] shadow-[0_16px_30px_rgba(40,63,53,0.08)]"
                    : "border-transparent bg-[#27463b] text-white shadow-[0_16px_30px_rgba(39,70,59,0.22)]"
                }`}
                aria-label={showComposerPanel ? "Hide composer panel" : "Show composer panel"}
              >
                {showComposerPanel ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </button>
            </div>

            <ChatSearchInput className="mt-4 rounded-[22px] px-4 py-3">
              <Search className="h-4.5 w-4.5 text-[#718279]" />
              <input
                value={inboxQuery}
                onChange={(event) => setInboxQuery(event.target.value)}
                placeholder="Search people, groups, channels, and messages"
                className={chatUi.input}
              />
            </ChatSearchInput>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-[22px] border border-[#d9e1d7] bg-white px-3 py-3 shadow-[0_14px_24px_rgba(38,67,56,0.04)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a9890]">Unread</p>
                <p className="mt-1 text-lg font-semibold text-[#1f312a]">{totalUnread}</p>
              </div>
              <div className="rounded-[22px] border border-[#d9e1d7] bg-white px-3 py-3 shadow-[0_14px_24px_rgba(38,67,56,0.04)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a9890]">Pinned</p>
                <p className="mt-1 text-lg font-semibold text-[#1f312a]">{pinnedCount}</p>
              </div>
              <div className="rounded-[22px] border border-[#d9e1d7] bg-white px-3 py-3 shadow-[0_14px_24px_rgba(38,67,56,0.04)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a9890]">Archive</p>
                <p className="mt-1 text-lg font-semibold text-[#1f312a]">{archivedCount}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
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
                      ? "bg-[#27463b] text-white shadow-[0_14px_24px_rgba(39,70,59,0.2)]"
                      : "bg-white text-[#5e6d65] hover:bg-[#eef4ee]"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
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
                      ? "bg-[#e6efe6] text-[#27463b]"
                      : "bg-white text-[#7d8c84] hover:bg-[#f1f5f0]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {recentConversations.length > 0 ? (
              <div className="mt-4 rounded-[22px] border border-[#d9e1d7] bg-white px-3 py-3 shadow-[0_14px_24px_rgba(38,67,56,0.04)]">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a9890]">
                    <Clock3 className="h-3.5 w-3.5" />
                    Recently viewed
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#effaf2] px-2 py-1 text-[10px] font-semibold text-[#287047]">
                    <Eye className="h-3.5 w-3.5" />
                    Live view
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {recentConversations.map((conversation) => {
                    const title = getConversationTitle(conversation);
                    const liveCount = getConversationLiveCount(conversation);
                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => handleSelectConversation(conversation.id)}
                        className="min-w-[150px] rounded-[18px] border border-[#d8e0d6] bg-[#f6f8f3] px-3 py-2 text-left transition hover:bg-white"
                      >
                        <p className="truncate text-xs font-semibold text-[#1f312a]">{title}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#7d8c84]">
                          {liveCount > 0 ? (
                            <>
                              <span className="h-2 w-2 rounded-full bg-[#2fbe62]" />
                              Live {liveCount}
                            </>
                          ) : (
                            getThreadBadgeLabel(conversation.threadType)
                          )}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {debouncedInboxQuery.trim().length >= 2 ? (
              <div className="mt-4 rounded-[22px] border border-[#d9e1d7] bg-white px-3 py-3 shadow-[0_14px_24px_rgba(38,67,56,0.04)]">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a9890]">Global people search</p>
                  {inboxGlobalLoading ? (
                    <span className="text-[10px] font-semibold text-[#7d8c84]">Searching...</span>
                  ) : (
                    <span className="text-[10px] font-semibold text-[#7d8c84]">{inboxGlobalResults.length} found</span>
                  )}
                </div>
                {inboxGlobalResults.length > 0 ? (
                  <div className="space-y-2">
                    {inboxGlobalResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => void handleStartDirectFromUser(user)}
                        className="flex w-full items-center justify-between rounded-[16px] border border-[#d8e0d6] bg-[#f8faf7] px-3 py-2 text-left transition hover:bg-white"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#1f312a]">{normalizeDisplayName(user)}</p>
                          <p className="truncate text-xs text-[#7d8c84]">{user.username || user.email || user.id}</p>
                        </div>
                        <span className="rounded-full bg-[#27463b] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
                          Chat
                        </span>
                      </button>
                    ))}
                  </div>
                ) : inboxGlobalLoading ? null : (
                  <p className="text-xs text-[#7d8c84]">No matching users found in global search.</p>
                )}
              </div>
            ) : null}
          </div>

          {showComposerPanel ? (
            <div className="space-y-4 border-b border-[#dfe5dc] bg-[linear-gradient(180deg,rgba(241,245,240,0.9),rgba(248,246,240,0.78))] px-4 py-4">
              <ChatSectionCard className="rounded-[26px]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a9890]">Quick direct</p>
                    <h3 className="mt-2 text-sm font-semibold text-[#1f312a]">Open a real one-to-one conversation</h3>
                  </div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#eef4ee] text-[#315447]">
                    <Sparkles className="h-4 w-4" />
                  </span>
                </div>

                <ChatSearchInput className="mt-4 bg-[#f6f8f3]">
                  <Search className="h-4 w-4 text-[#7d8c84]" />
                  <input
                    value={directIdentifier}
                    onChange={(event) => setDirectIdentifier(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleStartDirectFromIdentifier();
                      }
                    }}
                    placeholder="Username, email, or user ID"
                    className={chatUi.input}
                  />
                  <ChatPrimaryButton onClick={() => void handleStartDirectFromIdentifier()} className="rounded-full px-3 py-1.5 text-[11px] tracking-[0.12em]">
                    Start
                  </ChatPrimaryButton>
                </ChatSearchInput>
                {directSuggestionsLoading ? (
                  <p className="mt-3 text-xs text-[#6f7f77]">Searching people...</p>
                ) : directSuggestions.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {directSuggestions.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => void handleStartDirectFromUser(user)}
                        className="flex w-full items-center justify-between rounded-[16px] border border-[#d8e0d6] bg-white px-3 py-2 text-left transition hover:bg-[#f8fbf7]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#1f312a]">{normalizeDisplayName(user)}</p>
                          <p className="truncate text-xs text-[#7d8c84]">{user.username || user.email || user.id}</p>
                        </div>
                        <span className="rounded-full bg-[#edf4ec] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#315447]">
                          Open
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </ChatSectionCard>

              <ChatSectionCard className="rounded-[26px]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a9890]">Composer</p>
                    <h3 className="mt-2 text-sm font-semibold text-[#1f312a]">Direct message, group, or channel</h3>
                    <p className="mt-1 text-sm text-[#5e6d65]">Every action below creates a live thread from your current workspace.</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 rounded-[20px] bg-[#f4f7f2] p-1.5">
                  {([
                    { key: "DIRECT", label: "Direct" },
                    { key: "GROUP", label: "Group" },
                    { key: "CHANNEL", label: "Channel" },
                  ] as const).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setComposeMode(item.key)}
                      className={`flex-1 rounded-[16px] px-3 py-2.5 text-xs font-semibold transition ${
                        composeMode === item.key ? "bg-white text-[#21352d] shadow-sm" : "text-[#6d7a73]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 rounded-[22px] border border-[#d8e0d6] bg-[#f6f8f3] p-3">
                  <ChatSearchInput>
                    <Search className="h-4 w-4 text-[#7d8c84]" />
                    <input
                      value={lookupQuery}
                      onChange={(event) => setLookupQuery(event.target.value)}
                      placeholder="Search by name, username, email, or ID"
                      className={chatUi.input}
                    />
                    <ChatPrimaryButton onClick={() => void runLookup()} className="rounded-full px-3 py-1.5 text-[11px] tracking-[0.12em]">
                      {lookupLoading ? "..." : "Find"}
                    </ChatPrimaryButton>
                  </ChatSearchInput>

                  {lookupResults.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {lookupResults.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between gap-3 rounded-[18px] border border-[#d8e0d6] bg-white px-3 py-3"
                        >
                          <button type="button" onClick={() => addSelectedUser(user)} className="min-w-0 flex-1 text-left">
                            <p className="truncate text-sm font-semibold text-[#1f312a]">{normalizeDisplayName(user)}</p>
                            <p className="truncate text-xs text-[#7d8c84]">{user.username || user.email || user.id}</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleStartDirectFromUser(user)}
                            className="rounded-full border border-[#d5ded4] bg-[#f4f7f2] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#315447]"
                          >
                            Open
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {selectedUsers.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 rounded-full border border-[#d5ddd3] bg-[#eef4ee] px-3 py-1.5 text-xs font-medium text-[#315447]"
                      >
                        <span>{normalizeDisplayName(user)}</span>
                        <button
                          type="button"
                          onClick={() => removeSelectedUser(user.id)}
                          className="text-[#6e7d75] transition hover:text-[#1f312a]"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {composeMode !== "DIRECT" ? (
                  <div className="mt-4 space-y-3">
                    <input
                      value={groupName}
                      onChange={(event) => setGroupName(event.target.value)}
                      placeholder={composeMode === "CHANNEL" ? "Channel name" : "Group name"}
                      className="w-full rounded-[18px] border border-[#d8e0d6] bg-[#f6f8f3] px-4 py-3 text-sm text-[#1f312a] outline-none placeholder:text-[#94a198]"
                    />
                    {composeMode === "CHANNEL" ? (
                      <>
                        <textarea
                          value={channelDescription}
                          onChange={(event) => setChannelDescription(event.target.value)}
                          rows={3}
                          placeholder="Describe the purpose of this channel"
                          className="w-full rounded-[18px] border border-[#d8e0d6] bg-[#f6f8f3] px-4 py-3 text-sm text-[#1f312a] outline-none placeholder:text-[#94a198]"
                        />
                        <label className="flex items-center gap-2 rounded-[18px] border border-[#d8e0d6] bg-[#f6f8f3] px-4 py-3 text-sm text-[#42554c]">
                          <input
                            type="checkbox"
                            checked={memberMessagingEnabled}
                            onChange={(event) => setMemberMessagingEnabled(event.target.checked)}
                          />
                          Allow members to post in this channel
                        </label>
                      </>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-4 flex gap-2">
                  <ChatPrimaryButton onClick={() => void handleStartConversation()} className="flex-1">
                    <Plus className="h-4 w-4" />
                    {composeMode === "DIRECT"
                      ? "Open direct"
                      : composeMode === "GROUP"
                        ? "Create group"
                        : "Create channel"}
                  </ChatPrimaryButton>
                  <ChatSecondaryButton onClick={resetComposer} className="bg-[#f6f8f3] text-[#5e6d65]">
                    Clear
                  </ChatSecondaryButton>
                </div>
              </ChatSectionCard>
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-hidden">
            <ConversationList
              conversations={filteredConversations}
              activeId={activeConversationId}
              onSelect={handleSelectConversation}
              resolveTitle={getConversationTitle}
              resolveSubtitle={(conversation) => getThreadBadgeLabel(conversation.threadType)}
              resolveLiveCount={getConversationLiveCount}
              isLoading={isLoading}
            />
          </div>

          <div className="border-t border-[#dfe5dc] bg-white/85 px-4 py-4">
            <div className="rounded-[24px] border border-[#d8e0d6] bg-[linear-gradient(135deg,#f9f7f1,#edf4ef)] px-4 py-4 shadow-[0_18px_28px_rgba(38,67,56,0.05)]">
              <div className="flex items-center gap-3">
                {profilePictureUrl ? (
                  <img src={profilePictureUrl} alt={profileName} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#90c7b2,#6d94d4)] text-sm font-semibold text-white">
                    {profileName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#1f312a]">{profileName}</p>
                  <p className="truncate text-xs text-[#7d8c84]">{profileEmail || "Workspace member"}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  href={workspaceRoutes.settings}
                  className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-[#d8e0d6] bg-white px-3 py-2.5 text-sm font-semibold text-[#315447] transition hover:bg-[#f7faf7]"
                >
                  <Settings2 className="h-4 w-4" />
                  Settings
                </Link>
                <Link
                  href={workspaceRoutes.settingsVerify}
                  className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-[#d8e0d6] bg-white px-3 py-2.5 text-sm font-semibold text-[#315447] transition hover:bg-[#f7faf7]"
                >
                  <Shield className="h-4 w-4" />
                  Verify
                </Link>
              </div>
            </div>
          </div>
        </section>

        {leftPanelOpen ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize conversation sidebar"
            onPointerDown={startPaneResize("inbox")}
            className={`hidden w-2 cursor-col-resize items-center justify-center border-r border-[#dfe5dc] bg-white/80 text-[#9aa69f] transition hover:bg-[#eef4ee] hover:text-[#315447] lg:flex ${
              draggingPane === "inbox" ? "bg-[#e6efe6] text-[#315447]" : ""
            }`}
          >
            <GripVertical className="h-4 w-4" />
          </div>
        ) : null}

        <section
          className={`${mobileView === "conversation" ? "flex" : "hidden lg:flex"} h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-[#e8efe7]`}
        >
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
              onTogglePinned={handleToggleConversationPin}
              onToggleMuted={handleToggleConversationMute}
              onToggleArchived={handleToggleConversationArchive}
              onBack={() => setMobileView("list")}
              onOpenDetails={() => setRightRailOpen(true)}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="grid h-24 w-24 place-items-center rounded-[30px] border border-white/70 bg-white/80 text-[#315447] shadow-[0_24px_48px_rgba(38,67,56,0.08)]">
                <MessageSquare className="h-9 w-9" />
              </div>
              <h2 className="mt-6 font-[family:var(--font-display)] text-3xl font-semibold text-[#1f312a]">
                Open a real conversation
              </h2>
              <p className="mt-3 max-w-[460px] text-sm leading-6 text-[#5e6d65]">
                Choose an existing direct chat, group, or channel from the inbox, or create a new one from the composer panel.
              </p>
              <button
                type="button"
                onClick={handleOpenComposer}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#27463b] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(39,70,59,0.18)] transition hover:bg-[#315447]"
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
              className={`hidden w-2 cursor-col-resize items-center justify-center border-l border-[#dfe5dc] bg-white/80 text-[#9aa69f] transition hover:bg-[#eef4ee] hover:text-[#315447] xl:flex ${
                draggingPane === "details" ? "bg-[#e6efe6] text-[#315447]" : ""
              }`}
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <aside
              style={detailsRailStyle}
              className="hidden flex-shrink-0 overflow-y-auto border-l border-[#dfe5dc] bg-[rgba(248,246,240,0.96)] xl:block xl:w-[var(--chat-details-width)]"
            >
            <div className="flex items-center justify-between border-b border-[#dfe5dc] px-4 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7f8c84]">Context</p>
                <h2 className="mt-2 text-base font-semibold text-[#1f312a]">Conversation details</h2>
              </div>
              <button
                type="button"
                onClick={() => setRightRailOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d8e0d6] bg-white text-[#315447] transition hover:bg-[#f7faf7]"
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
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[1px] xl:hidden">
          <div className="ml-auto h-full w-full max-w-[420px] overflow-y-auto bg-[rgba(248,246,240,0.98)] shadow-[0_28px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-[#dfe5dc] bg-white px-4 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7f8c84]">Context</p>
                <h2 className="mt-2 text-base font-semibold text-[#1f312a]">Conversation details</h2>
              </div>
              <button
                type="button"
                onClick={() => setRightRailOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d8e0d6] bg-[#f6f8f3] text-[#315447]"
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
  );
}
