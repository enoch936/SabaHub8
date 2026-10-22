package com.sabahub.service;

import com.sabahub.domain.WalletLedgerEntry;
import com.sabahub.repository.WalletLedgerRepository;
import com.sabahub.repository.WalletLedgerStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
@ConditionalOnProperty(name = "sabahub.payment.store", havingValue = "postgres")
public class PaymentLedgerBackfillRunner implements ApplicationRunner {

    private final WalletLedgerRepository mongoLedger;
    private final WalletLedgerStore walletLedgerStore;

    @org.springframework.beans.factory.annotation.Value("${sabahub.payment.backfill:false}")
    private boolean backfillEnabled;

    @Override
    public void run(ApplicationArguments args) {
        if (!backfillEnabled) {
            return;
        }
        var entries = mongoLedger.findAllByOrderByCreatedAtAsc();
        int imported = 0;
        int skipped = 0;
        for (WalletLedgerEntry entry : entries) {
            try {
                if (entry.getReferenceId() != null && !entry.getReferenceId().isBlank()
                        && walletLedgerStore.existsByUserIdAndReferenceId(entry.getUserId(), entry.getReferenceId())) {
                    skipped++;
                    continue;
                }
                walletLedgerStore.importEntry(entry);
                imported++;
            } catch (RuntimeException ex) {
                log.error("Failed to import ledger entry {} for user {}: {}",
                        entry.getId(), entry.getUserId(), ex.getMessage());
            }
        }
        log.info("Wallet ledger backfill finished: imported={}, skipped={}, total={}", imported, skipped, entries.size());
    }
}
