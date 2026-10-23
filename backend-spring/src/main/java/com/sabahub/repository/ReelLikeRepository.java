package com.sabahub.repository;

import com.sabahub.domain.ReelLike;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ReelLikeRepository extends MongoRepository<ReelLike, String> {
    Optional<ReelLike> findByReelIdAndUserId(String reelId, String userId);
    long countByReelId(String reelId);
    void deleteByReelIdAndUserId(String reelId, String userId);
}
