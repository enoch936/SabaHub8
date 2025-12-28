package com.sabahub.repository;

import com.sabahub.domain.Job;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface JobRepository extends MongoRepository<Job, String> {
    List<Job> findByEmployerId(String employerId);
}
