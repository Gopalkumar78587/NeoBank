package com.neobank.service;

import com.neobank.entity.Account;
import com.neobank.entity.AdminAuditLog;
import com.neobank.entity.Transaction;
import com.neobank.enums.AccountClosureStatus;
import com.neobank.enums.AccountStatus;
import com.neobank.enums.TransactionType;
import com.neobank.repository.AccountRepository;
import com.neobank.repository.AdminAuditLogRepository;
import com.neobank.repository.TransactionRepository;

import jakarta.transaction.Transactional;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class AdminAccountService {

    private final AccountRepository accountRepo;
    private final AdminAuditLogRepository auditRepo;
    private final TransactionRepository transactionRepo;

    public AdminAccountService(AccountRepository accountRepo,
                               AdminAuditLogRepository auditRepo,
                               TransactionRepository transactionRepo) {
        this.accountRepo = accountRepo;
        this.auditRepo = auditRepo;
        this.transactionRepo = transactionRepo;
    }

    public List<Account> getAllAccounts() {
        return accountRepo.findAll();
    }

    public List<Account> getPendingOpenings() {
        return accountRepo.findAll().stream()
                .filter(a -> a.getStatus() == AccountStatus.PENDING_APPROVAL)
                .toList();
    }

    // ✅ RISK EVALUATION
    private void evaluateRisk(Account acc) {

        if (acc.getBalance().compareTo(new BigDecimal("500000")) > 0) {
            acc.setRiskFlag(true);
            acc.setRiskReason("High balance threshold crossed");
        }
    }

    private void audit(String admin, String action, Long accId, String remarks) {
        auditRepo.save(AdminAuditLog.builder()
                .adminEmail(admin)
                .action(action)
                .accountId(accId)
                .remarks(remarks)
                .actionTime(LocalDateTime.now())
                .build());
    }

    public void freeze(Long id, String adminEmail) {
        Account acc = accountRepo.findById(id).orElseThrow(() -> new RuntimeException("Account not found"));
        acc.setStatus(AccountStatus.FROZEN);
        acc.setRiskFlag(true);
        acc.setRiskReason("Frozen manually by admin");
        accountRepo.save(acc);
        audit(adminEmail, "FREEZE", id, "Account frozen");
    }

    public void activate(Long id, String adminEmail) {
        Account acc = accountRepo.findById(id).orElseThrow();
        acc.setStatus(AccountStatus.ACTIVE);
        acc.setRiskFlag(false);
        acc.setRiskReason(null);
        accountRepo.save(acc);
        audit(adminEmail, "ACTIVATE", id, "Account activated");
    }

    public void approveClosure(Long id, String adminEmail) {
        Account acc = accountRepo.findById(id).orElseThrow();
        acc.setStatus(AccountStatus.CLOSED);
        acc.setClosureStatus(AccountClosureStatus.APPROVED);
        evaluateRisk(acc);
        accountRepo.save(acc);
        audit(adminEmail, "APPROVE_CLOSURE", id, "Closure approved");
    }

    public void rejectClosure(Long id, String adminEmail) {
        Account acc = accountRepo.findById(id).orElseThrow();
        acc.setClosureStatus(AccountClosureStatus.REJECTED);
        acc.setStatus(AccountStatus.ACTIVE);
        accountRepo.save(acc);
        audit(adminEmail, "REJECT_CLOSURE", id, "Closure rejected");
    }

    // ─── Account-opening approval (real bank flow) ───
    public Account approveOpening(Long id, String adminEmail) {
        Account acc = accountRepo.findById(id).orElseThrow(() -> new RuntimeException("Account not found"));
        if (acc.getStatus() != AccountStatus.PENDING_APPROVAL) {
            throw new RuntimeException("Account is not pending approval");
        }
        BigDecimal deposit = acc.getPendingDeposit() == null ? BigDecimal.ZERO : acc.getPendingDeposit();

        acc.setStatus(AccountStatus.ACTIVE);
        acc.setBalance(deposit);
        acc.setPendingDeposit(BigDecimal.ZERO);
        acc.setApprovedAt(LocalDateTime.now());
        acc.setApprovedBy(adminEmail);
        accountRepo.save(acc);

        // Record initial-deposit transaction so the customer sees their opening balance.
        if (deposit.compareTo(BigDecimal.ZERO) > 0) {
            transactionRepo.save(Transaction.builder()
                    .account(acc)
                    .type(TransactionType.CREDIT)
                    .amount(deposit)
                    .balanceAfter(deposit)
                    .createdAt(LocalDateTime.now())
                    .description("Initial deposit on account opening")
                    .build());
        }

        audit(adminEmail, "APPROVE_OPENING", id, "Account opening approved");
        return acc;
    }

    public Account rejectOpening(Long id, String adminEmail, String reason) {
        Account acc = accountRepo.findById(id).orElseThrow(() -> new RuntimeException("Account not found"));
        if (acc.getStatus() != AccountStatus.PENDING_APPROVAL) {
            throw new RuntimeException("Account is not pending approval");
        }
        acc.setStatus(AccountStatus.REJECTED);
        acc.setRejectionReason(reason == null || reason.isBlank() ? "Application rejected by admin" : reason);
        acc.setApprovedAt(LocalDateTime.now());
        acc.setApprovedBy(adminEmail);
        accountRepo.save(acc);
        audit(adminEmail, "REJECT_OPENING", id, acc.getRejectionReason());
        return acc;
    }
}