package com.neobank.controller;

import com.neobank.dto.Loan.LoanAccountResponse;
import com.neobank.dto.Loan.RepaymentScheduleResponse;
import com.neobank.entity.User;
import com.neobank.repository.UserRepository;
import com.neobank.service.LoanAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanAccountController {

    private final LoanAccountService loanAccountService;
    private final UserRepository userRepository;

    /**
     * CUSTOMER — List own loan accounts.
     */
    @GetMapping("/my-accounts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<LoanAccountResponse>> myAccounts(Authentication auth) {
        User user = resolveUser(auth);
        return ResponseEntity.ok(loanAccountService.getMyAccounts(user));
    }

    /**
     * CUSTOMER — Get repayment schedule for a loan account.
     * Validates ownership; returns 403 if not owner.
     */
    @GetMapping("/{loanAccountId}/repayments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<RepaymentScheduleResponse>> getRepayments(
            @PathVariable Long loanAccountId,
            @RequestParam(required = false) String status,
            Authentication auth) {

        User user = resolveUser(auth);
        return ResponseEntity.ok(
                loanAccountService.getRepaymentSchedule(loanAccountId, user, status));
    }

    /**
     * CUSTOMER — Mark a specific instalment as PAID.
     */
    @PatchMapping("/{loanAccountId}/repayments/{repaymentId}/pay")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RepaymentScheduleResponse> markAsPaid(
            @PathVariable Long loanAccountId,
            @PathVariable Long repaymentId,
            Authentication auth) {

        User user = resolveUser(auth);
        return ResponseEntity.ok(
                loanAccountService.markAsPaid(loanAccountId, repaymentId, user));
    }

    // ─── Helper ──────────────────────────────────────────────────

    private User resolveUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }
}
