package com.neobank.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.neobank.enums.Role;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    private Role role = Role.CUSTOMER;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // ─── KYC / Personal Details (all optional, populated post-registration) ───
    @Column(length = 15)
    private String phone;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(length = 10)
    private String gender;        // MALE | FEMALE | OTHER

    @Column(length = 12, unique = false) // unique enforced at app layer (legacy nulls allowed)
    private String aadhaar;       // 12 digits

    @Column(length = 10)
    private String pan;           // ABCDE1234F

    // ─── Address ───
    @Column(name = "address_line", length = 255)
    private String addressLine;

    @Column(length = 80)
    private String city;

    @Column(length = 80)
    private String state;

    @Column(length = 10)
    private String pincode;

    @Column(length = 80)
    private String country;

    // ─── Employment / Financial ───
    @Column(length = 60)
    private String occupation;

    @Column(name = "annual_income", precision = 15, scale = 2)
    private BigDecimal annualIncome;

    // ─── KYC status flag (set true when aadhaar+pan verified) ───
    @Column(name = "kyc_verified")
    private Boolean kycVerified = false;

    // ─── Profile photo stored as base64 data URL (LONGTEXT) ───
    @Lob
    @Column(name = "profile_photo", columnDefinition = "LONGTEXT")
    private String profilePhoto;

    /** Null-safe accessor — legacy rows may have NULL until backfilled. */
    public boolean isKycVerified() {
        return Boolean.TRUE.equals(kycVerified);
    }

    public void setKycVerified(boolean value) {
        this.kycVerified = value;
    }

    public boolean isActive() {
        return Boolean.TRUE.equals(isActive);
    }

    public void setActive(boolean value) {
        this.isActive = value;
    }
}
