package com.neobank.dto.Account;

import java.math.BigDecimal;

/**
 * Customer-side Account DTO
 * Returns masked account number only
 */
public record AccountResponse(
        Long id,
        String maskedAccountNumber,
        String accountType,
        BigDecimal balance,
        String status,
        String closureStatus
) {}