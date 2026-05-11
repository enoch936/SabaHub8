package com.sabahub.service;

import com.sabahub.domain.ChatMessage;
import com.sabahub.domain.ChatThread;
import com.sabahub.domain.User;
import com.sabahub.repository.AssetRepository;
import com.sabahub.repository.ChatMessageRepository;
import com.sabahub.repository.ChatThreadRepository;
import com.sabahub.repository.UserRepository;
import com.sabahub.web.dto.ChatTypingEventDTO;
import com.sabahub.web.dto.ChatThreadSummaryDTO;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class ChatService {

    private static final String CALL_INVITE_PREFIX = "[sabahub-call]";

    private static final Comparator<ChatThread> THREAD_ACTIVITY_COMPARATOR =
            Comparator.comparing(ChatThread::getLastMessageAt, Comparator.nullsLast(Comparator.naturalOrder()))
                    .reversed()
                    .thenComparing(ChatThread::getId, Comparator.nullsLast(Comparator.naturalOrder()));

    private final ChatThreadRepository threadRepository;
    private final ChatMessageRepository messageRepository;
    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final AssetRepository assetRepository;
    private final NotificationService notificationService;
    private final ChatPresenceService chatPresenceService;

    public ChatService(ChatThreadRepository threadRepository,
                       ChatMessageRepository messageRepository,
                       CurrentUserService currentUserService,
                       UserRepository userRepository,
                       AssetRepository assetRepository,
                       NotificationService notificationService,
                       ChatPresenceService chatPresenceService) {
        this.threadRepository = threadRepository;
        this.messageRepository = messageRepository;
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
        this.assetRepository = assetRepository;
        this.notificationService = notificationService;
        this.chatPresenceService = chatPresenceService;
    }

    public List<ChatThreadSummaryDTO> listMyThreads() {
        User me = currentUserService.requireUser();
        return normalizeThreadsForUser(me.getId()).stream()
                .sorted((left, right) -> {
                    boolean leftPinned = containsUserId(left.getPinnedByUserIds(), me.getId());
                    boolean rightPinned = containsUserId(right.getPinnedByUserIds(), me.getId());
                    if (leftPinned != rightPinned) {
                        return leftPinned ? -1 : 1;
                    }
                    return THREAD_ACTIVITY_COMPARATOR.compare(left, right);
                })
                .map(thread -> toSummary(thread, me.getId()))
                .toList();
    }

    public ChatThreadSummaryDTO createThread(List<String> participantIds,
                                             String requestedType,
                                             String groupName,
                                             String channelDescription,
                                             Boolean memberMessagingEnabled) {
        User me = currentUserService.requireUser();
        chatPresenceService.touchUser(me.getId());

        ChatThread.Type explicitType = parseThreadType(requestedType);
        if ((participantIds == null || participantIds.isEmpty()) && explicitType != ChatThread.Type.CHANNEL) {
            throw new IllegalArgumentException("participantIds required");
        }

        List<String> resolvedParticipantIds = resolveParticipantIds(participantIds, me, explicitType == ChatThread.Type.CHANNEL);
        ChatThread.Type threadType = determineThreadType(explicitType, resolvedParticipantIds.size());

        if (threadType == ChatThread.Type.DIRECT) {
            ChatThread existingDirectThread = findExistingDirectThread(resolvedParticipantIds);
            if (existingDirectThread != null) {
                return toSummary(existingDirectThread, me.getId());
            }
        }

        ChatThread thread = new ChatThread();
        thread.setParticipantIds(resolvedParticipantIds);
        thread.setType(threadType);
        thread.setGroupName(isNamedThread(threadType) ? normalizeConversationName(groupName, threadType) : null);
        thread.setChannelDescription(threadType == ChatThread.Type.CHANNEL ? normalizeChannelDescription(channelDescription) : null);
        thread.setOwnerUserId(isNamedThread(threadType) ? me.getId() : null);
        thread.setMemberMessagingEnabled(threadType == ChatThread.Type.CHANNEL ? Boolean.TRUE.equals(memberMessagingEnabled) : null);
        thread.setLastMessageAt(Instant.now());
        thread.setLastReadAtByUser(new HashMap<>(Map.of(me.getId(), Instant.now())));
        ChatThread saved = threadRepository.save(thread);

        for (String participantId : resolvedParticipantIds) {
            if (!participantId.equals(me.getId())) {
                notificationService.notifyChatThreadCreated(participantId, saved.getId(), me.getId());
            }
        }

        return toSummary(saved, me.getId());
    }

    public List<ChatMessage> listMessages(String threadId) {
        User me = currentUserService.requireUser();
        chatPresenceService.touchUser(me.getId());
        ChatThread thread = resolveThread(threadId);

        if (!isParticipantOrAdmin(me, thread)) {
            throw new IllegalStateException("Forbidden");
        }

        markThreadReadInternal(thread, me.getId());
        return messageRepository.findByThreadIdOrderByCreatedAtAsc(thread.getId());
    }

    public ChatThreadSummaryDTO markThreadRead(String threadId) {
        User me = currentUserService.requireUser();
        chatPresenceService.touchUser(me.getId());
        ChatThread thread = resolveThread(threadId);

        if (!isParticipantOrAdmin(me, thread)) {
            throw new IllegalStateException("Forbidden");
        }

        markThreadReadInternal(thread, me.getId());
        return toSummary(thread, me.getId());
    }

    public ChatThreadSummaryDTO updateThread(String threadId,
                                             String groupName,
                                             String channelDescription,
                                             Boolean memberMessagingEnabled) {
        User me = currentUserService.requireUser();
        chatPresenceService.touchUser(me.getId());
        ChatThread thread = resolveThread(threadId);
        requireThreadManager(me, thread);

        ChatThread.Type threadType = resolveThreadType(thread);
        if (!isNamedThread(threadType)) {
            throw new IllegalArgumentException("Direct chats cannot be renamed or reconfigured");
        }

        thread.setGroupName(normalizeConversationName(groupName, threadType));
        if (threadType == ChatThread.Type.CHANNEL) {
            thread.setChannelDescription(normalizeChannelDescription(channelDescription));
            if (memberMessagingEnabled != null) {
                thread.setMemberMessagingEnabled(memberMessagingEnabled);
            }
        }

        ChatThread saved = threadRepository.save(thread);
        return toSummary(saved, me.getId());
    }

    public ChatThreadSummaryDTO addParticipants(String threadId, List<String> participantIds) {
        User me = currentUserService.requireUser();
        chatPresenceService.touchUser(me.getId());
        ChatThread thread = resolveThread(threadId);
        requireThreadManager(me, thread);

        ChatThread.Type threadType = resolveThreadType(thread);
        if (threadType == ChatThread.Type.DIRECT) {
            throw new IllegalArgumentException("Direct chats cannot add participants");
        }

        List<String> additions = resolveParticipantIds(participantIds, me, true);
        Set<String> merged = new LinkedHashSet<>(sanitizeParticipantIds(thread.getParticipantIds()));
        merged.addAll(additions);
        thread.setParticipantIds(List.copyOf(merged));

        ChatThread saved = threadRepository.save(thread);
        for (String participantId : sanitizeParticipantIds(saved.getParticipantIds())) {
            if (!participantId.equals(me.getId()) && additions.contains(participantId)) {
                notificationService.notifyChatThreadCreated(participantId, saved.getId(), me.getId());
            }
        }
        return toSummary(saved, me.getId());
    }

    public ChatThreadSummaryDTO removeParticipant(String threadId, String participantId) {
        User me = currentUserService.requireUser();
        chatPresenceService.touchUser(me.getId());
        ChatThread thread = resolveThread(threadId);

        if (!isParticipantOrAdmin(me, thread)) {
            throw new IllegalStateException("Forbidden");
        }

        boolean selfRemoval = me.getId() != null && me.getId().equals(participantId);
        if (!selfRemoval) {
            requireThreadManager(me, thread);
        }

        ChatThread.Type threadType = resolveThreadType(thread);
        if (threadType == ChatThread.Type.DIRECT) {
            throw new IllegalArgumentException("Direct chats cannot remove participants");
        }

        List<String> existingParticipants = sanitizeParticipantIds(thread.getParticipantIds());
        if (!existingParticipants.contains(participantId)) {
            throw new IllegalArgumentException("Participant not found in thread");
        }

        List<String> nextParticipants = existingParticipants.stream()
                .filter(id -> !id.equals(participantId))
                .toList();

        if (threadType == ChatThread.Type.GROUP && nextParticipants.size() < 2) {
            throw new IllegalArgumentException("Group chat must keep at least two participants");
        }
        if (threadType == ChatThread.Type.CHANNEL && nextParticipants.isEmpty()) {
            throw new IllegalArgumentException("Channel must keep at least one participant");
        }

        thread.setParticipantIds(nextParticipants);
        if (participantId.equals(thread.getOwnerUserId())) {
            thread.setOwnerUserId(nextParticipants.isEmpty() ? null : nextParticipants.get(0));
        }

        Map<String, Instant> lastReadAt = thread.getLastReadAtByUser();
        if (lastReadAt != null && !lastReadAt.isEmpty()) {
            Map<String, Instant> nextReadAt = new HashMap<>(lastReadAt);
            nextReadAt.remove(participantId);
            thread.setLastReadAtByUser(nextReadAt);
        }

        ChatThread saved = threadRepository.save(thread);
        return toSummary(saved, me.getId());
    }

    public ChatMessage sendMessage(String threadId, ChatMessage message) {
        User me = currentUserService.requireUser();
        chatPresenceService.touchUser(me.getId());
        ChatThread thread = resolveThread(threadId);

        if (!isParticipantOrAdmin(me, thread)) {
            throw new IllegalStateException("Forbidden");
        }
        ensureCanSendMessage(me, thread);

        if (message.getType() == null) {
            message.setType(ChatMessage.Type.TEXT);
        }

        validateMessagePayload(me, message);
        message.setId(null);
        message.setThreadId(thread.getId());
        message.setSenderId(me.getId());

        ChatMessage saved = messageRepository.save(message);
        Instant messageTime = saved.getCreatedAt() != null ? saved.getCreatedAt() : Instant.now();
        thread.setLastMessageAt(messageTime);
        thread.setLastMessage(buildMessagePreview(saved));
        thread.setLastMessageSenderId(me.getId());
        updateLastReadAt(thread, me.getId(), messageTime);
        threadRepository.save(thread);

        if (thread.getParticipantIds() != null) {
            for (String participantId : sanitizeParticipantIds(thread.getParticipantIds())) {
                if (!participantId.equals(me.getId())) {
                    notificationService.notifyChatMessage(participantId, thread.getId(), me.getId(), saved);
                }
            }
        }

        return saved;
    }

    public ChatTypingEventDTO buildTypingEvent(String threadId, boolean typing) {
        User me = currentUserService.requireUser();
        chatPresenceService.touchUser(me.getId());
        ChatThread thread = resolveThread(threadId);

        if (!isParticipantOrAdmin(me, thread)) {
            throw new IllegalStateException("Forbidden");
        }

        return new ChatTypingEventDTO(
                thread.getId(),
                me.getId(),
                resolveUserLabel(me),
                typing
        );
    }

    public ChatMessage updateMessage(String threadId, String messageId, ChatMessage patch) {
        User me = currentUserService.requireUser();
        chatPresenceService.touchUser(me.getId());
        ChatThread thread = resolveThread(threadId);
        if (!isParticipantOrAdmin(me, thread)) {
            throw new IllegalStateException("Forbidden");
        }

        ChatMessage existing = requireMessage(thread.getId(), messageId);
        if (!me.getId().equals(existing.getSenderId()) && !currentUserService.hasRole(me, "ADMIN")) {
            throw new IllegalStateException("Only senders can edit messages");
        }
        if (existing.getDeletedAt() != null) {
            throw new IllegalStateException("Deleted messages cannot be edited");
        }

        if (patch.getType() != null) {
            existing.setType(patch.getType());
        }
        existing.setText(patch.getText());
        existing.setAssetId(patch.getAssetId());
        validateMessagePayload(me, existing);
        existing.setEditedAt(Instant.now());
        ChatMessage saved = messageRepository.save(existing);
        refreshThreadMetadata(thread);
        threadRepository.save(thread);
        return saved;
    }

    public ChatMessage deleteMessage(String threadId, String messageId, boolean deleteForEveryone) {
        User me = currentUserService.requireUser();
        chatPresenceService.touchUser(me.getId());
        ChatThread thread = resolveThread(threadId);
        if (!isParticipantOrAdmin(me, thread)) {
            throw new IllegalStateException("Forbidden");
        }

        ChatMessage existing = requireMessage(thread.getId(), messageId);
        if (!me.getId().equals(existing.getSenderId()) && !currentUserService.hasRole(me, "ADMIN")) {
            throw new IllegalStateException("Only senders can delete messages");
        }

        existing.setDeletedAt(Instant.now());
        existing.setDeletedForEveryone(deleteForEveryone);
        existing.setText("Message deleted");
        existing.setAssetId(null);
        existing.setReplyToMessageId(null);
        existing.setForwardedFromMessageId(null);
        ChatMessage saved = messageRepository.save(existing);
        refreshThreadMetadata(thread);
        threadRepository.save(thread);
        return saved;
    }

    public ChatMessage forwardMessage(String threadId, String sourceMessageId) {
        User me = currentUserService.requireUser();
        chatPresenceService.touchUser(me.getId());
        ChatThread thread = resolveThread(threadId);
        if (!isParticipantOrAdmin(me, thread)) {
            throw new IllegalStateException("Forbidden");
        }
        ensureCanSendMessage(me, thread);

        ChatMessage source = messageRepository.findById(sourceMessageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        if (source.getDeletedAt() != null) {
            throw new IllegalStateException("Deleted messages cannot be forwarded");
        }

        ChatMessage forwarded = new ChatMessage();
        forwarded.setThreadId(thread.getId());
        forwarded.setSenderId(me.getId());
        forwarded.setType(source.getType());
        forwarded.setText(source.getText());
        forwarded.setAssetId(source.getAssetId());
        forwarded.setForwardedFromMessageId(source.getId());
        validateMessagePayload(me, forwarded);
        ChatMessage saved = messageRepository.save(forwarded);
        Instant messageTime = saved.getCreatedAt() != null ? saved.getCreatedAt() : Instant.now();
        thread.setLastMessageAt(messageTime);
        thread.setLastMessage(buildMessagePreview(saved));
        thread.setLastMessageSenderId(me.getId());
        updateLastReadAt(thread, me.getId(), messageTime);
        threadRepository.save(thread);
        return saved;
    }

    public ChatMessage toggleReaction(String threadId, String messageId, String emoji) {
        User me = currentUserService.requireUser();
        chatPresenceService.touchUser(me.getId());
        ChatThread thread = resolveThread(threadId);
        if (!isParticipantOrAdmin(me, thread)) {
            throw new IllegalStateException("Forbidden");
        }
        if (emoji == null || emoji.isBlank()) {
            throw new IllegalArgumentException("emoji is required");
        }

        ChatMessage message = requireMessage(thread.getId(), messageId);
        Map<String, List<String>> current = message.getReactions() == null ? new HashMap<>() : new HashMap<>(message.getReactions());
        Set<String> users = new LinkedHashSet<>(sanitizeParticipantIds(current.get(emoji)));
        if (users.contains(me.getId())) {
            users.remove(me.getId());
        } else {
            users.add(me.getId());
        }
        if (users.isEmpty()) {
            current.remove(emoji);
        } else {
            current.put(emoji, List.copyOf(users));
        }
        message.setReactions(current.isEmpty() ? null : current);
        return messageRepository.save(message);
    }

    public ChatThreadSummaryDTO pinMessage(String threadId, String messageId) {
        User me = currentUserService.requireUser();
        chatPresenceService.touchUser(me.getId());
        ChatThread thread = resolveThread(threadId);
        requireThreadManager(me, thread);
        requireMessage(thread.getId(), messageId);
        thread.setPinnedMessageId(messageId);
        ChatThread saved = threadRepository.save(thread);
        return toSummary(saved, me.getId());
    }

    public ChatThreadSummaryDTO clearPinnedMessage(String threadId) {
        User me = currentUserService.requireUser();
        chatPresenceService.touchUser(me.getId());
        ChatThread thread = resolveThread(threadId);
        requireThreadManager(me, thread);
        thread.setPinnedMessageId(null);
        ChatThread saved = threadRepository.save(thread);
        return toSummary(saved, me.getId());
    }

    public ChatThreadSummaryDTO updateThreadPreferences(String threadId, Boolean pinned, Boolean muted, Boolean archived) {
        User me = currentUserService.requireUser();
        chatPresenceService.touchUser(me.getId());
        ChatThread thread = resolveThread(threadId);
        if (!isParticipantOrAdmin(me, thread)) {
            throw new IllegalStateException("Forbidden");
        }

        if (pinned != null) {
            thread.setPinnedByUserIds(updateUserFlag(thread.getPinnedByUserIds(), me.getId(), pinned));
        }
        if (muted != null) {
            thread.setMutedByUserIds(updateUserFlag(thread.getMutedByUserIds(), me.getId(), muted));
        }
        if (archived != null) {
            thread.setArchivedByUserIds(updateUserFlag(thread.getArchivedByUserIds(), me.getId(), archived));
        }

        ChatThread saved = threadRepository.save(thread);
        return toSummary(saved, me.getId());
    }

    private ChatThreadSummaryDTO toSummary(ChatThread thread, String currentUserId) {
        String lastMessage = thread.getLastMessage();
        if ((lastMessage == null || lastMessage.isBlank()) && thread.getId() != null) {
            ChatMessage latestMessage = messageRepository.findFirstByThreadIdOrderByCreatedAtDesc(thread.getId());
            if (latestMessage != null) {
                lastMessage = buildMessagePreview(latestMessage);
            }
        }

        return new ChatThreadSummaryDTO(
                thread.getId(),
                sanitizeParticipantIds(thread.getParticipantIds()),
                resolveThreadType(thread).name(),
                thread.getGroupName(),
                thread.getChannelDescription(),
                thread.getOwnerUserId(),
                Boolean.TRUE.equals(thread.getMemberMessagingEnabled()),
                thread.getLastMessageAt(),
                lastMessage,
                thread.getLastMessageSenderId(),
                resolveUnreadCount(thread, currentUserId),
                thread.getPinnedMessageId(),
                containsUserId(thread.getPinnedByUserIds(), currentUserId),
                containsUserId(thread.getMutedByUserIds(), currentUserId),
                containsUserId(thread.getArchivedByUserIds(), currentUserId)
        );
    }

    private boolean isParticipantOrAdmin(User me, ChatThread thread) {
        return currentUserService.hasRole(me, "ADMIN")
                || (thread.getParticipantIds() != null && thread.getParticipantIds().contains(me.getId()));
    }

    private void markThreadReadInternal(ChatThread thread, String userId) {
        Instant targetTime = thread.getLastMessageAt() != null ? thread.getLastMessageAt() : Instant.now();
        if (updateLastReadAt(thread, userId, targetTime)) {
            threadRepository.save(thread);
        }
    }

    private boolean updateLastReadAt(ChatThread thread, String userId, Instant timestamp) {
        Map<String, Instant> existingReadTimes = thread.getLastReadAtByUser();
        Map<String, Instant> nextReadTimes = existingReadTimes == null ? new HashMap<>() : new HashMap<>(existingReadTimes);
        Instant current = nextReadTimes.get(userId);

        if (current != null && !current.isBefore(timestamp)) {
            return false;
        }

        nextReadTimes.put(userId, timestamp);
        thread.setLastReadAtByUser(nextReadTimes);
        return true;
    }

    private long resolveUnreadCount(ChatThread thread, String currentUserId) {
        if (thread.getId() == null || currentUserId == null || currentUserId.isBlank()) {
            return 0;
        }

        Instant lastReadAt = thread.getLastReadAtByUser() == null ? null : thread.getLastReadAtByUser().get(currentUserId);
        if (lastReadAt == null) {
            return messageRepository.countByThreadIdAndSenderIdNot(thread.getId(), currentUserId);
        }

        return messageRepository.countByThreadIdAndSenderIdNotAndCreatedAtAfter(thread.getId(), currentUserId, lastReadAt);
    }

    private String buildMessagePreview(ChatMessage message) {
        if (message == null) {
            return "";
        }

        if (message.getDeletedAt() != null) {
            return "Message deleted";
        }

        if (message.getType() == ChatMessage.Type.ASSET) {
            return "[Attachment]";
        }

        String text = message.getText();
        if (text == null || text.isBlank()) {
            return "";
        }

        String trimmed = text.trim();
        if (trimmed.startsWith(CALL_INVITE_PREFIX)) {
            String lower = trimmed.toLowerCase(Locale.ROOT);
            if (lower.contains("\"callmode\":\"channel_broadcast\"")) {
                return lower.contains("\"mediakind\":\"audio\"")
                        ? "Started an audio broadcast"
                        : "Started a live video broadcast";
            }
            if (lower.contains("\"callmode\":\"group_call\"")) {
                return lower.contains("\"mediakind\":\"audio\"")
                        ? "Started a group audio call"
                        : "Started a group video call";
            }
            return lower.contains("\"mediakind\":\"audio\"")
                    ? "Started an audio call"
                    : "Started a video call";
        }
        return trimmed.length() <= 80 ? trimmed : trimmed.substring(0, 77) + "...";
    }

    private void ensureCanSendMessage(User me, ChatThread thread) {
        if (resolveThreadType(thread) != ChatThread.Type.CHANNEL) {
            return;
        }

        if (currentUserService.hasRole(me, "ADMIN")) {
            return;
        }

        if (Boolean.TRUE.equals(thread.getMemberMessagingEnabled())) {
            return;
        }

        if (me.getId() != null && me.getId().equals(thread.getOwnerUserId())) {
            return;
        }

        throw new IllegalStateException("Only channel owners can post in this channel");
    }

    private void validateMessagePayload(User me, ChatMessage message) {
        if (message.getReplyToMessageId() != null && !message.getReplyToMessageId().isBlank()) {
            messageRepository.findById(message.getReplyToMessageId())
                    .orElseThrow(() -> new IllegalArgumentException("Reply target not found"));
        }

        if (message.getType() == ChatMessage.Type.ASSET) {
            if (message.getAssetId() == null || message.getAssetId().isBlank()) {
                throw new IllegalArgumentException("assetId is required for asset messages");
            }

            var asset = assetRepository.findById(message.getAssetId())
                    .orElseThrow(() -> new IllegalArgumentException("Asset not found"));
            boolean admin = currentUserService.hasRole(me, "ADMIN");
            boolean forwardedAsset = message.getForwardedFromMessageId() != null && !message.getForwardedFromMessageId().isBlank();
            if (!admin && !forwardedAsset && (asset.getOwnerId() == null || !asset.getOwnerId().equals(me.getId()))) {
                throw new IllegalStateException("You can only send your own uploaded assets");
            }
            if (asset.getScope() == null || !"CHAT".equalsIgnoreCase(asset.getScope())) {
                throw new IllegalArgumentException("Only CHAT scoped assets can be sent in chat");
            }
            message.setText(null);
            return;
        }

        if (message.getText() == null || message.getText().isBlank()) {
            throw new IllegalArgumentException("Message text is required");
        }
        String trimmed = message.getText().trim();
        message.setText(trimmed.length() <= 4000 ? trimmed : trimmed.substring(0, 4000));
        message.setAssetId(null);
    }

    private ChatThread.Type parseThreadType(String requestedType) {
        if (requestedType == null || requestedType.isBlank()) {
            return null;
        }

        try {
            return ChatThread.Type.valueOf(requestedType.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ignored) {
            throw new IllegalArgumentException("Unsupported chat type: " + requestedType);
        }
    }

    private ChatThread.Type determineThreadType(ChatThread.Type explicitType, int participantCount) {
        ChatThread.Type resolvedType = explicitType != null
                ? explicitType
                : (participantCount > 2 ? ChatThread.Type.GROUP : ChatThread.Type.DIRECT);

        if (resolvedType == ChatThread.Type.DIRECT && participantCount != 2) {
            throw new IllegalArgumentException("Direct chat must contain exactly two participants");
        }

        if (resolvedType == ChatThread.Type.GROUP && participantCount < 3) {
            throw new IllegalArgumentException("Group chat must contain at least three participants");
        }

        if (resolvedType == ChatThread.Type.CHANNEL && participantCount < 1) {
            throw new IllegalArgumentException("Channel must contain at least one participant");
        }

        return resolvedType;
    }

    private ChatThread.Type resolveThreadType(ChatThread thread) {
        if (thread.getType() != null) {
            return thread.getType();
        }

        return sanitizeParticipantIds(thread.getParticipantIds()).size() > 2
                ? ChatThread.Type.GROUP
                : ChatThread.Type.DIRECT;
    }

    private boolean isNamedThread(ChatThread.Type threadType) {
        return threadType == ChatThread.Type.GROUP || threadType == ChatThread.Type.CHANNEL;
    }

    private void requireThreadManager(User me, ChatThread thread) {
        if (currentUserService.hasRole(me, "ADMIN")) {
            return;
        }

        if (!isParticipantOrAdmin(me, thread)) {
            throw new IllegalStateException("Forbidden");
        }

        String ownerId = thread.getOwnerUserId();
        if (ownerId == null || ownerId.isBlank()) {
            if (resolveThreadType(thread) == ChatThread.Type.GROUP) {
                return;
            }
            throw new IllegalStateException("Thread owner is not configured");
        }

        if (!ownerId.equals(me.getId())) {
            throw new IllegalStateException("Only thread owners can manage this conversation");
        }
    }

    private ChatMessage requireMessage(String threadId, String messageId) {
        ChatMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        if (!threadId.equals(message.getThreadId())) {
            throw new IllegalArgumentException("Message does not belong to this thread");
        }
        return message;
    }

    private boolean containsUserId(List<String> values, String userId) {
        return values != null && userId != null && values.contains(userId);
    }

    private List<String> updateUserFlag(List<String> values, String userId, boolean enabled) {
        Set<String> next = new LinkedHashSet<>(sanitizeParticipantIds(values));
        if (enabled) {
            next.add(userId);
        } else {
            next.remove(userId);
        }
        return List.copyOf(next);
    }

    private String normalizeConversationName(String groupName, ChatThread.Type threadType) {
        if (groupName == null || groupName.isBlank()) {
            return threadType == ChatThread.Type.CHANNEL ? "Untitled channel" : "Untitled group";
        }
        return groupName.trim();
    }

    private String normalizeChannelDescription(String channelDescription) {
        if (channelDescription == null || channelDescription.isBlank()) {
            return null;
        }

        String trimmed = channelDescription.trim();
        return trimmed.length() <= 280 ? trimmed : trimmed.substring(0, 280);
    }

    private List<ChatThread> normalizeThreadsForUser(String userId) {
        List<ChatThread> threads = threadRepository.findByParticipantIdsContaining(userId).stream()
                .map(this::sanitizeThread)
                .toList();
        if (collapseDuplicateDirectThreads(threads)) {
            threads = threadRepository.findByParticipantIdsContaining(userId).stream()
                    .map(this::sanitizeThread)
                    .toList();
        }

        return threads.stream()
                .filter(this::isVisibleThread)
                .sorted(THREAD_ACTIVITY_COMPARATOR)
                .toList();
    }

    private boolean collapseDuplicateDirectThreads(List<ChatThread> threads) {
        Map<String, List<ChatThread>> threadsByKey = new HashMap<>();

        for (ChatThread thread : threads) {
            if (!isVisibleThread(thread) || resolveThreadType(thread) != ChatThread.Type.DIRECT) {
                continue;
            }

            List<String> participantIds = normalizeParticipantIds(thread.getParticipantIds());
            if (participantIds.size() != 2) {
                continue;
            }

            threadsByKey.computeIfAbsent(buildDirectThreadKey(participantIds), ignored -> new java.util.ArrayList<>()).add(thread);
        }

        boolean changed = false;
        for (List<ChatThread> directThreads : threadsByKey.values()) {
            if (directThreads.size() < 2) {
                continue;
            }

            ChatThread canonical = chooseCanonicalThread(directThreads);
            for (ChatThread duplicate : directThreads) {
                if (duplicate.getId() == null || duplicate.getId().equals(canonical.getId())) {
                    continue;
                }

                mergeDirectThread(canonical, duplicate);
                changed = true;
            }
        }

        return changed;
    }

    private boolean isVisibleThread(ChatThread thread) {
        return thread.getMergedIntoThreadId() == null || thread.getMergedIntoThreadId().isBlank();
    }

    private ChatThread resolveThread(String threadId) {
        ChatThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new IllegalArgumentException("Thread not found"));

        ChatThread resolvedThread = sanitizeThread(followMergeChain(thread));
        if (resolveThreadType(resolvedThread) != ChatThread.Type.DIRECT) {
            return resolvedThread;
        }

        ChatThread canonical = findExistingDirectThread(resolvedThread.getParticipantIds());
        return canonical != null ? canonical : resolvedThread;
    }

    private ChatThread followMergeChain(ChatThread thread) {
        ChatThread current = thread;
        Set<String> seen = new LinkedHashSet<>();

        while (current.getId() != null
                && current.getMergedIntoThreadId() != null
                && !current.getMergedIntoThreadId().isBlank()
                && seen.add(current.getId())) {
            String nextId = current.getMergedIntoThreadId();
            ChatThread next = threadRepository.findById(nextId).orElse(null);
            if (next == null || next.getId() == null || next.getId().equals(current.getId())) {
                break;
            }
            current = next;
        }

        return current;
    }

    private ChatThread sanitizeThread(ChatThread thread) {
        List<String> sanitizedParticipantIds = sanitizeParticipantIds(thread.getParticipantIds());
        if (thread.getParticipantIds() != null && !sanitizedParticipantIds.equals(thread.getParticipantIds())) {
            thread.setParticipantIds(sanitizedParticipantIds);
            threadRepository.save(thread);
        }
        return thread;
    }

    private List<String> sanitizeParticipantIds(List<String> participantIds) {
        if (participantIds == null || participantIds.isEmpty()) {
            return List.of();
        }

        return participantIds.stream()
                .filter(participantId -> participantId != null && !participantId.isBlank())
                .distinct()
                .toList();
    }

    private List<String> normalizeParticipantIds(List<String> participantIds) {
        return sanitizeParticipantIds(participantIds).stream()
                .sorted()
                .toList();
    }

    private String buildDirectThreadKey(List<String> participantIds) {
        return String.join("|", normalizeParticipantIds(participantIds));
    }

    private ChatThread chooseCanonicalThread(List<ChatThread> threads) {
        return threads.stream()
                .sorted(THREAD_ACTIVITY_COMPARATOR)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Direct thread not found"));
    }

    private void mergeDirectThread(ChatThread canonical, ChatThread duplicate) {
        if (canonical.getId() == null || duplicate.getId() == null || canonical.getId().equals(duplicate.getId())) {
            return;
        }

        List<ChatMessage> duplicateMessages = messageRepository.findByThreadIdOrderByCreatedAtAsc(duplicate.getId());
        for (ChatMessage duplicateMessage : duplicateMessages) {
            duplicateMessage.setThreadId(canonical.getId());
        }
        if (!duplicateMessages.isEmpty()) {
            messageRepository.saveAll(duplicateMessages);
        }

        canonical.setType(ChatThread.Type.DIRECT);
        canonical.setGroupName(null);
        canonical.setChannelDescription(null);
        canonical.setOwnerUserId(null);
        canonical.setMemberMessagingEnabled(null);
        canonical.setParticipantIds(sanitizeParticipantIds((canonical.getParticipantIds() == null || canonical.getParticipantIds().isEmpty())
                ? duplicate.getParticipantIds()
                : canonical.getParticipantIds()));
        canonical.setLastReadAtByUser(mergeReadTimestamps(canonical.getLastReadAtByUser(), duplicate.getLastReadAtByUser()));

        if (isAfter(duplicate.getLastMessageAt(), canonical.getLastMessageAt())) {
            canonical.setLastMessageAt(duplicate.getLastMessageAt());
            canonical.setLastMessage(duplicate.getLastMessage());
            canonical.setLastMessageSenderId(duplicate.getLastMessageSenderId());
        }

        refreshThreadMetadata(canonical);
        threadRepository.save(canonical);

        duplicate.setMergedIntoThreadId(canonical.getId());
        duplicate.setType(ChatThread.Type.DIRECT);
        duplicate.setGroupName(null);
        duplicate.setChannelDescription(null);
        duplicate.setOwnerUserId(null);
        duplicate.setMemberMessagingEnabled(null);
        threadRepository.save(duplicate);
    }

    private Map<String, Instant> mergeReadTimestamps(Map<String, Instant> left, Map<String, Instant> right) {
        Map<String, Instant> merged = new HashMap<>();
        if (left != null) {
            merged.putAll(left);
        }
        if (right == null) {
            return merged;
        }

        for (Map.Entry<String, Instant> entry : right.entrySet()) {
            String userId = entry.getKey();
            Instant incoming = entry.getValue();
            Instant current = merged.get(userId);
            if (incoming != null && (current == null || incoming.isAfter(current))) {
                merged.put(userId, incoming);
            }
        }

        return merged;
    }

    private boolean isAfter(Instant candidate, Instant current) {
        return candidate != null && (current == null || candidate.isAfter(current));
    }

    private void refreshThreadMetadata(ChatThread thread) {
        if (thread.getId() == null) {
            return;
        }

        ChatMessage latestMessage = messageRepository.findFirstByThreadIdOrderByCreatedAtDesc(thread.getId());
        if (latestMessage == null) {
            return;
        }

        thread.setLastMessageAt(latestMessage.getCreatedAt() != null ? latestMessage.getCreatedAt() : thread.getLastMessageAt());
        thread.setLastMessage(buildMessagePreview(latestMessage));
        thread.setLastMessageSenderId(latestMessage.getSenderId());
    }

    private ChatThread findExistingDirectThread(List<String> participantIds) {
        List<String> normalizedParticipantIds = normalizeParticipantIds(participantIds);
        if (normalizedParticipantIds.size() != 2) {
            return null;
        }

        String currentUserId = normalizedParticipantIds.get(0);
        String expectedKey = buildDirectThreadKey(normalizedParticipantIds);
        Map<String, ChatThread> matchesById = new HashMap<>();
        threadRepository.findByParticipantIdsContaining(currentUserId).stream()
                .map(this::followMergeChain)
                .filter(this::isVisibleThread)
                .filter(thread -> resolveThreadType(thread) == ChatThread.Type.DIRECT)
                .filter(thread -> buildDirectThreadKey(thread.getParticipantIds()).equals(expectedKey))
                .forEach(thread -> {
                    if (thread.getId() != null) {
                        matchesById.putIfAbsent(thread.getId(), thread);
                    }
                });

        List<ChatThread> matches = matchesById.values().stream()
                .sorted(THREAD_ACTIVITY_COMPARATOR)
                .toList();

        if (matches.isEmpty()) {
            return null;
        }

        ChatThread canonical = matches.get(0);
        for (int i = 1; i < matches.size(); i++) {
            mergeDirectThread(canonical, matches.get(i));
        }
        return canonical;
    }

    private List<String> resolveParticipantIds(List<String> participantIds, User me, boolean allowOwnerOnly) {
        Set<String> resolvedIds = new LinkedHashSet<>();
        resolvedIds.add(me.getId());

        List<String> incomingParticipantIds = participantIds == null ? List.of() : participantIds;
        for (String participantId : incomingParticipantIds) {
            if (participantId == null || participantId.isBlank()) {
                continue;
            }

            String rawValue = participantId.trim();
            if (rawValue.equals(me.getId())) {
                continue;
            }

            User participant = userRepository.findById(rawValue)
                    .or(() -> userRepository.findByEmail(rawValue.toLowerCase(Locale.ROOT)))
                    .or(() -> userRepository.findByUsername(rawValue.toLowerCase(Locale.ROOT)))
                    .orElseThrow(() -> new IllegalArgumentException("Participant not found: " + rawValue));
            resolvedIds.add(participant.getId());
        }

        if (!allowOwnerOnly && resolvedIds.size() < 2) {
            throw new IllegalArgumentException("At least one valid participant is required");
        }

        return List.copyOf(resolvedIds);
    }

    private String resolveUserLabel(User user) {
        if (user == null) {
            return "Unknown user";
        }

        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName().trim();
        }
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user.getUsername().trim();
        }
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            return user.getEmail().trim();
        }
        return user.getId();
    }
}
