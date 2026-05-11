package com.sabahub.repository;

import com.sabahub.domain.IdentityPolicyConfig;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface IdentityPolicyConfigRepository extends MongoRepository<IdentityPolicyConfig, String> {
}
