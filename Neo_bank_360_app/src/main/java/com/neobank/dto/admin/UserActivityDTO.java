package com.neobank.dto.admin;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record UserActivityDTO(
        Long userId,
        String fullName,
        String email,
        List<TxnEntry> recentTransactions
) {
    public record TxnEntry(
            Long id,
            String type,
            BigDecimal amount,
            String description,
            LocalDateTime createdAt
    ) {}
}
