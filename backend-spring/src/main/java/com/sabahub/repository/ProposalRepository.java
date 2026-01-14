package com.sabahub.repository;

import com.sabahub.domain.Proposal;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface ProposalRepository extends MongoRepository<Proposal, String> {
    
    /**
     * Find all proposals by freelancer
     */
    List<Proposal> findByFreelancerId(String freelancerId);
    
    /**
     * Find proposals by freelancer with pagination
     */
    Page<Proposal> findByFreelancerId(String freelancerId, Pageable pageable);
    
    /**
     * Find proposals with specific status
     */
    List<Proposal> findByStatus(String status);
    
    /**
     * Find proposals for job with specific status
     */
    @Query("{ 'jobId': ?0, 'status': ?1 }")
    List<Proposal> findByJobIdAndStatus(String jobId, String status);
    
    /**
     * Find accepted proposals for job
     */
    @Query("{ 'jobId': ?0, 'status': 'ACCEPTED' }")
    Optional<Proposal> findAcceptedProposalForJob(String jobId);
    
    /**
     * Find shortlisted proposals for job
     */
    @Query("{ 'jobId': ?0, 'status': 'SHORTLISTED' }")
    List<Proposal> findShortlistedProposalsForJob(String jobId);
    
    /**
     * Find proposals submitted within date range
     */
    @Query("{ 'jobId': ?0, 'createdAt': { $gte: ?1, $lte: ?2 } }")
    List<Proposal> findProposalsInDateRange(String jobId, Long startDate, Long endDate);
    
    /**
     * Count proposals for job
     */
    Long countByJobId(String jobId);
    
    /**
     * Count proposals by freelancer
     */
    Long countByFreelancerId(String freelancerId);
    
    /**
     * Count accepted proposals by freelancer
     */
    @Query("{ 'freelancerId': ?0, 'status': 'ACCEPTED' }")
    Long countAcceptedProposalsByFreelancer(String freelancerId);
    
    /**
     * Find duplicate proposals (same freelancer, same job)
     */
    @Query("{ 'jobId': ?0, 'freelancerId': ?1 }")
    Optional<Proposal> findExistingProposal(String jobId, String freelancerId);
    
    /**
     * Find proposals by job ID
     */
    List<Proposal> findByJobId(String jobId);
    
    /**
     * Find proposals by job ID with pagination
     */
    Page<Proposal> findByJobId(String jobId, Pageable pageable);
    
    /**
     * Find proposal by job ID and freelancer ID
     */
    Optional<Proposal> findByJobIdAndFreelancerId(String jobId, String freelancerId);
}
