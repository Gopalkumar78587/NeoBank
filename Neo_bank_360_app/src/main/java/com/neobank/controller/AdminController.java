package com.neobank.controller;

import com.neobank.dto.admin.*;
import com.neobank.entity.Account;
import com.neobank.entity.AdminAuditLog;
import com.neobank.entity.Transaction;
import com.neobank.entity.User;
import com.neobank.enums.AccountClosureStatus;
import com.neobank.enums.AccountStatus;
import com.neobank.enums.LoanApplicationStatus;
import com.neobank.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.lang.management.ManagementFactory;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AccountRepository          accountRepo;
    private final AdminAuditLogRepository    auditRepo;
    private final UserRepository             userRepo;
    private final TransactionRepository      txnRepo;
    private final LoanApplicationRepository  loanAppRepo;

    public AdminController(AccountRepository accountRepo,
                           AdminAuditLogRepository auditRepo,
                           UserRepository userRepo,
                           TransactionRepository txnRepo,
                           LoanApplicationRepository loanAppRepo) {
        this.accountRepo  = accountRepo;
        this.auditRepo    = auditRepo;
        this.userRepo     = userRepo;
        this.txnRepo      = txnRepo;
        this.loanAppRepo  = loanAppRepo;
    }

    // ── Legacy stats (Sprint 1–3) ─────────────────────────────────────────────

    @GetMapping("/stats")
    public AdminStatsResponse getStats() {
        long active  = accountRepo.countByStatus(AccountStatus.ACTIVE);
        long frozen  = accountRepo.countByStatus(AccountStatus.FROZEN);
        long closed  = accountRepo.countByStatus(AccountStatus.CLOSED);
        long pending = accountRepo.countByClosureStatus(AccountClosureStatus.PENDING);
        long risky   = accountRepo.findAll().stream().filter(Account::isRiskFlag).count();
        long total   = active + frozen + closed;

        return new AdminStatsResponse(total, active, frozen, closed, pending, risky,
                userRepo.count(), txnRepo.count());
    }

    @GetMapping("/audit-logs")
    public Map<String, Object> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        var pageReq  = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "actionTime"));
        var pageData = auditRepo.findAll(pageReq);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("content",        pageData.getContent());
        body.put("totalElements",  pageData.getTotalElements());
        body.put("totalPages",     pageData.getTotalPages());
        body.put("page",           page);
        body.put("size",           size);
        return body;
    }

    // ── Sprint 4: Dashboard ───────────────────────────────────────────────────

    @GetMapping("/dashboard")
    public AdminDashboardDTO getDashboard() {
        long totalUsers        = userRepo.count();
        long totalActiveUsers  = userRepo.countByIsActive(true);
        long totalLoans        = loanAppRepo.count();
        long pendingApprovals  = loanAppRepo.countByStatus(LoanApplicationStatus.PENDING);
        long totalTransactions = txnRepo.count();

        BigDecimal totalIncome  = txnRepo.sumAllCredit();
        BigDecimal totalExpense = txnRepo.sumAllDebit();

        BigDecimal savingsRate = BigDecimal.ZERO;
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            savingsRate = totalIncome.subtract(totalExpense)
                                     .divide(totalIncome, 4, RoundingMode.HALF_UP)
                                     .multiply(BigDecimal.valueOf(100));
        }

        return new AdminDashboardDTO(totalUsers, totalActiveUsers, totalLoans,
                pendingApprovals, totalTransactions, savingsRate);
    }

    // ── Sprint 4: Pending approvals ───────────────────────────────────────────

    @GetMapping("/pending-approvals")
    public List<PendingApprovalDTO> getPendingApprovals(
            @RequestParam(required = false) String module) {

        return loanAppRepo.findByStatusOrderByAppliedAtDesc(LoanApplicationStatus.PENDING)
                .stream()
                .map(a -> new PendingApprovalDTO(
                        a.getId(),
                        "LOAN_APPLICATION",
                        a.getUser().getFullName(),
                        a.getUser().getEmail(),
                        a.getLoanProduct().getProductName(),
                        a.getRequestedAmount(),
                        a.getRequestedTenureMonths(),
                        a.getAppliedAt()))
                .collect(Collectors.toList());
    }

    // ── Sprint 4: System health ───────────────────────────────────────────────

    @GetMapping("/system-health")
    public Map<String, Object> getSystemHealth() {
        String dbStatus = "UP";
        try {
            txnRepo.count(); // lightweight health check
        } catch (Exception e) {
            dbStatus = "DOWN";
        }

        long uptimeSeconds = ManagementFactory.getRuntimeMXBean().getUptime() / 1000;

        Map<String, Object> health = new LinkedHashMap<>();
        health.put("dbStatus",            dbStatus);
        health.put("activeSessions",      0); // stateless JWT — not tracked
        health.put("serverUptimeSeconds", uptimeSeconds);
        return health;
    }

    // ── Sprint 4: User management ─────────────────────────────────────────────

    @GetMapping("/users")
    public Map<String, Object> getAllUsers(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        var pageReq  = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var pageData = userRepo.findAll(pageReq);

        List<UserAdminDTO> content = pageData.getContent().stream()
                .map(u -> new UserAdminDTO(u.getId(), u.getFullName(), u.getEmail(),
                        u.getRole().name(), u.isActive(), u.getCreatedAt()))
                .collect(Collectors.toList());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("content",       content);
        body.put("totalElements", pageData.getTotalElements());
        body.put("totalPages",    pageData.getTotalPages());
        body.put("page",          page);
        body.put("size",          size);
        return body;
    }

    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long userId,
                                               @RequestBody UserStatusRequest req,
                                               Authentication auth) {

        User actingAdmin = userRepo.findByEmail(auth.getName()).orElse(null);
        if (actingAdmin == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        // BR-03: admin cannot deactivate own account
        if (actingAdmin.getId().equals(userId) && !req.active()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Admin cannot deactivate own account"));
        }

        User target = userRepo.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));

        target.setActive(req.active());
        userRepo.save(target);

        // Audit log
        auditRepo.save(AdminAuditLog.builder()
                .adminEmail(actingAdmin.getEmail())
                .action(req.active() ? "ACTIVATE_USER" : "DEACTIVATE_USER")
                .accountId(userId)
                .remarks("User " + target.getEmail() + " set active=" + req.active())
                .actionTime(LocalDateTime.now())
                .build());

        return ResponseEntity.ok(Map.of("message", "User status updated",
                "userId", userId, "active", req.active()));
    }

    @GetMapping("/users/{userId}/activity")
    public UserActivityDTO getUserActivity(@PathVariable Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));

        List<Transaction> recent = txnRepo.findRecentByUserId(
                userId, PageRequest.of(0, 20));

        List<UserActivityDTO.TxnEntry> entries = recent.stream()
                .map(t -> new UserActivityDTO.TxnEntry(
                        t.getId(),
                        t.getType().name(),
                        t.getAmount(),
                        t.getDescription(),
                        t.getCreatedAt()))
                .collect(Collectors.toList());

        return new UserActivityDTO(user.getId(), user.getFullName(), user.getEmail(), entries);
    }
}
