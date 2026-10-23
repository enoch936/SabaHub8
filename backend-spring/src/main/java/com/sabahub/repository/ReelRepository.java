package com.sabahub.repository;

import com.sabahub.domain.Reel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ReelRepository extends MongoRepository<Reel, String> {
    Page<Reel> findByStatusOrderByCreatedAtDesc(Reel.Status status, Pageable pageable);
    Page<Reel> findByAuthorIdOrderByCreatedAtDesc(String authorId, Pageable pageable);
}
