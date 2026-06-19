package com.neobank.controller;

import com.neobank.entity.User;
import com.neobank.repository.UserRepository;
import com.neobank.service.AnalyticsService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/customer/analytics")
@PreAuthorize("isAuthenticated()")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final UserRepository userRepo;

    public AnalyticsController(AnalyticsService analyticsService,
                               UserRepository userRepo) {
        this.analyticsService = analyticsService;
        this.userRepo = userRepo;
    }

    private User getUser(Authentication auth) {
        return userRepo.findByEmail(auth.getName()).orElseThrow();
    }

    @GetMapping("/monthly")
    public Map<String, Double> monthly(Authentication auth) {
        return analyticsService.monthlySpending(getUser(auth));
    }

    @GetMapping("/category")
    public Map<String, Double> category(Authentication auth) {
        return analyticsService.categorySpending(getUser(auth));
    }
}
