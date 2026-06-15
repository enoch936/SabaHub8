package com.sabahub.repository;

import com.sabahub.domain.SocialComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SocialCommentRepository extends MongoRepository<SocialComment, String> {
    Page<SocialComment> findByPostIdOrderByCreatedAtDesc(String postId, Pageable pageable);
    Page<SocialComment> findAllByPostIdOrderByCreatedAtAsc(String postId, Pageable pageable);
    long countByPostId(String postId);
}
