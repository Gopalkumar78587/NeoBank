package com.neobank.dto.Loan;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoanDecisionRequest {

    @NotNull(message = "Decision is required")
    private String decision;   // "APPROVED" or "REJECTED"

    private String adminRemarks;
}
