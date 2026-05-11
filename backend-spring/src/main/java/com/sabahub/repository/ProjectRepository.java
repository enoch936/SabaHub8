package com.sabahub.repository;

import com.sabahub.domain.Project;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface ProjectRepository extends MongoRepository<Project, String> {
    
    /**
     * Find all projects by employer ID
     */
    List<Project> findByEmployerId(String employerId);
    
    /**
     * Find all projects by employer with pagination
     */
    Page<Project> findByEmployerId(String employerId, Pageable pageable);
    
    /**
     * Find all open projects
     */
    @Query("{ 'status': 'OPEN' }")
    List<Project> findOpenProjects();
    
    /**
     * Find projects by category
     */
    List<Project> findByCategory(String category);
    
    /**
     * Find public projects
     */
    @Query("{ 'isPrivate': false, 'status': 'OPEN' }")
    List<Project> findPublicOpenProjects();
    
    /**
     * Find projects by privacy setting
     */
    List<Project> findByIsPrivate(Boolean isPrivate);
    
    /**
     * Search projects by title and description
     */
    @Query("{ $or: [ { 'title': { $regex: ?0, $options: 'i' } }, { 'description': { $regex: ?0, $options: 'i' } } ] }")
    List<Project> searchProjects(String query);
    
    /**
     * Find projects with specific skill requirements
     */
    @Query("{ 'requiredSkills': { $in: [?0] } }")
    List<Project> findProjectsBySkill(String skill);
    
    /**
     * Find projects with budget in range
     */
    @Query("{ 'budget': { $gte: ?0, $lte: ?1 } }")
    List<Project> findProjectsByBudgetRange(Double minBudget, Double maxBudget);
    
    /**
     * Find projects with multiple status
     */
    @Query("{ 'status': { $in: ?0 } }")
    List<Project> findProjectsByStatus(List<String> statuses);
    
    /**
     * Find projects by employer with specific status
     */
    @Query("{ 'employerId': ?0, 'status': ?1 }")
    List<Project> findByEmployerIdAndStatus(String employerId, String status);
    
    /**
     * Find projects in progress for employer
     */
    @Query("{ 'employerId': ?0, 'status': 'IN_PROGRESS' }")
    List<Project> findInProgressProjectsByEmployer(String employerId);
    
    /**
     * Find completed projects by employer
     */
    @Query("{ 'employerId': ?0, 'status': 'COMPLETED' }")
    List<Project> findCompletedProjectsByEmployer(String employerId);
    
    /**
     * Find projects expiring soon (deadline within 7 days)
     */
    @Query("{ 'status': 'OPEN', 'deadline': { $gt: new Date(), $lt: new Date(new Date().getTime() + 7*24*60*60*1000) } }")
    List<Project> findProjectsExpiringsoon();
    
    /**
     * Count projects by employer
     */
    Long countByEmployerId(String employerId);
    
    /**
     * Count open projects by employer
     */
    @Query("{ 'employerId': ?0, 'status': 'OPEN' }")
    Long countOpenProjectsByEmployer(String employerId);
}
