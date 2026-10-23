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
import { toast } from "sonner";
import { ChatConversation } from "@/components/chat/ChatConversation";
import { ConversationDetailsRail } from "@/components/chat/ConversationDetailsRail";
import { ConversationList } from "@/components/chat/ConversationList";
import { getThreadBadgeLabel, formatRelativeActivity } from "@/components/chat/chat-helpers";
import { useMessageAssets } from "@/components/chat/useMessageAssets";
import {
  type AppUser,
  type ChatThread,
} from "@/lib/api";
import { useSession } from "@/lib/session";
import { useChatStore } from "@/lib/chatStore";
import { useDebounce } from "@/lib/useDebounce";
import { workspaceRoutes } from "@/lib/workspace-routes";

type ThreadFilter = "ALL" | "DIRECT" | "GROUP" | "CHANNEL";
type MailboxView = "INBOX" | "DIRECTORY" | "PINNED" | "ARCHIVED" | "CREATE_THREAD";

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
  const [userNotFound, setUserNotFound] = useState(false);
  
  const [newThreadType, setNewThreadType] = useState<"GROUP" | "CHANNEL">("GROUP");
  const [newThreadName, setNewThreadName] = useState("");
  const [newThreadDescription, setNewThreadDescription] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [isSubmittingNewThread, setIsSubmittingNewThread] = useState(false);

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
      setUserNotFound(false);
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
      setUserNotFound(false);
      return;
    }

    const userId = searchParams.get("user") || searchParams.get("employer");
    if (!userId) {
      return;
    }

    void ensureDirectThread(userId).then((thread) => {
      setActiveConversation(thread.id);
      setMobileView("conversation");
      setUserNotFound(false);
    }).catch((err) => {
      console.error("Failed to resolve chat user:", err);
      setActiveConversation(null);
      setUserNotFound(true);
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
    setUserNotFound(false);
  };

  const handleStartDirect = async (userId: string) => {
    try {
      const thread = await ensureDirectThread(userId);
      setActiveConversation(thread.id);
      setMobileView("conversation");
      setMailboxView("INBOX");
      setUserNotFound(false);
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

  const handleCreateThread = async () => {
    if (!newThreadName.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (selectedParticipants.size === 0) {
      toast.error("Please select at least one participant");
      return;
    }

    const nameLower = newThreadName.trim().toLowerCase();
    const selectedIdsSorted = Array.from(selectedParticipants).sort();

    // Check if a thread with same type, name and participants already exists
    const existing = conversations.find(c => {
      if ((c.threadType ?? "GROUP") !== newThreadType) return false;
      if (c.groupName?.trim().toLowerCase() !== nameLower) return false;
      
      const currentIdsSorted = [...(c.participantIds || [])].sort();
      return JSON.stringify(currentIdsSorted) === JSON.stringify(selectedIdsSorted);
    });

    if (existing) {
      toast.info(`Joining existing ${newThreadType === "GROUP" ? "group" : "channel"}: ${existing.groupName}`);
      setActiveConversation(existing.id);
      setMailboxView("INBOX");
      setMobileView("conversation");
      // Reset form
      setNewThreadName("");
      setNewThreadDescription("");
      setSelectedParticipants(new Set());
      return;
    }

    setIsSubmittingNewThread(true);
    try {
      const thread = await createManagedThread({
        threadType: newThreadType,
        groupName: newThreadName.trim(),
        channelDescription: newThreadDescription.trim(),
        participantIds: Array.from(selectedParticipants),
      });
      toast.success(`${newThreadType === "GROUP" ? "Group" : "Channel"} established`);
      setActiveConversation(thread.id);
      setMailboxView("INBOX");
      setMobileView("conversation");
      // Reset form
      setNewThreadName("");
      setNewThreadDescription("");
      setSelectedParticipants(new Set());
    } catch (error) {
      toast.error("Failed to establish signal");
    } finally {
      setIsSubmittingNewThread(false);
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
    <div className="relative h-[calc(100dvh-6rem)] overflow-y-auto custom-scrollbar" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
      <div className="relative z-10 flex flex-col gap-4 p-3 lg:p-6">
        <div className="relative flex h-[calc(100dvh-12rem)] min-h-[600px] overflow-hidden rounded-[2.5rem] backdrop-blur-3xl shadow-2xl chat-main-card">
          
          <section
            style={{ width: `${inboxWidth}px` }}
            className={`${mobileView === "conversation" ? "hidden lg:flex" : "flex"} flex-col min-h-0 shrink-0 transition-all duration-300 h-full chat-inbox-panel`}
          >
            <div className="p-6 border-b border-white/10 bg-black/20 shrink-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Inbox</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setMailboxView("CREATE_THREAD")}
                    className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-95 shadow-lg border border-emerald-500/20"
                    title="Create Group/Channel"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => setMailboxView("DIRECTORY")}
                    className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all active:scale-95 shadow-lg border border-indigo-500/20"
                    title="Directory"
                  >
                    <UserPlus className="h-5 w-5" />
                  </button>
                </div>
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
              {mailboxView === "CREATE_THREAD" ? (
                <div className="p-6 space-y-6">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setNewThreadType("GROUP")}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        newThreadType === "GROUP" ? "bg-indigo-600 text-white border-indigo-400" : "bg-white/5 text-slate-400 border-white/5"
                      }`}
                    >
                      New Group
                    </button>
                    <button 
                      onClick={() => setNewThreadType("CHANNEL")}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        newThreadType === "CHANNEL" ? "bg-cyan-600 text-white border-cyan-400" : "bg-white/5 text-slate-400 border-white/5"
                      }`}
                    >
                      New Channel
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Signal Name</label>
                      <input 
                        value={newThreadName}
                        onChange={e => setNewThreadName(e.target.value)}
                        placeholder={newThreadType === "GROUP" ? "Tactical group name..." : "Channel broadcast name..."}
                        className="w-full h-12 rounded-xl bg-black/30 border border-white/10 px-4 text-sm outline-none focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                    {newThreadType === "CHANNEL" && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mission Description</label>
                        <textarea 
                          value={newThreadDescription}
                          onChange={e => setNewThreadDescription(e.target.value)}
                          placeholder="What is this channel for?"
                          className="w-full h-24 rounded-xl bg-black/30 border border-white/10 p-4 text-sm outline-none focus:border-indigo-500/50 transition-all resize-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Select Operatives ({selectedParticipants.size})</label>
                    <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                      {Object.values(directory).map(user => {
                        if (user.id === currentUserId) return null;
                        const isSelected = selectedParticipants.has(user.id);
                        return (
                          <button 
                            key={user.id}
                            onClick={() => {
                              const next = new Set(selectedParticipants);
                              if (isSelected) next.delete(user.id); else next.add(user.id);
                              setSelectedParticipants(next);
                            }}
                            className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all text-left border ${
                              isSelected ? "bg-indigo-500/10 border-indigo-500/30" : "bg-transparent border-transparent hover:bg-white/5"
                            }`}
                          >
                            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center font-black text-xs text-white">
                              {user.label.slice(0, 1)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-white truncate">{user.label}</p>
                            </div>
                            <div className={`h-4 w-4 rounded border transition-all flex items-center justify-center ${
                              isSelected ? "bg-indigo-500 border-indigo-500" : "bg-transparent border-white/20"
                            }`}>
                              {isSelected && <X className="h-3 w-3 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex gap-3">
                    <button 
                      onClick={() => setMailboxView("INBOX")}
                      className="flex-1 py-4 rounded-xl bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Abort
                    </button>
                    <button 
                      onClick={handleCreateThread}
                      disabled={isSubmittingNewThread}
                      className="flex-[2] py-4 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-500 transition-all disabled:opacity-50"
                    >
                      {isSubmittingNewThread ? "Processing..." : "Establish Signal"}
                    </button>
                  </div>
                </div>
              ) : mailboxView === "DIRECTORY" ? (
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
            ) : userNotFound ? (
              <div className="flex-1 flex flex-col items-center justify-center p-16 text-center">
                <div className="h-32 w-32 rounded-[40px] bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-400 mb-10 shadow-[0_0_50px_rgba(239,68,68,0.1)] relative">
                  <div className="absolute inset-0 bg-red-400/20 blur-3xl rounded-full" />
                  <ShieldRoundedIcon className="h-14 w-14 relative z-10" />
                </div>
                <h3 className="text-4xl font-black tracking-tight text-white mb-6 uppercase">Target Not Found</h3>
                <p className="max-w-md text-slate-400 leading-relaxed font-bold text-sm uppercase tracking-widest opacity-60">
                  Secure connection failed. We could not locate the requested operative in the workspace database.
                </p>
                <button 
                  onClick={() => { setUserNotFound(false); setMailboxView("DIRECTORY"); }}
                  className="mt-12 px-10 py-4 rounded-2xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-500 hover:shadow-indigo-500/20 transition-all active:scale-95 border border-indigo-400/30"
                >
                  Browse Workspace Directory
                </button>
              </div>
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
