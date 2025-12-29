package com.sabahub.repository;

import com.sabahub.domain.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    List<User> findByCreatedAtAfter(Instant after);
}
