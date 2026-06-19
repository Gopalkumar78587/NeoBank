package com.neobank.controller;

import com.neobank.dto.insights.FinancialInsightsDTO;
import com.neobank.entity.User;
import com.neobank.repository.UserRepository;
import com.neobank.service.InsightsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/insights")
public class InsightsController {

    private final InsightsService insightsService;
    private final UserRepository  userRepository;

    public InsightsController(InsightsService insightsService,
                               UserRepository userRepository) {
        this.insightsService = insightsService;
        this.userRepository  = userRepository;
    }

    /**
     * GET /api/insights/{userId}
     * Authenticated user only — JWT email must resolve to the same userId as the path variable.
     */
    @GetMapping("/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getInsights(@PathVariable Long userId,
                                          Authentication auth) {

        // Resolve the JWT principal (email) to a User entity
        String email = auth.getName();
        User requestingUser = userRepository.findByEmail(email)
                .orElse(null);

        if (requestingUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Cross-user access guard (BR-01)
        if (!requestingUser.getId().equals(userId) &&
            !requestingUser.getRole().name().equals("ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        FinancialInsightsDTO dto = insightsService.buildInsights(userId);
        return ResponseEntity.ok(dto);
    }

    /**
     * GET /api/insights/me  — convenience endpoint; uses the JWT email to resolve userId.
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMyInsights(Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(insightsService.buildInsights(user.getId()));
    }
}
