package com.sabahub.repository;

import com.sabahub.domain.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    List<ChatMessage> findByThreadIdOrderByCreatedAtAsc(String threadId);
}
