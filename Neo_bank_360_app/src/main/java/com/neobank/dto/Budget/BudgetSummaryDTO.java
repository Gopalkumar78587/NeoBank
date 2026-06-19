package com.neobank.dto.Budget;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BudgetSummaryDTO {

    private String category;
    private BigDecimal limit;
    private BigDecimal spent;
    private BigDecimal remaining;
    private double utilization;
}
