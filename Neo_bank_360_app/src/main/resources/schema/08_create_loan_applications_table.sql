CREATE TABLE IF NOT EXISTS loan_applications (
    id                       BIGINT          NOT NULL AUTO_INCREMENT,
    user_id                  BIGINT          NOT NULL,
    loan_product_id          BIGINT          NOT NULL,
    requested_amount         DECIMAL(15, 2)  NOT NULL,
    requested_tenure_months  INT             NOT NULL,
    status                   ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    admin_remarks            VARCHAR(500),
    applied_at               TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decided_at               TIMESTAMP       NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_loan_app_user    FOREIGN KEY (user_id)         REFERENCES users(id)          ON DELETE CASCADE,
    CONSTRAINT fk_loan_app_product FOREIGN KEY (loan_product_id) REFERENCES loan_products(id)  ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
