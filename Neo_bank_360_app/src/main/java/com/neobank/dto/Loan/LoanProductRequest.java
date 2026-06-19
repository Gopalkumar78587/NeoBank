package com.neobank.dto.Loan;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoanProductRequest {

    @NotBlank(message = "Product name is required")
    private String productName;

    @NotNull(message = "Minimum amount is required")
    @DecimalMin(value = "1.0", message = "Minimum amount must be greater than 0")
    private BigDecimal minAmount;

    @NotNull(message = "Maximum amount is required")
    @DecimalMin(value = "1.0", message = "Maximum amount must be greater than 0")
    private BigDecimal maxAmount;

    @NotNull(message = "Annual interest rate is required")
    @DecimalMin(value = "0.01", message = "Interest rate must be greater than 0")
    private BigDecimal annualInterestRate;

    @NotBlank(message = "Allowed tenures are required (comma-separated)")
    private String allowedTenures;
}
