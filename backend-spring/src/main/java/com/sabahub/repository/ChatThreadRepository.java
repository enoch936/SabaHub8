package com.sabahub.repository;

import com.sabahub.domain.ChatThread;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ChatThreadRepository extends MongoRepository<ChatThread, String> {
    List<ChatThread> findByParticipantIdsContaining(String userId);
}
