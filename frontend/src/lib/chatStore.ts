"use client";

import { create } from 'zustand';
import {
  addThreadParticipants,
  type AppNotification,
  createThread,
  clearPinnedThreadMessage,
  deleteChatMessage,
  forwardChatMessage,
  listDirectoryUsers,
  listMessages,
  listThreads,
  markThreadRead,
  me,
  pinThreadMessage,
  removeThreadParticipant,
  sendMessage as sendMessageApi,
  toggleChatMessageReaction,
  updateChatMessage,
  updateThreadPreferences as updateThreadPreferencesApi,
  updateThread as updateThreadApi,
  type ChatMessage,
  type ChatThread,
} from './api';
import {
  connectWs,
  sendThreadTyping,
  subscribeThread,
  subscribeThreadTyping,
  subscribeUserNotifications,
  type Subscription,
} from './ws';
import { isAuthenticated } from './auth';

type DirectoryEntry = {
  id: string;
  label: string;
  fullName?: string;
  username?: string;
  email?: string;
  online: boolean;
};

type MessageType = ChatMessage['type'];

type SendThreadMessageInput = {
  type: MessageType;
  text?: string;
  assetId?: string;
  replyToMessageId?: string | null;
};

type ThreadSubscriptions = {
  message?: Subscription;
  typing?: Subscription;
};

let chatNotificationSubscription: Subscription | null = null;
const typingResetTimers = new Map<string, number>();

interface ChatStore {
  conversations: ChatThread[];
  messages: Record<string, ChatMessage[]>;
  typingUsers: Record<string, Set<string>>;
  unreadCounts: Record<string, number>;
  currentUserId: string | null;
  currentUserName: string;
  directory: Record<string, DirectoryEntry>;
  subscriptions: Record<string, ThreadSubscriptions>;
  activeConversationId: string | null;
  isLoading: boolean;

  bootstrapCurrentUser: () => Promise<void>;
  connectRealtime: () => Promise<void>;
  refreshDirectory: () => Promise<void>;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, type?: MessageType, options?: { replyToMessageId?: string | null }) => Promise<void>;
  sendAssetMessage: (conversationId: string, assetId: string) => Promise<void>;
  announceTyping: (conversationId: string, isTyping: boolean) => Promise<void>;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  markRead: (conversationId: string) => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
  ensureDirectThread: (otherUserId: string) => Promise<ChatThread>;
  createManagedThread: (input: {
    participantIds: string[];
    threadType: 'GROUP' | 'CHANNEL';
    groupName: string;
    channelDescription?: string;
    memberMessagingEnabled?: boolean;
  }) => Promise<ChatThread>;
  updateThread: (conversationId: string, input: {
    groupName?: string;
    channelDescription?: string;
    memberMessagingEnabled?: boolean;
  }) => Promise<ChatThread>;
  addParticipants: (conversationId: string, participantIds: string[]) => Promise<ChatThread>;
  removeParticipant: (conversationId: string, participantId: string) => Promise<ChatThread>;
  editMessage: (conversationId: string, messageId: string, text: string) => Promise<ChatMessage>;
  deleteMessage: (conversationId: string, messageId: string, forEveryone?: boolean) => Promise<ChatMessage>;
  forwardMessage: (conversationId: string, messageId: string) => Promise<ChatMessage>;
  pinMessage: (conversationId: string, messageId: string | null) => Promise<ChatThread>;
  updatePreferences: (conversationId: string, input: { pinned?: boolean; muted?: boolean; archived?: boolean }) => Promise<ChatThread>;
  toggleReaction: (conversationId: string, messageId: string, emoji: string) => Promise<ChatMessage>;
  subscribeToConversation: (conversationId: string) => Promise<void>;
  getDisplayName: (userId?: string | null) => string;
  getConversationTitle: (conversation?: ChatThread) => string;
  getConversationSubtitle: (conversation?: ChatThread) => string;
  getTotalUnread: () => number;
}

function makeDirectThreadKey(participantIds: string[]) {
  return [...participantIds].sort().join('__');
}

function toUnreadMap(threads: ChatThread[]) {
  const unreadCounts: Record<string, number> = {};
  threads.forEach((thread) => {
    unreadCounts[thread.id] = Math.max(0, Number(thread.unreadCount ?? 0));
  });
  return unreadCounts;
}

function sortConversations(threads: ChatThread[]) {
  return [...threads].sort((left, right) => {
    if (Boolean(left.pinned) !== Boolean(right.pinned)) {
      return left.pinned ? -1 : 1;
    }
    const leftTime = left.lastMessageAt ? Date.parse(left.lastMessageAt) : 0;
    const rightTime = right.lastMessageAt ? Date.parse(right.lastMessageAt) : 0;
    return rightTime - leftTime;
  });
}

function upsertConversationMessage(messages: ChatMessage[], incoming: ChatMessage) {
  const index = messages.findIndex((message) => message.id === incoming.id);
  if (index === -1) {
    return [...messages, incoming];
  }
  const next = [...messages];
  next[index] = incoming;
  return next;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  messages: {},
  typingUsers: {},
  unreadCounts: {},
  currentUserId: null,
  currentUserName: 'You',
  directory: {},
  subscriptions: {},
  activeConversationId: null,
  isLoading: false,

  bootstrapCurrentUser: async () => {
    if (get().currentUserId) {
      return;
    }

    if (!isAuthenticated()) {
      return;
    }

    try {
      const profile = await me();
      set({
        currentUserId: profile.id,
        currentUserName: profile.fullName?.trim() || profile.username?.trim() || 'You',
      });
    } catch (error) {
      console.warn('Failed to bootstrap current user:', error);
    }
  },

  connectRealtime: async () => {
    if (!isAuthenticated()) {
      return;
    }
    await get().bootstrapCurrentUser();
    if (!get().currentUserId) {
      return;
    }
    await connectWs();

    if (!chatNotificationSubscription) {
      chatNotificationSubscription = subscribeUserNotifications((rawBody) => {
        const notification = rawBody as Partial<AppNotification>;
        const type = typeof notification.type === 'string' ? notification.type : '';
        const payload = notification.payload && typeof notification.payload === 'object'
          ? notification.payload as Record<string, unknown>
          : {};
        const threadId = typeof payload.threadId === 'string' ? payload.threadId : '';

        if (!threadId || (type !== 'CHAT_MESSAGE' && type !== 'CONTACT')) {
          return;
        }

        const knowsThread = get().conversations.some((conversation) => conversation.id === threadId);
        if (!get().subscriptions[threadId]) {
          void get().subscribeToConversation(threadId);
        }
        if (!knowsThread || type === 'CONTACT') {
          void get().fetchConversations();
        }
      });
    }
  },

  refreshDirectory: async () => {
    if (!isAuthenticated()) {
      return;
    }
    const { users } = await listDirectoryUsers(250).catch(() => ({ users: [] }));
    if (!Array.isArray(users) || users.length === 0) {
      return;
    }

    const directory: Record<string, DirectoryEntry> = {};
    users.forEach((user) => {
      if (!user.id) {
        return;
      }
      directory[user.id] = {
        id: user.id,
        label: user.fullName?.trim() || user.username?.trim() || user.email?.trim() || `User ${user.id.slice(0, 6)}`,
        fullName: user.fullName?.trim() || undefined,
        username: user.username?.trim() || undefined,
        email: user.email?.trim() || undefined,
        online: Boolean(user.online),
      };
    });

    set((state) => ({ directory: { ...state.directory, ...directory } }));
  },

  fetchConversations: async () => {
    if (!isAuthenticated()) {
      return;
    }
    set({ isLoading: true });
    await get().bootstrapCurrentUser();
    if (!get().currentUserId) {
      set({ isLoading: false });
      return;
    }
    await get().connectRealtime();

    const [threads] = await Promise.all([
      listThreads().catch(() => [] as ChatThread[]),
      get().refreshDirectory(),
    ]);

    const sorted = sortConversations(threads);

    set({
      conversations: sorted,
      unreadCounts: toUnreadMap(sorted),
      isLoading: false,
    });

    sorted.forEach((thread) => {
      void get().subscribeToConversation(thread.id);
    });
  },

  fetchMessages: async (conversationId) => {
    set({ isLoading: true });
    const [threadMessages] = await Promise.all([
      listMessages(conversationId).catch(() => [] as ChatMessage[]),
      get().subscribeToConversation(conversationId),
    ]);

    set((state) => ({
      messages: { ...state.messages, [conversationId]: threadMessages },
      isLoading: false,
    }));

    await get().markRead(conversationId);
  },

  sendMessage: async (conversationId, content, type = 'TEXT', options) => {
    const text = content.trim();
    if (!text) {
      return;
    }

    const payload: SendThreadMessageInput = type === 'ASSET'
      ? { type: 'ASSET', assetId: text, replyToMessageId: options?.replyToMessageId ?? null }
      : { type: 'TEXT', text, replyToMessageId: options?.replyToMessageId ?? null };

    const saved = await sendMessageApi(conversationId, payload);
    void get().announceTyping(conversationId, false);

    const thread = get().conversations.find(c => c.id === conversationId);
    const isAiThread = thread?.participantIds?.includes('ai-assistant');

    if (isAiThread && type === 'TEXT') {
      setTimeout(async () => {
        try {
          const aiResponse = await sendMessageApi(conversationId, {
            type: 'TEXT',
            text: `I've analyzed your message: "${text}". As your SabaHub AI Assistant, I'm here to help you optimize your workspace and find the best opportunities. How else can I assist you today?`,
            replyToMessageId: saved.id
          });
          set((state) => ({
            messages: {
              ...state.messages,
              [conversationId]: [...(state.messages[conversationId] || []), aiResponse],
            },
          }));
        } catch (e) {
          console.error("AI Assistant failed to respond", e);
        }
      }, 1500);
    }

    set((state) => {
      const existing = state.messages[conversationId] ?? [];
      const existingIds = new Set(existing.map((message) => message.id));
      const nextMessages = existingIds.has(saved.id) ? existing : [...existing, saved];

      const nextConversations = state.conversations
        .map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                lastMessageAt: saved.createdAt,
                lastMessage: saved.type === 'ASSET' ? '[Attachment]' : (saved.text ?? ''),
                lastMessageSenderId: saved.senderId,
              }
            : conversation
        );

      return {
        messages: { ...state.messages, [conversationId]: nextMessages },
        conversations: sortConversations(nextConversations),
      };
    });
  },

  sendAssetMessage: async (conversationId, assetId) => {
    if (!assetId.trim()) {
      return;
    }

    const saved = await sendMessageApi(conversationId, { type: 'ASSET', assetId: assetId.trim() });
    void get().announceTyping(conversationId, false);
    set((state) => {
      const existing = state.messages[conversationId] ?? [];
      const existingIds = new Set(existing.map((message) => message.id));
      const nextMessages = existingIds.has(saved.id) ? existing : [...existing, saved];
      const nextConversations = state.conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              lastMessageAt: saved.createdAt,
              lastMessage: '[Attachment]',
              lastMessageSenderId: saved.senderId,
            }
          : conversation,
      );

      return {
        messages: { ...state.messages, [conversationId]: nextMessages },
        conversations: sortConversations(nextConversations),
      };
    });
  },

  announceTyping: async (conversationId, isTyping) => {
    if (!conversationId) {
      return;
    }

    await get().connectRealtime();
    sendThreadTyping(conversationId, { typing: isTyping });
  },

  setTyping: (conversationId, userId, isTyping) => {
    set((state) => {
      const current = new Set(state.typingUsers[conversationId] ?? []);
      if (isTyping) current.add(userId); else current.delete(userId);
      return { typingUsers: { ...state.typingUsers, [conversationId]: current } };
    });
  },

  markRead: async (conversationId) => {
    const summary = await markThreadRead(conversationId).catch(() => null);

    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [conversationId]: 0 },
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, unreadCount: 0, ...(summary ? { lastMessageAt: summary.lastMessageAt, lastMessage: summary.lastMessage, lastMessageSenderId: summary.lastMessageSenderId } : {}) }
          : c
      ),
    }));
  },

  setActiveConversation: (conversationId) => {
    set({ activeConversationId: conversationId });
    if (conversationId) {
      void get().markRead(conversationId);
      void get().subscribeToConversation(conversationId);
    }
  },

  ensureDirectThread: async (otherUserId) => {
    await get().bootstrapCurrentUser();
    const meId = get().currentUserId;
    if (!meId) {
      throw new Error('Unable to resolve current user for chat.');
    }

    const expectedKey = makeDirectThreadKey([meId, otherUserId]);
    const existing = get().conversations.find((thread) => {
      if ((thread.threadType ?? 'DIRECT') !== 'DIRECT') {
        return false;
      }
      return makeDirectThreadKey(thread.participantIds ?? []) === expectedKey;
    });

    if (existing) {
      return existing;
    }

    const created = await createThread({
      participantIds: [otherUserId],
      threadType: 'DIRECT',
    });

    set((state) => {
      const alreadyPresent = state.conversations.some((thread) => thread.id === created.id);
      if (alreadyPresent) {
        return state;
      }

      const nextConversations = [created, ...state.conversations].sort((left, right) => {
        const leftTime = left.lastMessageAt ? Date.parse(left.lastMessageAt) : 0;
        const rightTime = right.lastMessageAt ? Date.parse(right.lastMessageAt) : 0;
        return rightTime - leftTime;
      });

      return {
        conversations: nextConversations,
        unreadCounts: { ...state.unreadCounts, [created.id]: Math.max(0, Number(created.unreadCount ?? 0)) },
      };
    });

    void get().subscribeToConversation(created.id);

    return created;
  },

  createManagedThread: async (input) => {
    const created = await createThread(input);
    set((state) => ({
      conversations: sortConversations([created, ...state.conversations.filter((thread) => thread.id !== created.id)]),
      unreadCounts: { ...state.unreadCounts, [created.id]: Math.max(0, Number(created.unreadCount ?? 0)) },
    }));
    void get().subscribeToConversation(created.id);
    return created;
  },

  updateThread: async (conversationId, input) => {
    const updated = await updateThreadApi(conversationId, input);
    set((state) => ({
      conversations: sortConversations(
        state.conversations.map((conversation) => (conversation.id === conversationId ? { ...conversation, ...updated } : conversation)),
      ),
    }));
    return updated;
  },

  addParticipants: async (conversationId, participantIds) => {
    const updated = await addThreadParticipants(conversationId, participantIds);
    set((state) => ({
      conversations: sortConversations(
        state.conversations.map((conversation) => (conversation.id === conversationId ? { ...conversation, ...updated } : conversation)),
      ),
    }));
    void get().refreshDirectory();
    return updated;
  },

  removeParticipant: async (conversationId, participantId) => {
    const updated = await removeThreadParticipant(conversationId, participantId);
    set((state) => ({
      conversations: sortConversations(
        state.conversations.map((conversation) => (conversation.id === conversationId ? { ...conversation, ...updated } : conversation)),
      ),
      activeConversationId: state.activeConversationId === conversationId && !updated.participantIds.includes(state.currentUserId ?? '')
        ? null
        : state.activeConversationId,
    }));
    return updated;
  },

  editMessage: async (conversationId, messageId, text) => {
    const updated = await updateChatMessage(conversationId, messageId, { text, type: 'TEXT' });
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).map((message) => (message.id === messageId ? updated : message)),
      },
    }));
    return updated;
  },

  deleteMessage: async (conversationId, messageId, forEveryone = true) => {
    const updated = await deleteChatMessage(conversationId, messageId, forEveryone);
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).map((message) => (message.id === messageId ? updated : message)),
      },
      conversations: sortConversations(
        state.conversations.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, lastMessage: conversation.lastMessageSenderId === updated.senderId ? (updated.text ?? conversation.lastMessage) : conversation.lastMessage }
            : conversation,
        ),
      ),
    }));
    return updated;
  },

  forwardMessage: async (conversationId, messageId) => {
    const saved = await forwardChatMessage(conversationId, messageId);
    set((state) => ({
      messages: { ...state.messages, [conversationId]: [...(state.messages[conversationId] ?? []), saved] },
      conversations: sortConversations(
        state.conversations.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, lastMessageAt: saved.createdAt, lastMessage: saved.type === 'ASSET' ? '[Attachment]' : (saved.text ?? ''), lastMessageSenderId: saved.senderId }
            : conversation,
        ),
      ),
    }));
    return saved;
  },

  pinMessage: async (conversationId, messageId) => {
    const updated = messageId ? await pinThreadMessage(conversationId, messageId) : await clearPinnedThreadMessage(conversationId);
    set((state) => ({
      conversations: sortConversations(
        state.conversations.map((conversation) => (conversation.id === conversationId ? { ...conversation, ...updated } : conversation)),
      ),
    }));
    return updated;
  },

  updatePreferences: async (conversationId, input) => {
    const updated = await updateThreadPreferencesApi(conversationId, input);
    set((state) => ({
      conversations: sortConversations(
        state.conversations.map((conversation) => (conversation.id === conversationId ? { ...conversation, ...updated } : conversation)),
      ),
      activeConversationId: updated.archived && state.activeConversationId === conversationId ? null : state.activeConversationId,
    }));
    return updated;
  },

  toggleReaction: async (conversationId, messageId, emoji) => {
    const updated = await toggleChatMessageReaction(conversationId, messageId, emoji);
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: upsertConversationMessage(state.messages[conversationId] ?? [], updated),
      },
    }));
    return updated;
  },

  subscribeToConversation: async (conversationId) => {
    if (!conversationId || get().subscriptions[conversationId]) {
      return;
    }

    await get().connectRealtime();

    const messageSubscription = subscribeThread(conversationId, (rawBody) => {
      const incoming = rawBody as ChatMessage;
      if (!incoming?.id || incoming.threadId !== conversationId) {
        return;
      }

      set((state) => {
        const existing = state.messages[conversationId] ?? [];
        const alreadyPresent = existing.some((message) => message.id === incoming.id);

        const isActive = state.activeConversationId === conversationId;
        const unreadDelta = alreadyPresent || isActive || incoming.senderId === state.currentUserId ? 0 : 1;
        const currentUnread = Math.max(0, Number(state.unreadCounts[conversationId] ?? 0));
        const nextUnread = currentUnread + unreadDelta;

        return {
          messages: { ...state.messages, [conversationId]: upsertConversationMessage(existing, incoming) },
          unreadCounts: { ...state.unreadCounts, [conversationId]: nextUnread },
          conversations: sortConversations(state.conversations
            .map((thread) =>
              thread.id === conversationId
                ? {
                    ...thread,
                    unreadCount: nextUnread,
                    lastMessageAt: incoming.createdAt,
                    lastMessage: incoming.type === 'ASSET' ? '[Attachment]' : (incoming.text ?? ''),
                    lastMessageSenderId: incoming.senderId,
                  }
                : thread
            )),
        };
      });
    });

    const typingSubscription = subscribeThreadTyping(conversationId, (rawBody) => {
      const incoming = rawBody as {
        threadId?: string;
        userId?: string;
        typing?: boolean;
      };

      if (!incoming.threadId || incoming.threadId !== conversationId || !incoming.userId) {
        return;
      }

      if (incoming.userId === get().currentUserId) {
        return;
      }

      const timerKey = `${conversationId}:${incoming.userId}`;
      const existingTimer = typingResetTimers.get(timerKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
        typingResetTimers.delete(timerKey);
      }

      get().setTyping(conversationId, incoming.userId, Boolean(incoming.typing));

      if (incoming.typing && typeof window !== 'undefined') {
        const timeoutId = window.setTimeout(() => {
          typingResetTimers.delete(timerKey);
          useChatStore.getState().setTyping(conversationId, incoming.userId as string, false);
        }, 3000);
        typingResetTimers.set(timerKey, timeoutId);
      }
    });

    if (!messageSubscription && !typingSubscription) {
      return;
    }

    set((state) => ({
      subscriptions: {
        ...state.subscriptions,
        [conversationId]: {
          message: messageSubscription ?? undefined,
          typing: typingSubscription ?? undefined,
        },
      },
    }));
  },

  getDisplayName: (userId) => {
    if (!userId) {
      return 'Unknown user';
    }

    const state = get();
    if (state.currentUserId && userId === state.currentUserId) {
      return state.currentUserName;
    }

    return state.directory[userId]?.label || `User ${userId.slice(0, 8)}`;
  },

  getConversationTitle: (conversation) => {
    if (!conversation) {
      return 'Chat';
    }

    const type = conversation.threadType ?? 'DIRECT';
    if (type === 'GROUP' || type === 'CHANNEL') {
      return conversation.groupName?.trim() || (type === 'CHANNEL' ? 'Untitled channel' : 'Untitled group');
    }

    const meId = get().currentUserId;
    const otherId = (conversation.participantIds ?? []).find((participantId) => participantId !== meId) || conversation.participantIds?.[0];
    return get().getDisplayName(otherId);
  },

  getConversationSubtitle: (conversation) => {
    if (!conversation) {
      return 'Direct message';
    }

    const type = conversation.threadType ?? 'DIRECT';
    if (type === 'CHANNEL') {
      return 'Channel';
    }
    if (type === 'GROUP') {
      return 'Group chat';
    }
    return 'Direct message';
  },

  getTotalUnread: () => {
    return Object.values(get().unreadCounts).reduce((sum, n) => sum + n, 0);
  },
}));
