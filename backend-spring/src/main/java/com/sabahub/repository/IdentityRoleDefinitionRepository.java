package com.sabahub.repository;

import com.sabahub.domain.IdentityRoleDefinition;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface IdentityRoleDefinitionRepository extends MongoRepository<IdentityRoleDefinition, String> {
    Optional<IdentityRoleDefinition> findByKey(String key);
    boolean existsByKey(String key);
}
