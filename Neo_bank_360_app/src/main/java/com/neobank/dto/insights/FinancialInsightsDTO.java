package com.neobank.dto.insights;

import java.math.BigDecimal;
import java.util.List;

public record FinancialInsightsDTO(
        Long userId,
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        BigDecimal savings,
        List<TrendEntryDTO> trendSummary
) {}
