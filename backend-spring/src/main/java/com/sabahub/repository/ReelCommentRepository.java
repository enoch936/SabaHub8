package com.sabahub.repository;

import com.sabahub.domain.ReelComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ReelCommentRepository extends MongoRepository<ReelComment, String> {
    Page<ReelComment> findByReelIdOrderByCreatedAtDesc(String reelId, Pageable pageable);
    long countByReelId(String reelId);
}
