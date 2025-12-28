package com.sabahub.repository;

import com.sabahub.domain.AuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    List<AuditLog> findByActorUserIdOrderByCreatedAtDesc(String actorUserId);
}
