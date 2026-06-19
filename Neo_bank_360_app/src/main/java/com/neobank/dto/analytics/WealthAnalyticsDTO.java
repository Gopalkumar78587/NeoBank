package com.neobank.dto.analytics;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record WealthAnalyticsDTO(
        Long userId,
        List<NetWorthPoint> netWorthTimeline,
        List<LoanPayoffForecast> loanPayoffForecast,
        List<RewardAccrualPoint> rewardAccrualHistory
) {
    public record NetWorthPoint(
            String month,
            BigDecimal totalBalance,
            BigDecimal outstandingPrincipal,
            BigDecimal netWorth
    ) {}

    public record LoanPayoffForecast(
            Long loanAccountId,
            String productName,
            int monthsRemaining,
            LocalDate projectedPayoffDate,
            BigDecimal outstandingPrincipal
    ) {}

    public record RewardAccrualPoint(String month, int points) {}
}
