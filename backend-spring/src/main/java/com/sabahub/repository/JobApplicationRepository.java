package com.sabahub.repository;

import com.sabahub.domain.JobApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobApplicationRepository extends MongoRepository<JobApplication, String> {

    // Find applications by job
    List<JobApplication> findByJobIdOrderByAppliedAtDesc(String jobId);
    Page<JobApplication> findByJobId(String jobId, Pageable pageable);

    // Find applications by vendor
    List<JobApplication> findByVendorIdOrderByAppliedAtDesc(String vendorId);
    Page<JobApplication> findByVendorId(String vendorId, Pageable pageable);

    // Find applications by employer
    List<JobApplication> findByEmployerIdOrderByAppliedAtDesc(String employerId);
    Page<JobApplication> findByEmployerId(String employerId, Pageable pageable);

    // Find by status
    List<JobApplication> findByStatus(JobApplication.Status status);
    Page<JobApplication> findByStatus(JobApplication.Status status, Pageable pageable);

    // Find by job and status
    List<JobApplication> findByJobIdAndStatusOrderByAppliedAtDesc(String jobId, JobApplication.Status status);
    Page<JobApplication> findByJobIdAndStatus(String jobId, JobApplication.Status status, Pageable pageable);

    // Find by vendor and status
    List<JobApplication> findByVendorIdAndStatusOrderByAppliedAtDesc(String vendorId, JobApplication.Status status);

    // Count applications for job
    Long countByJobId(String jobId);
    Long countByJobIdAndStatus(String jobId, JobApplication.Status status);

    // Find approved applications ordered by evaluation score
    List<JobApplication> findByJobIdAndStatusOrderByEvaluation_OverallScoreDesc(String jobId, JobApplication.Status status);

    // Find pending review
    List<JobApplication> findByEmployerIdAndStatusOrderByAppliedAtAsc(String employerId, JobApplication.Status status);

    // Find by onboarding status
    List<JobApplication> findByStatusAndOnboardingAllTasksCompleted(JobApplication.Status status, Boolean completed);

    // Find by date range
    List<JobApplication> findByAppliedAtBetweenOrderByAppliedAtDesc(LocalDateTime start, LocalDateTime end);

    // Find single application
    Optional<JobApplication> findByJobIdAndVendorId(String jobId, String vendorId);
}
