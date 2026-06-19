package com.neobank.service;

import com.neobank.entity.OtpVerification;
import com.neobank.repository.OtpRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class OtpService {

    private final OtpRepository otpRepository;

    private static final SecureRandom secureRandom = new SecureRandom();

    public OtpService(OtpRepository otpRepository) {
        this.otpRepository = otpRepository;
    }

    // ✅ GENERATE OTP
    @Transactional
    public void generateOtp(String email) {

        String otp = String.valueOf(
                100000 + secureRandom.nextInt(900000)
        );

        // ✅ Invalidate old OTPs
        otpRepository.invalidateAllByEmail(email);

        OtpVerification record = OtpVerification.builder()
                .email(email)
                .otp(otp)
                .expiresAt(LocalDateTime.now().plusMinutes(2))
                .used(false)
                .build();

        otpRepository.save(record);

        // ===== TEMP CONSOLE OUTPUT (replace with email service later) =====
        System.out.println();
        System.out.println("==========================================");
        System.out.println(" OTP GENERATED");
        System.out.println("   Email: " + email);
        System.out.println("   OTP  : " + otp);
        System.out.println("   Valid: 2 minutes");
        System.out.println("==========================================");
        System.out.println();
    }

    // ✅ VERIFY OTP
    @Transactional
    public void verifyOtp(String email, String otp) {

        OtpVerification record = otpRepository
                .findByEmailAndOtpAndUsedFalseAndExpiresAtAfter(
                        email,
                        otp,
                        LocalDateTime.now()
                )
                .orElseThrow(() ->
                        new RuntimeException("Invalid or expired OTP")
                );

        record.setUsed(true);
        otpRepository.save(record);
    }
    public boolean isOtpVerified(String email) {

        return otpRepository
                .findTopByEmailOrderByExpiresAtDesc(email)
                .map(o -> o.isUsed())
                .orElse(false);
    }

}