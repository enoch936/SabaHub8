package com.sabahub.repository;

import com.sabahub.domain.Contract;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ContractRepository extends MongoRepository<Contract, String> {
    List<Contract> findByEmployerId(String employerId);

    List<Contract> findByFreelancerId(String freelancerId);

    Optional<Contract> findByJobId(String jobId);
}
