package com.neobank.dto.insights;

import java.math.BigDecimal;

public record TrendEntryDTO(
        String month,   // e.g. "Jan 2025"
        int year,
        int monthNumber,
        BigDecimal totalIncome,
        BigDecimal totalExpense
) {}
