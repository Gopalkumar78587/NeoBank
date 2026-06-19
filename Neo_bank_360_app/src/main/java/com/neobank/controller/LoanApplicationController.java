package com.neobank.controller;

import com.neobank.dto.Loan.LoanApplicationRequest;
import com.neobank.dto.Loan.LoanApplicationResponse;
import com.neobank.dto.Loan.LoanDecisionRequest;
import com.neobank.entity.User;
import com.neobank.repository.UserRepository;
import com.neobank.service.LoanApplicationService;
import com.neobank.service.LoanDecisionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanApplicationController {

    private final LoanApplicationService loanApplicationService;
    private final LoanDecisionService loanDecisionService;
    private final UserRepository userRepository;

    // ─── Customer endpoints ──────────────────────────────────────

    /**
     * CUSTOMER — Submit a loan application.
     */
    @PostMapping("/apply")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LoanApplicationResponse> apply(
            @Valid @RequestBody LoanApplicationRequest request,
            Authentication auth) {

        User user = resolveUser(auth);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(loanApplicationService.apply(user, request));
    }

    /**
     * CUSTOMER — Get own loan applications.
     */
    @GetMapping("/my-applications")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<LoanApplicationResponse>> myApplications(Authentication auth) {
        User user = resolveUser(auth);
        return ResponseEntity.ok(loanApplicationService.getMyApplications(user));
    }

    // ─── Admin endpoints ─────────────────────────────────────────

    /**
     * ADMIN — Get all loan applications (optional ?status= filter).
     */
    @GetMapping("/admin/applications")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<LoanApplicationResponse>> getAllApplications(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(loanApplicationService.getAllApplications(status));
    }

    /**
     * ADMIN — Approve or reject a loan application.
     */
    @PutMapping("/{loanApplicationId}/decision")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LoanApplicationResponse> decide(
            @PathVariable Long loanApplicationId,
            @Valid @RequestBody LoanDecisionRequest request) {
        return ResponseEntity.ok(loanDecisionService.decide(loanApplicationId, request));
    }

    // ─── Helper ──────────────────────────────────────────────────

    private User resolveUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }
}
