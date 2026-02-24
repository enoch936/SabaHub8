package com.sabahub.repository;

import com.sabahub.domain.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends MongoRepository<Transaction, String> {
    List<Transaction> findByUserIdOrderByCreatedAtDesc(String userId);

    Optional<Transaction> findByProviderAndProviderRef(Transaction.Provider provider, String providerRef);

    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);

    Optional<Transaction> findByUserIdAndIdempotencyKey(String userId, String idempotencyKey);

    List<Transaction> findByCreatedAtAfter(Instant after);

    Page<Transaction> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    long countByUserIdAndProviderAndStatus(String userId, Transaction.Provider provider, Transaction.Status status);

    Page<Transaction> findByProviderAndStatusOrderByCreatedAtDesc(Transaction.Provider provider,
                                                                  Transaction.Status status,
                                                                  Pageable pageable);
}
