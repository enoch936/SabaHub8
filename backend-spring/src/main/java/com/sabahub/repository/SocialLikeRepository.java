package com.sabahub.repository;

import com.sabahub.domain.SocialLike;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SocialLikeRepository extends MongoRepository<SocialLike, String> {
    Optional<SocialLike> findByPostIdAndUserId(String postId, String userId);
    boolean existsByPostIdAndUserId(String postId, String userId);
    long countByPostId(String postId);
    long countByPostIdIn(List<String> postIds);
    List<SocialLike> findAllByUserId(String userId);
    void deleteByPostIdAndUserId(String postId, String userId);
}
