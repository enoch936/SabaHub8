package com.sabahub.repository;

import com.sabahub.domain.WalletLedgerEntry;

import java.util.List;
import java.util.Optional;

/**
 * Authoritative wallet ledger. The Postgres implementation is used when
 * {@code sabahub.payment.store=postgres}; Mongo remains the default fallback.
 */
public interface WalletLedgerStore {

    List<WalletLedgerEntry> findByUserIdOrderByCreatedAtAsc(String userId);

    List<WalletLedgerEntry> findByUserIdOrderByCreatedAtDesc(String userId);

    Optional<WalletLedgerEntry> findByUserIdAndReferenceId(String userId, String referenceId);

    boolean existsByUserIdAndReferenceId(String userId, String referenceId);

    WalletLedgerEntry save(WalletLedgerEntry entry);

    WalletLedgerEntry importEntry(WalletLedgerEntry entry);
}
