package com.sabahub.repository;

import com.sabahub.domain.WalletLedgerEntry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "sabahub.payment.store", havingValue = "postgres")
public class PostgresWalletLedgerStore implements WalletLedgerStore {

    private static final String SELECT_COLUMNS = """
            id, user_id, currency, type, reason, amount, reference_id, balance_after, created_at
            """;

    private final JdbcTemplate jdbcTemplate;
    private final WalletLedgerRepository mongoMirror;

    @Override
    @Transactional(readOnly = true)
    public List<WalletLedgerEntry> findByUserIdOrderByCreatedAtAsc(String userId) {
        return jdbcTemplate.query(
                "SELECT " + SELECT_COLUMNS + " FROM wallet_ledger_entries WHERE user_id = ? ORDER BY created_at ASC, id ASC",
                this::mapRow,
                requireUserId(userId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<WalletLedgerEntry> findByUserIdOrderByCreatedAtDesc(String userId) {
        return jdbcTemplate.query(
                "SELECT " + SELECT_COLUMNS + " FROM wallet_ledger_entries WHERE user_id = ? ORDER BY created_at DESC, id DESC",
                this::mapRow,
                requireUserId(userId));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<WalletLedgerEntry> findByUserIdAndReferenceId(String userId, String referenceId) {
        String reference = normalizeReference(referenceId);
        if (reference == null) {
            return Optional.empty();
        }
        List<WalletLedgerEntry> rows = jdbcTemplate.query(
                "SELECT " + SELECT_COLUMNS + " FROM wallet_ledger_entries WHERE user_id = ? AND reference_id = ?",
                this::mapRow,
                requireUserId(userId),
                reference);
        return rows.stream().findFirst();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByUserIdAndReferenceId(String userId, String referenceId) {
        String reference = normalizeReference(referenceId);
        if (reference == null) {
            return false;
        }
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM wallet_ledger_entries WHERE user_id = ? AND reference_id = ?",
                Integer.class,
                requireUserId(userId),
                reference);
        return count != null && count > 0;
    }

    @Override
    @Transactional
    public WalletLedgerEntry save(WalletLedgerEntry entry) {
        return persist(entry, true);
    }

    @Override
    @Transactional
    public WalletLedgerEntry importEntry(WalletLedgerEntry entry) {
        return persist(entry, false);
    }

    private WalletLedgerEntry persist(WalletLedgerEntry entry, boolean mirrorToMongo) {
        if (entry == null) {
            throw new IllegalArgumentException("ledger entry is required");
        }
        String userId = requireUserId(entry.getUserId());
        String currency = normalizeCurrency(entry.getCurrency());
        WalletLedgerEntry.Type type = entry.getType();
        if (type == null) {
            throw new IllegalArgumentException("ledger type is required");
        }
        if (entry.getReason() == null) {
            throw new IllegalArgumentException("ledger reason is required");
        }
        BigDecimal amount = normalizeAmount(entry.getAmount());
        String reference = normalizeReference(entry.getReferenceId());
        UUID id = resolveId(entry.getId());
        Instant createdAt = entry.getCreatedAt() == null ? Instant.now() : entry.getCreatedAt();
        BigDecimal delta = type == WalletLedgerEntry.Type.CREDIT ? amount : amount.negate();

        String insertSql;
        Object[] insertArgs;
        if (reference == null) {
            insertSql = """
                    INSERT INTO wallet_ledger_entries
                        (id, user_id, currency, type, reason, amount, reference_id, balance_after, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, NULL, 0, ?)
                    RETURNING id
                    """;
            insertArgs = new Object[]{id, userId, currency, type.name(), entry.getReason().name(),
                    amount, Timestamp.from(createdAt)};
        } else {
            insertSql = """
                    INSERT INTO wallet_ledger_entries
                        (id, user_id, currency, type, reason, amount, reference_id, balance_after, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
                    ON CONFLICT (user_id, reference_id) WHERE reference_id IS NOT NULL DO NOTHING
                    RETURNING id
                    """;
            insertArgs = new Object[]{id, userId, currency, type.name(), entry.getReason().name(),
                    amount, reference, Timestamp.from(createdAt)};
        }

        List<UUID> insertedIds = jdbcTemplate.query(insertSql,
                (rs, rowNum) -> rs.getObject("id", UUID.class), insertArgs);
        WalletLedgerEntry saved;
        if (insertedIds.isEmpty()) {
            saved = findByUserIdAndReferenceId(userId, reference)
                    .orElseThrow(() -> new IllegalStateException("ledger entry conflict could not be resolved"));
        } else {
            UUID ledgerId = insertedIds.getFirst();
            jdbcTemplate.update("""
                    INSERT INTO wallet_accounts (user_id, currency, balance)
                    VALUES (?, ?, 0)
                    ON CONFLICT (user_id, currency) DO NOTHING
                    """, userId, currency);
            BigDecimal currentBalance = jdbcTemplate.queryForObject(
                    "SELECT balance FROM wallet_accounts WHERE user_id = ? AND currency = ? FOR UPDATE",
                    BigDecimal.class, userId, currency);
            if (currentBalance == null) {
                throw new IllegalStateException("wallet account could not be initialized");
            }
            if (type == WalletLedgerEntry.Type.DEBIT && currentBalance.compareTo(amount) < 0) {
                throw new IllegalStateException("Insufficient available balance");
            }
            BigDecimal nextBalance = currentBalance.add(delta);
            jdbcTemplate.update("""
                    UPDATE wallet_accounts
                    SET balance = ?, version = version + 1, updated_at = now()
                    WHERE user_id = ? AND currency = ?
                    """, nextBalance, userId, currency);
            jdbcTemplate.update("UPDATE wallet_ledger_entries SET balance_after = ? WHERE id = ?",
                    nextBalance, ledgerId);
            saved = jdbcTemplate.queryForObject(
                    "SELECT " + SELECT_COLUMNS + " FROM wallet_ledger_entries WHERE id = ?",
                    this::mapRow,
                    ledgerId);
        }
        if (mirrorToMongo) {
            mirror(saved);
        }
        return saved;
    }

    private void mirror(WalletLedgerEntry entry) {
        try {
            if (entry.getReferenceId() == null || entry.getReferenceId().isBlank()
                    || mongoMirror.findByUserIdAndReferenceId(entry.getUserId(), entry.getReferenceId()).isEmpty()) {
                mongoMirror.save(entry);
            }
        } catch (RuntimeException ex) {
            log.warn("Postgres ledger saved but Mongo mirror failed for user {} reference {}: {}",
                    entry.getUserId(), entry.getReferenceId(), ex.getMessage());
        }
    }

    private WalletLedgerEntry mapRow(ResultSet rs, int rowNum) throws SQLException {
        WalletLedgerEntry entry = new WalletLedgerEntry();
        entry.setId(rs.getString("id"));
        entry.setUserId(rs.getString("user_id"));
        entry.setCurrency(rs.getString("currency"));
        entry.setType(WalletLedgerEntry.Type.valueOf(rs.getString("type")));
        entry.setReason(WalletLedgerEntry.Reason.valueOf(rs.getString("reason")));
        entry.setAmount(rs.getBigDecimal("amount").doubleValue());
        entry.setReferenceId(rs.getString("reference_id"));
        entry.setBalanceAfter(rs.getBigDecimal("balance_after").doubleValue());
        Timestamp createdAt = rs.getTimestamp("created_at");
        entry.setCreatedAt(createdAt == null ? null : createdAt.toInstant());
        return entry;
    }

    private String requireUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("ledger userId is required");
        }
        return userId.trim();
    }

    private String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            throw new IllegalArgumentException("ledger currency is required");
        }
        String normalized = currency.trim().toUpperCase(Locale.ROOT);
        if (normalized.length() != 3) {
            throw new IllegalArgumentException("invalid ledger currency");
        }
        return normalized;
    }

    private BigDecimal normalizeAmount(Double amount) {
        if (amount == null || !Double.isFinite(amount) || amount <= 0) {
            throw new IllegalArgumentException("ledger amount must be greater than zero");
        }
        return BigDecimal.valueOf(amount).setScale(2, RoundingMode.HALF_UP);
    }

    private String normalizeReference(String referenceId) {
        if (referenceId == null || referenceId.isBlank()) {
            return null;
        }
        String reference = referenceId.trim();
        if (reference.length() > 160) {
            throw new IllegalArgumentException("ledger reference is too long");
        }
        return reference;
    }

    private UUID resolveId(String id) {
        if (id != null && !id.isBlank()) {
            try {
                return UUID.fromString(id);
            } catch (IllegalArgumentException ignored) {
                // Legacy Mongo ids are not UUIDs; generate a Postgres-native id.
            }
        }
        return UUID.randomUUID();
    }
}
