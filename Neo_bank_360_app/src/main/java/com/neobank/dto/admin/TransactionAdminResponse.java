package com.neobank.dto.admin;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransactionAdminResponse(
        Long id,
        String accountNumber,
        String type,
        BigDecimal amount,
        BigDecimal balanceAfter,
        LocalDateTime createdAt
) {}