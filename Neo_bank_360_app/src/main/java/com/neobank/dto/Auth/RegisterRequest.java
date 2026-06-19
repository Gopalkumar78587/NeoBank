package com.neobank.dto.Auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank
    private String fullName;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Pattern(
        regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$",
        message = "Password must contain uppercase, lowercase, digit, special character and be at least 8 characters"
    )
    private String password;

    // ─── Optional KYC fields (validated when provided) ───
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Phone must be a valid 10-digit Indian mobile number")
    private String phone;

    private LocalDate dateOfBirth;

    @Pattern(regexp = "^(MALE|FEMALE|OTHER)?$", message = "Gender must be MALE, FEMALE or OTHER")
    private String gender;

    @Pattern(regexp = "^(\\d{12})?$", message = "Aadhaar must be exactly 12 digits")
    private String aadhaar;

    @Pattern(regexp = "^([A-Z]{5}\\d{4}[A-Z])?$", message = "PAN must match format ABCDE1234F")
    private String pan;

    private String addressLine;
    private String city;
    private String state;

    @Pattern(regexp = "^(\\d{6})?$", message = "Pincode must be 6 digits")
    private String pincode;

    private String country;
    private String occupation;
    private BigDecimal annualIncome;
}

