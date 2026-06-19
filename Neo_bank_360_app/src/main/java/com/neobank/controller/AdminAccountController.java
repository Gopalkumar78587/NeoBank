package com.neobank.controller;

import com.neobank.entity.Account;
import com.neobank.enums.AccountClosureStatus;
import com.neobank.enums.AccountStatus;
import com.neobank.repository.AccountRepository;
import com.neobank.service.AdminAccountService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/accounts")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAccountController {

    private final AdminAccountService service;
    private final AccountRepository accountRepository;

    public AdminAccountController(AdminAccountService service,
                                  AccountRepository accountRepository) {
        this.service = service;
        this.accountRepository = accountRepository;
    }

    // ✅ GET ALL ACCOUNTS
    @GetMapping
    public List<Account> getAllAccounts() {
        return service.getAllAccounts();
    }

    // ✅ PENDING CLOSURES
    @GetMapping("/pending-closures")
    public List<Account> pendingClosures() {
        return accountRepository.findAll().stream()
                .filter(a -> a.getClosureStatus() == AccountClosureStatus.PENDING)
                .toList();
    }

    // ✅ FREEZE
    @PatchMapping("/{id}/freeze")
    public Map<String, String> freeze(@PathVariable Long id, Authentication auth) {
        service.freeze(id, auth.getName());
        return Map.of("message", "Account frozen");
    }

    // ✅ ACTIVATE
    @PatchMapping("/{id}/activate")
    public Map<String, String> activate(@PathVariable Long id, Authentication auth) {
        service.activate(id, auth.getName());
        return Map.of("message", "Account activated");
    }

    // ✅ CLOSE (admin force-close)
    @PatchMapping("/{id}/close")
    public Map<String, String> close(@PathVariable Long id, Authentication auth) {
        Account acc = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        acc.setStatus(AccountStatus.CLOSED);
        acc.setClosureStatus(AccountClosureStatus.APPROVED);
        accountRepository.save(acc);
        return Map.of("message", "Account closed");
    }

    // ✅ APPROVE CLOSURE
    @PatchMapping("/{id}/approve-closure")
    public Map<String, String> approve(@PathVariable Long id, Authentication auth) {
        service.approveClosure(id, auth.getName());
        return Map.of("message", "Closure approved");
    }

    // ✅ REJECT CLOSURE
    @PatchMapping("/{id}/reject-closure")
    public Map<String, String> reject(@PathVariable Long id, Authentication auth) {
        service.rejectClosure(id, auth.getName());
        return Map.of("message", "Closure rejected");
    }

    // ─── Account-opening approvals (real bank flow) ───
    @GetMapping("/pending-openings")
    public List<Account> pendingOpenings() {
        return service.getPendingOpenings();
    }

    @PatchMapping("/{id}/approve-opening")
    public Map<String, Object> approveOpening(@PathVariable Long id, Authentication auth) {
        Account acc = service.approveOpening(id, auth.getName());
        return Map.of(
            "message", "Account opening approved",
            "accountId", acc.getId(),
            "status", acc.getStatus().name(),
            "balance", acc.getBalance()
        );
    }

    @PatchMapping("/{id}/reject-opening")
    public Map<String, Object> rejectOpening(@PathVariable Long id,
                                             @RequestBody(required = false) Map<String, String> body,
                                             Authentication auth) {
        String reason = body == null ? null : body.get("reason");
        Account acc = service.rejectOpening(id, auth.getName(), reason);
        return Map.of(
            "message", "Account opening rejected",
            "accountId", acc.getId(),
            "status", acc.getStatus().name(),
            "rejectionReason", acc.getRejectionReason()
        );
    }
}
