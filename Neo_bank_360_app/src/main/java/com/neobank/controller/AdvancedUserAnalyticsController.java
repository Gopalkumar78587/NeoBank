package com.neobank.controller;

import com.neobank.dto.analytics.SpendingAnalyticsDTO;
import com.neobank.dto.analytics.WealthAnalyticsDTO;
import com.neobank.entity.User;
import com.neobank.repository.UserRepository;
import com.neobank.service.AdvancedUserAnalyticsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Sprint 5 — FR-8 Advanced User Analytics.
 * BR-04: JWT userId must match requested userId — cross-user access returns 403.
 */
@RestController
@RequestMapping("/api/analytics")
public class AdvancedUserAnalyticsController {

    private final AdvancedUserAnalyticsService service;
    private final UserRepository               userRepo;

    public AdvancedUserAnalyticsController(AdvancedUserAnalyticsService service,
                                           UserRepository userRepo) {
        this.service  = service;
        this.userRepo = userRepo;
    }

    @GetMapping("/spending/{userId}")
    public ResponseEntity<?> spending(@PathVariable Long userId,
                                      @RequestParam(defaultValue = "6") int months,
                                      Authentication auth) {
        ResponseEntity<?> guard = guard(userId, auth);
        if (guard != null) return guard;

        User u = userRepo.findById(userId).orElseThrow();
        SpendingAnalyticsDTO dto = service.buildSpendingAnalytics(u, months);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/wealth/{userId}")
    public ResponseEntity<?> wealth(@PathVariable Long userId, Authentication auth) {
        ResponseEntity<?> guard = guard(userId, auth);
        if (guard != null) return guard;

        User u = userRepo.findById(userId).orElseThrow();
        WealthAnalyticsDTO dto = service.buildWealthAnalytics(u);
        return ResponseEntity.ok(dto);
    }

    /** Convenience endpoints — operate on the JWT user. */
    @GetMapping("/spending/me")
    public ResponseEntity<?> mySpending(@RequestParam(defaultValue = "6") int months,
                                        Authentication auth) {
        User u = currentUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(service.buildSpendingAnalytics(u, months));
    }

    @GetMapping("/wealth/me")
    public ResponseEntity<?> myWealth(Authentication auth) {
        User u = currentUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(service.buildWealthAnalytics(u));
    }

    // ── helpers ────────────────────────────────────────────────────────────

    private ResponseEntity<?> guard(Long requestedUserId, Authentication auth) {
        User u = currentUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (!u.getId().equals(requestedUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Cross-user access denied"));
        }
        return null;
    }

    private User currentUser(Authentication auth) {
        if (auth == null) return null;
        return userRepo.findByEmail(auth.getName()).orElse(null);
    }
}
