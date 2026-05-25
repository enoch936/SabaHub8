package com.sabahub.repository;

import com.sabahub.domain.ApiToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ApiTokenRepository extends MongoRepository<ApiToken, String> {
    List<ApiToken> findByUserId(String userId);
    List<ApiToken> findByActiveTrue();
}
