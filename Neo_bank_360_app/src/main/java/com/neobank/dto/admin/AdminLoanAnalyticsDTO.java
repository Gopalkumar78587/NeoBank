package com.neobank.dto.admin;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record AdminLoanAnalyticsDTO(
        String timeframe,
        Map<String, Long> distributionByStatus,
        List<ProductBreakdown> byProduct,
        long npaCount,
        BigDecimal npaRatio
) {
    public record ProductBreakdown(String productName, long pending, long approved, long rejected) {}
}
