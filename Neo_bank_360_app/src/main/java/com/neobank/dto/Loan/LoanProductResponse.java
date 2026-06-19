package com.neobank.dto.Loan;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record LoanProductResponse(
        Long id,
        String productName,
        BigDecimal minAmount,
        BigDecimal maxAmount,
        BigDecimal annualInterestRate,
        List<Integer> allowedTenures,
        LocalDateTime createdAt
) {}
