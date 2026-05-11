package com.sabahub.repository;

import com.sabahub.domain.Gig;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface GigRepository extends MongoRepository<Gig, String> {
    List<Gig> findByFreelancerIdOrderByUpdatedAtDesc(String freelancerId);
    List<Gig> findByActiveTrueOrderByUpdatedAtDesc();

    @Query("{ 'status': ?0, 'flagged': { $ne: true } }")
    List<Gig> findVisibleByStatusOrderByUpdatedAtDesc(Gig.Status status);
}
