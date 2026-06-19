package com.neobank.repository;

import com.neobank.entity.OtpVerification;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<OtpVerification, Long> {

    // ✅ Get latest OTP
    Optional<OtpVerification> findTopByEmailOrderByExpiresAtDesc(String email);

    // ✅ Validate OTP (used = false, not expired)
    Optional<OtpVerification> findByEmailAndOtpAndUsedFalseAndExpiresAtAfter(
            String email,
            String otp,
            LocalDateTime now
    );

    // ✅ Invalidate old OTPs
    @Modifying
    @Query("UPDATE OtpVerification o SET o.used = true WHERE o.email = :email")
    void invalidateAllByEmail(String email);
}
