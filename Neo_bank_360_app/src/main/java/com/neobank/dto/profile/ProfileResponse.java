package com.neobank.dto.profile;

import com.neobank.dto.Account.AccountResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Extended profile payload. All KYC fields are nullable for legacy users
 * who registered before KYC capture existed.
 */
public record ProfileResponse(
        String fullName,
        String email,
        String phone,
        LocalDate dateOfBirth,
        String gender,
        String aadhaar,         // returned masked by controller
        String pan,
        String addressLine,
        String city,
        String state,
        String pincode,
        String country,
        String occupation,
        BigDecimal annualIncome,
        boolean kycVerified,
        String profilePhoto,    // data URL (base64) or null
        List<AccountResponse> accounts
) {}
