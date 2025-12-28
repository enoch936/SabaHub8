package com.sabahub.service;

import com.sabahub.domain.ChatMessage;
import com.sabahub.domain.ChatThread;
import com.sabahub.domain.User;
import com.sabahub.repository.ChatMessageRepository;
import com.sabahub.repository.ChatThreadRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class ChatService {

    private final ChatThreadRepository threadRepository;
    private final ChatMessageRepository messageRepository;
    private final CurrentUserService currentUserService;

    public ChatService(ChatThreadRepository threadRepository,
                       ChatMessageRepository messageRepository,
                       CurrentUserService currentUserService) {
        this.threadRepository = threadRepository;
        this.messageRepository = messageRepository;
        this.currentUserService = currentUserService;
    }

    public List<ChatThread> listMyThreads() {
        User me = currentUserService.requireUser();
        return threadRepository.findByParticipantIdsContaining(me.getId());
    }

    public ChatThread createThread(List<String> participantIds) {
        User me = currentUserService.requireUser();

        if (participantIds == null || participantIds.isEmpty()) {
            throw new IllegalArgumentException("participantIds required");
        }

        if (!participantIds.contains(me.getId())) {
            throw new IllegalStateException("You must be a participant");
        }

        ChatThread thread = new ChatThread();
        thread.setParticipantIds(participantIds);
        thread.setLastMessageAt(Instant.now());
        return threadRepository.save(thread);
    }

    public List<ChatMessage> listMessages(String threadId) {
        User me = currentUserService.requireUser();
        ChatThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new IllegalArgumentException("Thread not found"));

        if (!isParticipantOrAdmin(me, thread)) {
            throw new IllegalStateException("Forbidden");
        }

        return messageRepository.findByThreadIdOrderByCreatedAtAsc(threadId);
    }

    public ChatMessage sendMessage(String threadId, ChatMessage message) {
        User me = currentUserService.requireUser();
        ChatThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new IllegalArgumentException("Thread not found"));

        if (!isParticipantOrAdmin(me, thread)) {
            throw new IllegalStateException("Forbidden");
        }

        if (message.getType() == null) {
            message.setType(ChatMessage.Type.TEXT);
        }

        message.setId(null);
        message.setThreadId(threadId);
        message.setSenderId(me.getId());

        ChatMessage saved = messageRepository.save(message);
        thread.setLastMessageAt(Instant.now());
        threadRepository.save(thread);
        return saved;
    }

    private boolean isParticipantOrAdmin(User me, ChatThread thread) {
        return currentUserService.hasRole(me, "ADMIN")
                || (thread.getParticipantIds() != null && thread.getParticipantIds().contains(me.getId()));
    }
}
