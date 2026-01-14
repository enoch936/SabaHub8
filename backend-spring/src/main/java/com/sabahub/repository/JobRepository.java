package com.sabahub.repository;

import com.sabahub.domain.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface JobRepository extends MongoRepository<Job, String> {
    List<Job> findByEmployerId(String employerId);
    Page<Job> findByEmployerId(String employerId, Pageable pageable);

    List<Job> findByCreatedAtAfter(Instant after);

    // Status-based queries
    Page<Job> findByStatus(Job.Status status, Pageable pageable);
    Page<Job> findByStatusAndCategoryId(Job.Status status, String categoryId, Pageable pageable);
    Page<Job> findByCategoryId(String categoryId, Pageable pageable);

    // Count queries
    long countByStatus(Job.Status status);
}
