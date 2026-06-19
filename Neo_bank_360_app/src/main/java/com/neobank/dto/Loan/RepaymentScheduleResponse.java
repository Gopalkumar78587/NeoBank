package com.neobank.dto.Loan;

import com.neobank.enums.RepaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record RepaymentScheduleResponse(
        Long id,
        Integer instalmentNumber,
        LocalDate dueDate,
        BigDecimal emiAmount,
        BigDecimal principalComponent,
        BigDecimal interestComponent,
        RepaymentStatus paymentStatus,
        LocalDateTime paidAt
) {}
