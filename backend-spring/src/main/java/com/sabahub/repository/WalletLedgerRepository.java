package com.sabahub.repository;

import com.sabahub.domain.WalletLedgerEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface WalletLedgerRepository extends MongoRepository<WalletLedgerEntry, String> {
    List<WalletLedgerEntry> findByUserIdOrderByCreatedAtAsc(String userId);
    List<WalletLedgerEntry> findByUserIdOrderByCreatedAtDesc(String userId);
    
    Page<WalletLedgerEntry> findByUserId(String userId, Pageable pageable);
    
    List<WalletLedgerEntry> findByUserIdAndReasonOrderByCreatedAtDesc(String userId, WalletLedgerEntry.Reason reason);
    
    long countByUserId(String userId);

    boolean existsByUserIdAndReferenceId(String userId, String referenceId);

    Optional<WalletLedgerEntry> findByUserIdAndReferenceId(String userId, String referenceId);
}
