package com.neobank.dto.Account;

import java.math.BigDecimal;

/**
 * Admin-side account monitoring DTO
 */
public record AccountAdminResponse(
        Long id,
        String accountNumber,
        String userEmail,
        BigDecimal balance,
        String status,
        String closureStatus
) {}
