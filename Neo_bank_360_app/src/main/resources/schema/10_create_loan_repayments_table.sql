CREATE TABLE IF NOT EXISTS loan_repayments (
    id                   BIGINT          NOT NULL AUTO_INCREMENT,
    loan_account_id      BIGINT          NOT NULL,
    instalment_number    INT             NOT NULL,
    due_date             DATE            NOT NULL,
    emi_amount           DECIMAL(15, 2)  NOT NULL,
    principal_component  DECIMAL(15, 2)  NOT NULL,
    interest_component   DECIMAL(15, 2)  NOT NULL,
    payment_status       ENUM('PENDING','PAID','OVERDUE') NOT NULL DEFAULT 'PENDING',
    paid_at              TIMESTAMP       NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_repayment_loan_account FOREIGN KEY (loan_account_id) REFERENCES loan_accounts(id) ON DELETE CASCADE,
    INDEX idx_repayment_account_instalment (loan_account_id, instalment_number)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
