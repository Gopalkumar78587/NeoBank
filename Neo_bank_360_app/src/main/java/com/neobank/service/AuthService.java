package com.neobank.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.neobank.dto.Auth.RegisterRequest;
import com.neobank.entity.User;
import com.neobank.enums.Role;
import com.neobank.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public void register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        boolean hasFullKyc =
                isNonBlank(request.getAadhaar()) &&
                isNonBlank(request.getPan()) &&
                request.getDateOfBirth() != null;

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER)
                .isActive(true)
                .phone(trim(request.getPhone()))
                .dateOfBirth(request.getDateOfBirth())
                .gender(trim(request.getGender()))
                .aadhaar(trim(request.getAadhaar()))
                .pan(trim(request.getPan() == null ? null : request.getPan().toUpperCase()))
                .addressLine(trim(request.getAddressLine()))
                .city(trim(request.getCity()))
                .state(trim(request.getState()))
                .pincode(trim(request.getPincode()))
                .country(trim(request.getCountry()))
                .occupation(trim(request.getOccupation()))
                .annualIncome(request.getAnnualIncome())
                .kycVerified(hasFullKyc)
                .build();

        userRepository.save(user);
    }

    private static String trim(String s) { return s == null ? null : s.trim(); }
    private static boolean isNonBlank(String s) { return s != null && !s.trim().isEmpty(); }
}

