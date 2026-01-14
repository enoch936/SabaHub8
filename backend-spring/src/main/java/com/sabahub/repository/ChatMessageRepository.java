package com.sabahub.repository;

import com.sabahub.domain.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    List<ChatMessage> findByThreadIdOrderByCreatedAtAsc(String threadId);
    
    // Search messages by sender user ID
    List<ChatMessage> findBySenderIdOrderByCreatedAtDesc(String senderId);
    
    // Find messages in a thread from a specific user
    List<ChatMessage> findByThreadIdAndSenderIdOrderByCreatedAtAsc(String threadId, String senderId);
}
