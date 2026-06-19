package com.neobank.service;

import com.neobank.entity.OtpVerification;
import com.neobank.repository.OtpRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

    @Mock
    private OtpRepository otpRepository;

    @InjectMocks
    private OtpService otpService;

    // ─── generateOtp ─────────────────────────────────────────────

    @Test
    void generateOtp_invalidatesOldAndSavesNew() {
        doNothing().when(otpRepository).invalidateAllByEmail("gopal@neobank.in");
        when(otpRepository.save(any(OtpVerification.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        otpService.generateOtp("gopal@neobank.in");

        verify(otpRepository).invalidateAllByEmail("gopal@neobank.in");
        verify(otpRepository).save(argThat(otp ->
                "gopal@neobank.in".equals(otp.getEmail())
                && !otp.isUsed()
                && otp.getOtp() != null
                && otp.getOtp().length() == 6
        ));
    }

    // ─── verifyOtp ───────────────────────────────────────────────

    @Test
    void verifyOtp_validOtp_marksAsUsed() {
        OtpVerification record = OtpVerification.builder()
                .id(1L)
                .email("gopal@neobank.in")
                .otp("123456")
                .used(false)
                .expiresAt(LocalDateTime.now().plusMinutes(1))
                .build();

        when(otpRepository.findByEmailAndOtpAndUsedFalseAndExpiresAtAfter(
                eq("gopal@neobank.in"), eq("123456"), any(LocalDateTime.class)))
                .thenReturn(Optional.of(record));
        when(otpRepository.save(record)).thenReturn(record);

        otpService.verifyOtp("gopal@neobank.in", "123456");

        assertTrue(record.isUsed());
        verify(otpRepository).save(record);
    }

    @Test
    void verifyOtp_invalidOtp_throws() {
        when(otpRepository.findByEmailAndOtpAndUsedFalseAndExpiresAtAfter(
                eq("gopal@neobank.in"), eq("000000"), any(LocalDateTime.class)))
                .thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> otpService.verifyOtp("gopal@neobank.in", "000000"));
        assertEquals("Invalid or expired OTP", ex.getMessage());
    }

    // ─── isOtpVerified ───────────────────────────────────────────

    @Test
    void isOtpVerified_returnsTrue_whenLatestOtpIsUsed() {
        OtpVerification used = OtpVerification.builder()
                .email("gopal@neobank.in")
                .otp("123456")
                .used(true)
                .build();
        when(otpRepository.findTopByEmailOrderByExpiresAtDesc("gopal@neobank.in"))
                .thenReturn(Optional.of(used));

        assertTrue(otpService.isOtpVerified("gopal@neobank.in"));
    }

    @Test
    void isOtpVerified_returnsFalse_whenLatestOtpIsNotUsed() {
        OtpVerification notUsed = OtpVerification.builder()
                .email("gopal@neobank.in")
                .otp("654321")
                .used(false)
                .build();
        when(otpRepository.findTopByEmailOrderByExpiresAtDesc("gopal@neobank.in"))
                .thenReturn(Optional.of(notUsed));

        assertFalse(otpService.isOtpVerified("gopal@neobank.in"));
    }

    @Test
    void isOtpVerified_returnsFalse_whenNoOtpExists() {
        when(otpRepository.findTopByEmailOrderByExpiresAtDesc("norecord@neobank.in"))
                .thenReturn(Optional.empty());

        assertFalse(otpService.isOtpVerified("norecord@neobank.in"));
    }
}
