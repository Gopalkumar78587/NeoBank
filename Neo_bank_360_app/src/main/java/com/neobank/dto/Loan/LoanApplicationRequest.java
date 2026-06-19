package com.neobank.dto.Loan;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoanApplicationRequest {

    @NotNull(message = "Loan product ID is required")
    private Long loanProductId;

    @NotNull(message = "Requested amount is required")
    @DecimalMin(value = "1.0", message = "Requested amount must be greater than 0")
    private BigDecimal requestedAmount;

    @NotNull(message = "Requested tenure is required")
    @Min(value = 1, message = "Tenure must be at least 1 month")
    private Integer requestedTenureMonths;
}
