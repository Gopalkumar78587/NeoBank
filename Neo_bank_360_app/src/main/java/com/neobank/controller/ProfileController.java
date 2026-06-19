package com.neobank.controller;

import com.neobank.dto.Account.AccountResponse;
import com.neobank.dto.profile.ProfileResponse;
import com.neobank.entity.User;
import com.neobank.repository.UserRepository;
import com.neobank.service.AccountService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/customer/profile")
@PreAuthorize("isAuthenticated()")
public class ProfileController {

    private static final Pattern AADHAAR = Pattern.compile("^\\d{12}$");
    private static final Pattern PAN = Pattern.compile("^[A-Z]{5}\\d{4}[A-Z]$");
    private static final Pattern PHONE = Pattern.compile("^[6-9]\\d{9}$");
    private static final Pattern PINCODE = Pattern.compile("^\\d{6}$");

    private final UserRepository userRepository;
    private final AccountService accountService;
    private final PasswordEncoder passwordEncoder;

    public ProfileController(
            UserRepository userRepository,
            AccountService accountService,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.accountService = accountService;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ProfileResponse profile(Authentication authentication) {
        User user = currentUser(authentication);
        return toResponse(user, accountService.getUserAccounts(user));
    }

    @PutMapping
    public ProfileResponse update(@RequestBody Map<String, Object> body,
                                  Authentication authentication) {

        User user = currentUser(authentication);

        // Basic identity (cannot change email; full name editable)
        setIfPresent(body, "fullName",      v -> user.setFullName(v.trim()));
        setIfPresent(body, "phone",         v -> { validate(PHONE, v, "phone"); user.setPhone(v); });
        setIfPresent(body, "gender",        v -> user.setGender(v.toUpperCase()));
        setIfPresent(body, "addressLine",   user::setAddressLine);
        setIfPresent(body, "city",          user::setCity);
        setIfPresent(body, "state",         user::setState);
        setIfPresent(body, "pincode",       v -> { validate(PINCODE, v, "pincode"); user.setPincode(v); });
        setIfPresent(body, "country",       user::setCountry);
        setIfPresent(body, "occupation",    user::setOccupation);

        // KYC ids — once set, lock them unless current value is blank
        setIfPresent(body, "aadhaar", v -> {
            validate(AADHAAR, v, "aadhaar");
            if (user.getAadhaar() != null && !user.getAadhaar().isBlank() && !user.getAadhaar().equals(v)) {
                throw new RuntimeException("Aadhaar already set and cannot be changed");
            }
            user.setAadhaar(v);
        });
        setIfPresent(body, "pan", v -> {
            String up = v.toUpperCase();
            validate(PAN, up, "pan");
            if (user.getPan() != null && !user.getPan().isBlank() && !user.getPan().equals(up)) {
                throw new RuntimeException("PAN already set and cannot be changed");
            }
            user.setPan(up);
        });

        // Date of birth
        Object dob = body.get("dateOfBirth");
        if (dob instanceof String s && !s.isBlank()) {
            user.setDateOfBirth(LocalDate.parse(s));
        }

        // Annual income
        Object inc = body.get("annualIncome");
        if (inc != null && !inc.toString().isBlank()) {
            user.setAnnualIncome(new BigDecimal(inc.toString()));
        }

        // Auto-flag KYC verified when both ids + dob present
        if (isFilled(user.getAadhaar()) && isFilled(user.getPan()) && user.getDateOfBirth() != null) {
            user.setKycVerified(true);
        }

        userRepository.save(user);
        return toResponse(user, accountService.getUserAccounts(user));
    }

    /** Upload (or replace) profile photo. Body: { "image": "data:image/png;base64,...." } */
    @PostMapping("/photo")
    public ResponseEntity<Map<String, Object>> uploadPhoto(@RequestBody Map<String, String> body,
                                                            Authentication authentication) {
        String image = body.get("image");
        if (image == null || image.isBlank()) {
            throw new RuntimeException("image is required");
        }
        if (!image.startsWith("data:image/")) {
            throw new RuntimeException("image must be a base64 data URL");
        }
        // Cap at ~2MB base64 payload (~1.5MB image)
        if (image.length() > 2_800_000) {
            throw new RuntimeException("Image too large (max 2MB)");
        }
        User user = currentUser(authentication);
        user.setProfilePhoto(image);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("ok", true, "size", image.length()));
    }

    /** Remove profile photo. */
    @DeleteMapping("/photo")
    public ResponseEntity<Map<String, Object>> removePhoto(Authentication authentication) {
        User user = currentUser(authentication);
        user.setProfilePhoto(null);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    /** Change password. Body: { "currentPassword": "...", "newPassword": "..." } */
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody Map<String, String> body,
                                                               Authentication authentication) {
        String current = body.get("currentPassword");
        String next = body.get("newPassword");
        if (current == null || next == null || current.isBlank() || next.isBlank()) {
            throw new RuntimeException("currentPassword and newPassword are required");
        }
        if (!next.matches("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$")) {
            throw new RuntimeException("New password does not meet complexity requirements");
        }
        User user = currentUser(authentication);
        if (!passwordEncoder.matches(current, user.getPasswordHash())) {
            throw new RuntimeException("Current password is incorrect");
        }
        if (passwordEncoder.matches(next, user.getPasswordHash())) {
            throw new RuntimeException("New password must differ from current password");
        }
        user.setPasswordHash(passwordEncoder.encode(next));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("ok", true, "message", "Password updated successfully"));
    }

    // ─── helpers ──────────────────────────────────────────────────────────────
    private User currentUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private ProfileResponse toResponse(User u, List<AccountResponse> accounts) {
        return new ProfileResponse(
                u.getFullName(),
                u.getEmail(),
                u.getPhone(),
                u.getDateOfBirth(),
                u.getGender(),
                maskAadhaar(u.getAadhaar()),
                u.getPan(),
                u.getAddressLine(),
                u.getCity(),
                u.getState(),
                u.getPincode(),
                u.getCountry(),
                u.getOccupation(),
                u.getAnnualIncome(),
                u.isKycVerified(),
                u.getProfilePhoto(),
                accounts
        );
    }

    private static String maskAadhaar(String a) {
        if (a == null || a.length() != 12) return a;
        return "XXXX-XXXX-" + a.substring(8);
    }

    private static void setIfPresent(Map<String, Object> body, String key, java.util.function.Consumer<String> setter) {
        Object v = body.get(key);
        if (v == null) return;
        String s = v.toString().trim();
        if (s.isEmpty()) return;
        setter.accept(s);
    }

    private static void validate(Pattern p, String value, String field) {
        if (!p.matcher(value).matches()) {
            throw new RuntimeException("Invalid format for " + field);
        }
    }

    private static boolean isFilled(String s) { return s != null && !s.isBlank(); }
}
