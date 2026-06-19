package com.sabahub.repository;

import com.sabahub.domain.SocialPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface SocialPostRepository extends MongoRepository<SocialPost, String> {

    Page<SocialPost> findAllByTypeOrderByCreatedAtDesc(SocialPost.PostType type, Pageable pageable);

    @Query("{ 'type': ?0, 'authorId': { $in: ?1 } }")
    Page<SocialPost> findFeedPostsByAuthorIdIn(SocialPost.PostType type, List<String> authorIds, Pageable pageable);

    @Query("{ 'type': ?0 }")
    Page<SocialPost> findGlobalFeedPosts(SocialPost.PostType type, Pageable pageable);

    Page<SocialPost> findFeedPostsByAuthorId(SocialPost.PostType type, String authorId, Pageable pageable);

    Page<SocialPost> findAllByTypeAndAuthorIdOrderByCreatedAtDesc(SocialPost.PostType type, String authorId, Pageable pageable);

    Page<SocialPost> findAllByAuthorId(String authorId, Pageable pageable);

    Page<SocialPost> findAllByIdIn(List<String> ids, Pageable pageable);

    Page<SocialPost> findAllByType(SocialPost.PostType type, Pageable pageable);
}
