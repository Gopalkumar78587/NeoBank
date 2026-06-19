package com.neobank.dto.Loan;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record LoanAccountResponse(
        Long id,
        Long loanApplicationId,
        String productName,
        BigDecimal principalAmount,
        BigDecimal annualInterestRate,
        Integer tenureMonths,
        BigDecimal emiAmount,
        LocalDateTime disbursedAt
) {}
