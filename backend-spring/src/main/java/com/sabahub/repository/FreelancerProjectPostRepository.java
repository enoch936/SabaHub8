package com.sabahub.repository;

import com.sabahub.domain.FreelancerProjectPost;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface FreelancerProjectPostRepository extends MongoRepository<FreelancerProjectPost, String> {
    List<FreelancerProjectPost> findByFreelancerIdOrderByUpdatedAtDesc(String freelancerId);

    @Query("{ 'status': ?0, 'flagged': { $ne: true } }")
    List<FreelancerProjectPost> findVisibleByStatusOrderByUpdatedAtDesc(FreelancerProjectPost.Status status);
}