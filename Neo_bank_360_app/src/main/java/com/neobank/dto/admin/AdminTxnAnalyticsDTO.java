package com.neobank.dto.admin;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record AdminTxnAnalyticsDTO(
        String timeframe,
        List<DailyPoint> dailyVolumes,
        BigDecimal averageTicketSize,
        BigDecimal totalInflow,
        BigDecimal totalOutflow,
        long transactionCount
) {
    public record DailyPoint(LocalDate date, BigDecimal inflow, BigDecimal outflow) {}
}
