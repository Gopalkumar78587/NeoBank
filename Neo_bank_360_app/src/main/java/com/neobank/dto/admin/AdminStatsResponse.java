package com.neobank.dto.admin;

public record AdminStatsResponse(
        long totalAccounts,
        long activeAccounts,
        long frozenAccounts,
        long closedAccounts,
        long pendingClosures,
        long riskyAccounts,
        long totalUsers,
        long totalTransactions
) {}