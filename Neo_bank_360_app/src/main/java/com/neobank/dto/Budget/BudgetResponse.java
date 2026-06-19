package com.neobank.dto.Budget;

import java.math.BigDecimal;

public record BudgetResponse(
        Long id,
        String name,
        String icon,
        String color,
        BigDecimal limit,
        BigDecimal spent,
        String period,
        String createdAt
) {}
