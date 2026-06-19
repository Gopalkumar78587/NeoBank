CREATE TABLE IF NOT EXISTS loan_accounts (
    id                   BIGINT          NOT NULL AUTO_INCREMENT,
    loan_application_id  BIGINT          NOT NULL,
    user_id              BIGINT          NOT NULL,
    principal_amount     DECIMAL(15, 2)  NOT NULL,
    annual_interest_rate DECIMAL(5, 2)   NOT NULL,
    tenure_months        INT             NOT NULL,
    emi_amount           DECIMAL(15, 2)  NOT NULL,
    disbursed_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_loan_account_application (loan_application_id),
    CONSTRAINT fk_loan_account_application FOREIGN KEY (loan_application_id) REFERENCES loan_applications(id) ON DELETE RESTRICT,
    CONSTRAINT fk_loan_account_user        FOREIGN KEY (user_id)             REFERENCES users(id)             ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
