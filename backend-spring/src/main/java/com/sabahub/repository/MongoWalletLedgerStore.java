package com.sabahub.repository;

import com.sabahub.domain.WalletLedgerEntry;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "sabahub.payment.store", havingValue = "mongo", matchIfMissing = true)
public class MongoWalletLedgerStore implements WalletLedgerStore {

    private final WalletLedgerRepository walletLedgerRepository;

    @Override
    public List<WalletLedgerEntry> findByUserIdOrderByCreatedAtAsc(String userId) {
        return walletLedgerRepository.findByUserIdOrderByCreatedAtAsc(userId);
    }

    @Override
    public List<WalletLedgerEntry> findByUserIdOrderByCreatedAtDesc(String userId) {
        return walletLedgerRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public Optional<WalletLedgerEntry> findByUserIdAndReferenceId(String userId, String referenceId) {
        return walletLedgerRepository.findByUserIdAndReferenceId(userId, referenceId);
    }

    @Override
    public boolean existsByUserIdAndReferenceId(String userId, String referenceId) {
        return walletLedgerRepository.existsByUserIdAndReferenceId(userId, referenceId);
    }

    @Override
    public WalletLedgerEntry save(WalletLedgerEntry entry) {
        return walletLedgerRepository.save(entry);
    }

    @Override
    public WalletLedgerEntry importEntry(WalletLedgerEntry entry) {
        return walletLedgerRepository.save(entry);
    }
}
