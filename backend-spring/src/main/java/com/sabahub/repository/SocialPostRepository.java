package com.sabahub.repository;

import com.sabahub.domain.SocialPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SocialPostRepository extends MongoRepository<SocialPost, String> {
    
    Page<SocialPost> findAllByTypeAndAuthorIdIn(SocialPost.PostType type, List<String> authorIds, Pageable pageable);

    Page<SocialPost> findAllByTypeAndAuthorId(SocialPost.PostType type, String authorId, Pageable pageable);

    Page<SocialPost> findAllByType(SocialPost.PostType type, Pageable pageable);

    @Query("{ $or: [ { 'type': ?0 }, { 'type': { $exists: false } } ], 'authorId': { $in: ?1 } }")
    Page<SocialPost> findFeedPostsByAuthorIdIn(SocialPost.PostType type, List<String> authorIds, Pageable pageable);

    @Query("{ $or: [ { 'type': ?0 }, { 'type': { $exists: false } } ], 'authorId': ?1 }")
    Page<SocialPost> findFeedPostsByAuthorId(SocialPost.PostType type, String authorId, Pageable pageable);

    @Query("{ $or: [ { 'type': ?0 }, { 'type': { $exists: false } } ] }")
    Page<SocialPost> findGlobalFeedPosts(SocialPost.PostType type, Pageable pageable);

    Page<SocialPost> findAllByIdIn(List<String> ids, Pageable pageable);

    Page<SocialPost> findAllByTypeAndAuthorIdOrderByCreatedAtDesc(SocialPost.PostType type, String authorId, Pageable pageable);

    Page<SocialPost> findAllByTypeOrderByCreatedAtDesc(SocialPost.PostType type, Pageable pageable);

    // Legacy support
    Page<SocialPost> findAllByAuthorIdInOrderByCreatedAtDesc(List<String> authorIds, Pageable pageable);
    Page<SocialPost> findAllByAuthorIdOrderByCreatedAtDesc(String authorId, Pageable pageable);
    Page<SocialPost> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
