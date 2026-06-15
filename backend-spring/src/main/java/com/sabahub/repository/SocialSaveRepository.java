package com.sabahub.repository;

import com.sabahub.domain.SocialSave;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SocialSaveRepository extends MongoRepository<SocialSave, String> {
    boolean existsByPostIdAndUserId(String postId, String userId);
    java.util.List<SocialSave> findAllByUserId(String userId);
    Optional<SocialSave> findByPostIdAndUserId(String postId, String userId);
    long countByPostId(String postId);
}
