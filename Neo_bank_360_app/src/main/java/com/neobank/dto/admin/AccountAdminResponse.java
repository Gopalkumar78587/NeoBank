package com.neobank.dto.admin;

import java.math.BigDecimal;

public record AccountAdminResponse(
        Long id,
        String accountNumber,
        String userEmail,
        BigDecimal balance,
        String status
) {}