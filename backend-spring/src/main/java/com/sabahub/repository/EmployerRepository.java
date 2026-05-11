package com.sabahub.repository;

import com.sabahub.domain.Employer;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface EmployerRepository extends MongoRepository<Employer, String> {
    
    /**
     * Find employer by user ID
     */
    Optional<Employer> findByUserId(String userId);

    /**
     * Find employer workspace by team member user ID
     */
    @Query("{ 'teamMembers.userId': ?0 }")
    Optional<Employer> findByTeamMembersUserId(String userId);
    
    /**
     * Find all verified employers
     */
    @Query("{ 'kycStatus': 'VERIFIED' }")
    List<Employer> findVerifiedEmployers();
    
    /**
     * Find employers by company name (text search)
     */
    @Query("{ 'companyName': { $regex: ?0, $options: 'i' } }")
    List<Employer> findByCompanyNameContainingIgnoreCase(String companyName);
    
    /**
     * Find employers by industry
     */
    @Query("{ 'companyProfile.industry': ?0 }")
    List<Employer> findByCompanyProfileIndustry(String industry);
    
    /**
     * Find top employers by total spent
     */
    @Query("{ 'kycStatus': 'VERIFIED' }")
    List<Employer> findTopByTotalSpent();
    
    /**
     * Find employers with rating >= minimum
     */
    @Query("{ 'rating': { $gte: ?0 } }")
    List<Employer> findByRatingGreaterThanEqual(Double minRating);
    
    /**
     * Check if employer is verified
     */
    @Query("{ '_id': ?0, 'kycStatus': 'VERIFIED' }")
    Optional<Employer> findVerifiedEmployerById(String employerId);
}
