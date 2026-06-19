package com.neobank.controller;

import com.neobank.dto.Budget.BudgetCreateRequest;
import com.neobank.dto.Budget.BudgetResponse;
import com.neobank.dto.Budget.BudgetSummaryDTO;
import com.neobank.entity.Budget;
import com.neobank.entity.User;
import com.neobank.enums.Category;
import com.neobank.repository.UserRepository;
import com.neobank.service.BudgetService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer/budgets")
@PreAuthorize("isAuthenticated()")
public class BudgetController {

    private final BudgetService budgetService;
    private final UserRepository userRepo;

    public BudgetController(BudgetService budgetService,
                            UserRepository userRepo) {
        this.budgetService = budgetService;
        this.userRepo = userRepo;
    }

    private User getUser(Authentication auth) {
        return userRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ✅ LIST (with computed spent for current month)
    @GetMapping
    public List<BudgetResponse> list(Authentication auth) {
        return budgetService.listForCurrentMonth(getUser(auth));
    }

    // ✅ CREATE
    @PostMapping
    public BudgetResponse create(@RequestBody BudgetCreateRequest req,
                                 Authentication auth) {
        return budgetService.create(getUser(auth), req);
    }

    // ✅ UPDATE
    @PutMapping("/{id}")
    public BudgetResponse update(@PathVariable Long id,
                                 @RequestBody BudgetCreateRequest req,
                                 Authentication auth) {
        return budgetService.update(getUser(auth), id, req);
    }

    // ✅ DELETE
    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable Long id,
                                      Authentication auth) {
        budgetService.delete(getUser(auth), id);
        return Map.of("message", "Budget deleted");
    }

    // ===================== Legacy enum-based endpoints =====================

    @PostMapping("/legacy")
    public Budget createLegacy(
            @RequestParam Category category,
            @RequestParam BigDecimal limit,
            @RequestParam String month,
            Authentication auth) {
        return budgetService.createBudget(
                getUser(auth),
                category,
                limit,
                LocalDate.parse(month)
        );
    }

    @GetMapping("/legacy")
    public List<BudgetSummaryDTO> getLegacySummary(
            @RequestParam String month,
            Authentication auth) {
        return budgetService.getSummary(
                getUser(auth),
                LocalDate.parse(month)
        );
    }
}