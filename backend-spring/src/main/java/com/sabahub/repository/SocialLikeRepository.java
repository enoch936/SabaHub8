package com.sabahub.repository;

import com.sabahub.domain.SocialLike;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface SocialLikeRepository extends MongoRepository<SocialLike, String> {
    Optional<SocialLike> findByPostIdAndUserId(String postId, String userId);
    boolean existsByPostIdAndUserId(String postId, String userId);
    java.util.List<SocialLike> findAllByUserId(String userId);
    long countByPostId(String postId);
    long countByPostIdIn(java.util.List<String> postIds);
    void deleteByPostIdAndUserId(String postId, String userId);
}
