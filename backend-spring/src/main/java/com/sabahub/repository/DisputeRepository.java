package com.sabahub.repository;

import com.sabahub.domain.Dispute;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface DisputeRepository extends MongoRepository<Dispute, String> {
    List<Dispute> findByContractId(String contractId);
    List<Dispute> findByContractIdAndStatusIn(String contractId, List<Dispute.Status> statuses);

    List<Dispute> findByOpenedByUserId(String openedByUserId);

    List<Dispute> findByCreatedAtAfter(Instant after);
}
