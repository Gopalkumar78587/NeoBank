package com.neobank.dto.Budget;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BudgetCreateRequest {
    private String name;
    private String icon;
    private String color;
    private BigDecimal limit;
    private String period;
}
