CREATE TABLE IF NOT EXISTS wallet_accounts (
    user_id VARCHAR(128) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    balance NUMERIC(19, 2) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, currency),
    CONSTRAINT wallet_balance_non_negative CHECK (balance >= 0)
);

CREATE TABLE IF NOT EXISTS wallet_ledger_entries (
    id UUID PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    type VARCHAR(8) NOT NULL,
    reason VARCHAR(48) NOT NULL,
    amount NUMERIC(19, 2) NOT NULL,
    reference_id VARCHAR(160),
    balance_after NUMERIC(19, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT wallet_ledger_amount_positive CHECK (amount > 0),
    CONSTRAINT wallet_ledger_type_valid CHECK (type IN ('CREDIT', 'DEBIT'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_wallet_reference_per_user
    ON wallet_ledger_entries (user_id, reference_id)
    WHERE reference_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_created
    ON wallet_ledger_entries (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_wallet_ledger_reason
    ON wallet_ledger_entries (user_id, reason, created_at);
