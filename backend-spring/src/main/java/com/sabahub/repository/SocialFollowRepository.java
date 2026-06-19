package com.sabahub.repository;

import com.sabahub.domain.SocialFollow;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SocialFollowRepository extends MongoRepository<SocialFollow, String> {
    List<SocialFollow> findAllByFollowerId(String followerId);
    List<SocialFollow> findAllByFollowingId(String followingId);
    Optional<SocialFollow> findByFollowerIdAndFollowingId(String followerId, String followingId);
    boolean existsByFollowerIdAndFollowingId(String followerId, String followingId);
    long countByFollowerId(String followerId);
    long countByFollowingId(String followingId);
    void deleteByFollowerIdAndFollowingId(String followerId, String followingId);
}
