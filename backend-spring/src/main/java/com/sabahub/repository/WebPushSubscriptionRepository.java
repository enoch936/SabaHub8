package com.sabahub.repository;

import com.sabahub.domain.WebPushSubscription;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface WebPushSubscriptionRepository extends MongoRepository<WebPushSubscription, String> {
    List<WebPushSubscription> findByUserId(String userId);

    Optional<WebPushSubscription> findByUserIdAndEndpoint(String userId, String endpoint);

    void deleteByUserIdAndEndpoint(String userId, String endpoint);
}
