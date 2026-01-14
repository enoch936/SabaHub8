package com.sabahub.repository;

import com.sabahub.domain.Withdrawal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WithdrawalRepository extends MongoRepository<Withdrawal, String> {
    
    List<Withdrawal> findByFreelancerId(String freelancerId);
    
    @Query("{ 'freelancerId': ?0, 'status': ?1 }")
    List<Withdrawal> findByFreelancerIdAndStatus(String freelancerId, String status);
    
    @Query("{ 'status': 'PENDING' }")
    List<Withdrawal> findPendingWithdrawals();

    // New userId-based queries
    Page<Withdrawal> findByUserId(String userId, Pageable pageable);
    
    List<Withdrawal> findByUserId(String userId);
    
    long countByUserIdAndStatus(String userId, Withdrawal.Status status);
}
