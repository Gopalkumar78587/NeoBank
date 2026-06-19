package com.neobank.dto.analytics;

import java.math.BigDecimal;
import java.util.List;

public record SpendingAnalyticsDTO(
        Long userId,
        int months,
        List<CategorySpending> categorySpending
) {
    public record CategorySpending(
            String category,
            BigDecimal budgetLimit,
            List<MonthlyAmount> monthly,
            BigDecimal totalSpent
    ) {}

    public record MonthlyAmount(String month, BigDecimal amount) {}
}
