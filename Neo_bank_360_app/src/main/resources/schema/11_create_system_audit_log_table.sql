-- Sprint 5 / Day 41 - SystemAuditLog (FR-7.2)
CREATE TABLE IF NOT EXISTS system_audit_log (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    endpoint          VARCHAR(500) NOT NULL,
    http_method       VARCHAR(10)  NOT NULL,
    response_status   INT          NOT NULL,
    execution_time_ms BIGINT       NOT NULL,
    acting_user_id    BIGINT       NULL,
    event_timestamp   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    error_message     VARCHAR(1000) NULL,
    PRIMARY KEY (id),
    INDEX idx_audit_status    (response_status),
    INDEX idx_audit_timestamp (event_timestamp)
);

-- BR-01 composite indexes for high-frequency analytics filters
CREATE INDEX IF NOT EXISTS idx_txn_account_date ON transactions (account_id, created_at);
