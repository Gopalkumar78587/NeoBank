package com.neobank.dto.admin;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PendingApprovalDTO(
        Long id,
        String type,           // "LOAN_APPLICATION"
        String applicantName,
        String applicantEmail,
        String productName,
        BigDecimal requestedAmount,
        Integer requestedTenureMonths,
        LocalDateTime appliedAt
) {}
