package com.sabahub.service;

import com.sabahub.domain.ChatMessage;
import com.sabahub.domain.ChatThread;
import com.sabahub.domain.User;
import com.sabahub.repository.ChatMessageRepository;
import com.sabahub.repository.ChatThreadRepository;
import com.sabahub.repository.UserRepository;
import com.sabahub.web.dto.ChatThreadSummaryDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ChatThreadRepository threadRepository;

    @Mock
    private ChatMessageRepository messageRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ChatPresenceService chatPresenceService;

    @InjectMocks
    private ChatService chatService;

    @Captor
    private ArgumentCaptor<ChatThread> threadCaptor;

    @Captor
    private ArgumentCaptor<ChatMessage> messageCaptor;

    private User owner;
    private User member;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId("owner-1");
        owner.setEmail("owner@sabahub.test");

        member = new User();
        member.setId("member-1");
        member.setEmail("member@sabahub.test");
    }

    @Test
    void createThreadSupportsOwnerOnlyChannelWithoutSeedSubscribers() {
        when(currentUserService.requireUser()).thenReturn(owner);
        when(messageRepository.findFirstByThreadIdOrderByCreatedAtDesc("channel-1")).thenReturn(null);
        when(threadRepository.save(any(ChatThread.class))).thenAnswer(invocation -> {
            ChatThread thread = invocation.getArgument(0);
            thread.setId("channel-1");
            return thread;
        });

        ChatThreadSummaryDTO summary = chatService.createThread(
                List.of(),
                "CHANNEL",
                "SabaHub Updates",
                "Platform-wide product announcements",
                false
        );

        verify(threadRepository).save(threadCaptor.capture());
        ChatThread savedThread = threadCaptor.getValue();
        assertThat(savedThread.getType()).isEqualTo(ChatThread.Type.CHANNEL);
        assertThat(savedThread.getParticipantIds()).containsExactly(owner.getId());
        assertThat(savedThread.getOwnerUserId()).isEqualTo(owner.getId());
        assertThat(savedThread.getMemberMessagingEnabled()).isFalse();
        assertThat(savedThread.getGroupName()).isEqualTo("SabaHub Updates");
        assertThat(savedThread.getChannelDescription()).isEqualTo("Platform-wide product announcements");

        assertThat(summary.threadType()).isEqualTo("CHANNEL");
        assertThat(summary.ownerUserId()).isEqualTo(owner.getId());
        assertThat(summary.memberMessagingEnabled()).isFalse();
        assertThat(summary.participantIds()).containsExactly(owner.getId());
    }

    @Test
    void sendMessageRejectsNonOwnerWhenChannelIsBroadcastOnly() {
        ChatThread thread = new ChatThread();
        thread.setId("channel-1");
        thread.setType(ChatThread.Type.CHANNEL);
        thread.setParticipantIds(List.of(owner.getId(), member.getId()));
        thread.setOwnerUserId(owner.getId());
        thread.setMemberMessagingEnabled(false);

        ChatMessage outbound = new ChatMessage();
        outbound.setType(ChatMessage.Type.TEXT);
        outbound.setText("Hello channel");

        when(currentUserService.requireUser()).thenReturn(member);
        when(currentUserService.hasRole(member, "ADMIN")).thenReturn(false);
        when(threadRepository.findById("channel-1")).thenReturn(Optional.of(thread));

        assertThatThrownBy(() -> chatService.sendMessage("channel-1", outbound))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Only channel owners can post in this channel");

        verify(messageRepository, never()).save(any(ChatMessage.class));
    }

    @Test
    void sendMessageAllowsMembersWhenChannelIsConfiguredForCommunityPosting() {
        ChatThread thread = new ChatThread();
        thread.setId("channel-1");
        thread.setType(ChatThread.Type.CHANNEL);
        thread.setParticipantIds(List.of(owner.getId(), member.getId()));
        thread.setOwnerUserId(owner.getId());
        thread.setMemberMessagingEnabled(true);

        ChatMessage outbound = new ChatMessage();
        outbound.setType(ChatMessage.Type.TEXT);
        outbound.setText("Hello everyone");

        when(currentUserService.requireUser()).thenReturn(member);
        when(currentUserService.hasRole(member, "ADMIN")).thenReturn(false);
        when(threadRepository.findById("channel-1")).thenReturn(Optional.of(thread));
        when(messageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage message = invocation.getArgument(0);
            message.setId("msg-1");
            message.setCreatedAt(Instant.parse("2026-03-28T10:15:30Z"));
            return message;
        });
        when(threadRepository.save(any(ChatThread.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ChatMessage saved = chatService.sendMessage("channel-1", outbound);

        verify(messageRepository).save(messageCaptor.capture());
        ChatMessage persistedMessage = messageCaptor.getValue();
        assertThat(persistedMessage.getThreadId()).isEqualTo("channel-1");
        assertThat(persistedMessage.getSenderId()).isEqualTo(member.getId());
        assertThat(saved.getId()).isEqualTo("msg-1");

        verify(threadRepository).save(threadCaptor.capture());
        ChatThread updatedThread = threadCaptor.getValue();
        assertThat(updatedThread.getLastMessage()).isEqualTo("Hello everyone");
        assertThat(updatedThread.getLastMessageSenderId()).isEqualTo(member.getId());
        assertThat(updatedThread.getLastMessageAt()).isEqualTo(Instant.parse("2026-03-28T10:15:30Z"));
        verify(notificationService).notifyChatMessage(eq(owner.getId()), eq("channel-1"), eq(member.getId()), any(ChatMessage.class));
    }
}
