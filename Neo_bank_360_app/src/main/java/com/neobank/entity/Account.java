package com.neobank.entity;

import com.neobank.enums.AccountClosureStatus;
import com.neobank.enums.AccountStatus;
import com.neobank.enums.AccountType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "accounts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountStatus status = AccountStatus.ACTIVE;

    @Column(name = "account_number", nullable = false, unique = true)
    private String accountNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountType accountType;

    @Column(nullable = false)
    private BigDecimal balance;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private LocalDateTime createdAt;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountClosureStatus closureStatus = AccountClosureStatus.NONE;

    @Builder.Default
    @Column(nullable = false)
    private BigDecimal perTransactionLimit = new BigDecimal("50000");

    @Builder.Default
    @Column(nullable = false)
    private BigDecimal dailyLimit = new BigDecimal("100000");

    // ✅ RISK FLAGS
    @Builder.Default
    @Column(nullable = false)
    private boolean riskFlag = false;

    private String riskReason;

    // ─── Account opening details (real-bank style) ───
    @Column(name = "nominee_name", length = 120)
    private String nomineeName;

    @Column(name = "nominee_relation", length = 40)
    private String nomineeRelation;

    @Column(name = "purpose", length = 120)
    private String purpose;

    @Column(name = "communication_mode", length = 20)
    private String communicationMode; // EMAIL | SMS | BOTH

    // ─── Additional real-bank opening fields ───
    @Column(name = "occupation", length = 80)
    private String occupation;

    @Column(name = "employment_status", length = 40)
    private String employmentStatus; // SALARIED | SELF_EMPLOYED | STUDENT | RETIRED | OTHER

    @Column(name = "branch_preference", length = 80)
    private String branchPreference;

    @Column(name = "nominee_dob")
    private LocalDate nomineeDob;

    @Column(name = "debit_card_required")
    private Boolean debitCardRequired;

    @Column(name = "cheque_book_required")
    private Boolean chequeBookRequired;

    @Column(name = "net_banking_required")
    private Boolean netBankingRequired;

    // Pending initial deposit (credited when admin approves the account opening)
    @Column(name = "pending_deposit", precision = 19, scale = 2)
    private BigDecimal pendingDeposit;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approved_by", length = 120)
    private String approvedBy;
}