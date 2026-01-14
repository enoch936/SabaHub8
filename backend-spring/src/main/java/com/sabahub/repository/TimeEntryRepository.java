package com.sabahub.repository;

import com.sabahub.domain.TimeEntry;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TimeEntryRepository extends MongoRepository<TimeEntry, String> {
    
    List<TimeEntry> findByContractId(String contractId);
    
    List<TimeEntry> findByFreelancerId(String freelancerId);
    
    @Query("{ 'freelancerId': ?0, 'status': ?1 }")
    List<TimeEntry> findByFreelancerIdAndStatus(String freelancerId, String status);
    
    @Query("{ 'contractId': ?0, 'status': 'SUBMITTED' }")
    List<TimeEntry> findSubmittedEntriesByContract(String contractId);
    
    @Query("{ 'freelancerId': ?0, 'startTime': { $gte: ?1, $lte: ?2 } }")
    List<TimeEntry> findByFreelancerAndDateRange(String freelancerId, LocalDateTime start, LocalDateTime end);
}
