package com.neobank.dto.Loan;

import com.neobank.enums.LoanApplicationStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record LoanApplicationResponse(
        Long id,
        Long loanProductId,
        String productName,
        BigDecimal requestedAmount,
        Integer requestedTenureMonths,
        LoanApplicationStatus status,
        String adminRemarks,
        LocalDateTime appliedAt,
        LocalDateTime decidedAt,
        String applicantName,
        String applicantEmail
) {}
