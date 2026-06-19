CREATE TABLE IF NOT EXISTS loan_products (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    product_name        VARCHAR(255)    NOT NULL,
    min_amount          DECIMAL(15, 2)  NOT NULL,
    max_amount          DECIMAL(15, 2)  NOT NULL,
    annual_interest_rate DECIMAL(5, 2)  NOT NULL,
    allowed_tenures     VARCHAR(255)    NOT NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_loan_product_name (product_name),
    CONSTRAINT chk_loan_product_min_amount   CHECK (min_amount > 0),
    CONSTRAINT chk_loan_product_max_amount   CHECK (max_amount > min_amount),
    CONSTRAINT chk_loan_product_interest     CHECK (annual_interest_rate > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
