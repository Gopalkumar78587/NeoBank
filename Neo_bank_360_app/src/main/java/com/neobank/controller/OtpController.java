package com.neobank.controller;

import com.neobank.service.OtpService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * General-purpose OTP endpoints for the logged-in customer.
 * Used by transfer, transaction confirmation, account closure, etc.
 */
@RestController
@RequestMapping("/api/customer/otp")
@PreAuthorize("isAuthenticated()")
public class OtpController {

    private final OtpService otpService;

    public OtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    @PostMapping("/send")
    public ResponseEntity<Map<String, String>> send(Authentication authentication) {
        otpService.generateOtp(authentication.getName());
        return ResponseEntity.ok(Map.of(
                "message", "OTP sent successfully",
                "email", authentication.getName()
        ));
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, String>> verify(
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        String otp = body.get("otp");
        if (otp == null || otp.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "OTP is required"));
        }

        otpService.verifyOtp(authentication.getName(), otp);
        return ResponseEntity.ok(Map.of("message", "OTP verified"));
    }
}
