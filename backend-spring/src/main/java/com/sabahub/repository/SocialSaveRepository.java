package com.sabahub.repository;

import com.sabahub.domain.SocialSave;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SocialSaveRepository extends MongoRepository<SocialSave, String> {
    List<SocialSave> findAllByUserId(String userId);
    Optional<SocialSave> findByPostIdAndUserId(String postId, String userId);
    boolean existsByPostIdAndUserId(String postId, String userId);
}
