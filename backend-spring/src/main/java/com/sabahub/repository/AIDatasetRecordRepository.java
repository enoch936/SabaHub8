package com.sabahub.repository;

import com.sabahub.domain.AIDatasetRecord;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AIDatasetRecordRepository extends MongoRepository<AIDatasetRecord, String> {
    long countByDatasetType(String datasetType);
    long countByBatchId(String batchId);
}
