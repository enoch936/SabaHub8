package com.sabahub.repository;

import com.sabahub.domain.WalletLedgerEntry;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface WalletLedgerRepository extends MongoRepository<WalletLedgerEntry, String> {
    List<WalletLedgerEntry> findByUserIdOrderByCreatedAtAsc(String userId);
}
