package com.neobank.dto.admin;

import java.math.BigDecimal;

public record AdminDashboardDTO(
        long totalUsers,
        long totalActiveUsers,
        long totalLoans,
        long pendingApprovals,
        long totalTransactions,
        BigDecimal platformSavingsRate
) {}
