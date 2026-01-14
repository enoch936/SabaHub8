package com.sabahub.repository;

import com.sabahub.domain.Contract;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface ContractRepository extends MongoRepository<Contract, String> {
    
    /**
     * Find all contracts by project ID
     */
    List<Contract> findByProjectId(String projectId);
    
    /**
     * Find contracts by employer ID
     */
    List<Contract> findByEmployerId(String employerId);
    
    /**
     * Find contracts by employer with pagination
     */
    Page<Contract> findByEmployerId(String employerId, Pageable pageable);
    
    /**
     * Find contracts by freelancer ID
     */
    List<Contract> findByFreelancerId(String freelancerId);
    
    /**
     * Find active contracts for employer
     */
    @Query("{ 'employerId': ?0, 'status': 'ACTIVE' }")
    List<Contract> findActiveContractsByEmployer(String employerId);
    
    /**
     * Find contracts by status
     */
    List<Contract> findByStatus(String status);
    
    /**
     * Find contracts by work type
     */
    List<Contract> findByWorkType(String workType);
    
    /**
     * Find contracts with pending milestones
     */
    @Query("{ 'paymentMilestones': { $elemMatch: { 'status': 'PENDING' } } }")
    List<Contract> findContractsWithPendingMilestones();
    
    /**
     * Find all completed contracts by employer
     */
    @Query("{ 'employerId': ?0, 'status': 'COMPLETED' }")
    List<Contract> findCompletedContractsByEmployer(String employerId);
    
    /**
     * Find disputed contracts
     */
    @Query("{ 'status': 'DISPUTED' }")
    List<Contract> findDisputedContracts();
    
    /**
     * Find contracts expiring soon (deadline within 7 days)
     */
    @Query("{ 'status': 'ACTIVE', 'endDate': { $gt: new Date(), $lt: new Date(new Date().getTime() + 7*24*60*60*1000) } }")
    List<Contract> findContractsExpiringQon();
    
    /**
     * Find contracts by employer and status
     */
    @Query("{ 'employerId': ?0, 'status': ?1 }")
    List<Contract> findByEmployerIdAndStatus(String employerId, String status);
    
    /**
     * Find contracts with total escrow amount > threshold
     */
    @Query("{ 'escrowTotalHeld': { $gt: ?0 } }")
    List<Contract> findContractsWithEscrow(Double minEscrow);
    
    /**
     * Count active contracts for employer
     */
    @Query("{ 'employerId': ?0, 'status': 'ACTIVE' }")
    Long countActiveContractsByEmployer(String employerId);
    
    /**
     * Count completed contracts for employer
     */
    @Query("{ 'employerId': ?0, 'status': 'COMPLETED' }")
    Long countCompletedContractsByEmployer(String employerId);
    
    /**
     * Check if contract exists between employer and freelancer for project
     */
    @Query("{ 'projectId': ?0, 'employerId': ?1, 'freelancerId': ?2 }")
    Optional<Contract> findExistingContract(String projectId, String employerId, String freelancerId);
    
    /**
     * Find contract by job ID (for ProposalService)
     */
    Optional<Contract> findByJobId(String jobId);
}
