package com.sabahub.repository;

import com.sabahub.domain.ReelSave;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ReelSaveRepository extends MongoRepository<ReelSave, String> {
    Optional<ReelSave> findByReelIdAndUserId(String reelId, String userId);
    long countByReelId(String reelId);
}
