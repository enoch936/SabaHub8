package com.sabahub.repository;

import com.sabahub.domain.Freelancer;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface FreelancerRepository extends MongoRepository<Freelancer, String> {
    
    Optional<Freelancer> findByUserId(String userId);
    
    @Query("{ 'verificationStatus': 'VERIFIED' }")
    List<Freelancer> findVerifiedFreelancers();
    
    @Query("{ 'skills.name': { $in: ?0 } }")
    List<Freelancer> findBySkills(List<String> skills);
    
    @Query("{ 'categories': { $in: ?0 } }")
    List<Freelancer> findByCategories(List<String> categories);
    
    @Query("{ 'hourlyRate': { $gte: ?0, $lte: ?1 } }")
    List<Freelancer> findByHourlyRateRange(Double minRate, Double maxRate);
    
    @Query("{ 'rating': { $gte: ?0 } }")
    List<Freelancer> findByMinimumRating(Double minRating);
    
    @Query("{ 'availability': ?0 }")
    List<Freelancer> findByAvailability(String availability);
    
    @Query("{ 'isActive': true, 'verificationStatus': 'VERIFIED' }")
    Page<Freelancer> findActiveVerifiedFreelancers(Pageable pageable);
}
