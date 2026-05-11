package com.sabahub.repository;

import com.sabahub.domain.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface JobRepository extends MongoRepository<Job, String> {
    // Employer queries
    List<Job> findByEmployerId(String employerId);
    List<Job> findByEmployerIdOrderByCreatedAtDesc(String employerId);
    Page<Job> findByEmployerId(String employerId, Pageable pageable);

    // Status queries
    List<Job> findByStatus(Job.Status status);
    Page<Job> findByStatus(Job.Status status, Pageable pageable);
    Page<Job> findByStatusAndCategoryId(Job.Status status, String categoryId, Pageable pageable);
    List<Job> findByStatusAndIsEnterpriseOnly(Job.Status status, Boolean isEnterpriseOnly);
    Page<Job> findByStatusAndIsEnterpriseOnly(Job.Status status, Boolean isEnterpriseOnly, Pageable pageable);

    // Deliverable type queries
    Page<Job> findByDeliverableTypeAndStatus(
            Job.DeliverableType deliverableType, Job.Status status, Pageable pageable);

    Page<Job> findByDeliverableTypeAndStatusAndIsEnterpriseOnly(
            Job.DeliverableType deliverableType, Job.Status status, Boolean isEnterpriseOnly, Pageable pageable);

    // Engagement type queries
    Page<Job> findByEngagementTypeAndStatus(
            Job.EngagementType engagementType, Job.Status status, Pageable pageable);

    Page<Job> findByEngagementTypeAndStatusAndIsEnterpriseOnly(
            Job.EngagementType engagementType, Job.Status status, Boolean isEnterpriseOnly, Pageable pageable);

    // Category queries
    Page<Job> findByCategoryId(String categoryId, Pageable pageable);
    Page<Job> findByCategoryIdAndStatusAndIsEnterpriseOnly(
            String categoryId, Job.Status status, Boolean isEnterpriseOnly, Pageable pageable);

    // Date-based queries
    List<Job> findByCreatedAtAfter(Instant after);
    List<Job> findByClosingDateAfter(Instant after);

    // Count queries
    long countByStatus(Job.Status status);
    long countByEmployerId(String employerId);
}
