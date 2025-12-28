package com.sabahub.repository;

import com.sabahub.domain.Proposal;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ProposalRepository extends MongoRepository<Proposal, String> {
    List<Proposal> findByJobId(String jobId);

    List<Proposal> findByFreelancerId(String freelancerId);

    Optional<Proposal> findByJobIdAndFreelancerId(String jobId, String freelancerId);
}
