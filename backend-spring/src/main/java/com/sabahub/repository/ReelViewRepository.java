package com.sabahub.repository;

import com.sabahub.domain.ReelView;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ReelViewRepository extends MongoRepository<ReelView, String> {
    long countByReelId(String reelId);
}
