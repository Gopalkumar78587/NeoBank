package com.neobank.service;

import com.neobank.dto.Budget.BudgetCreateRequest;
import com.neobank.dto.Budget.BudgetResponse;
import com.neobank.dto.Budget.BudgetSummaryDTO;
import com.neobank.entity.Budget;
import com.neobank.entity.Transaction;
import com.neobank.entity.User;
import com.neobank.enums.Category;
import com.neobank.enums.TransactionType;
import com.neobank.repository.BudgetRepository;
import com.neobank.repository.TransactionRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;

@Service
@Transactional
public class BudgetService {

    private final BudgetRepository budgetRepo;
    private final TransactionRepository txnRepo;

    public BudgetService(BudgetRepository budgetRepo,
                         TransactionRepository txnRepo) {
        this.budgetRepo = budgetRepo;
        this.txnRepo = txnRepo;
    }

    // ✅ NEW: list with computed spending
    public List<BudgetResponse> listForCurrentMonth(User user) {
        LocalDate monthStart = LocalDate.now().withDayOfMonth(1);
        List<Budget> all = budgetRepo.findByUser(user);
        if (all.isEmpty()) {
            seedDefaults(user, monthStart);
            all = budgetRepo.findByUser(user);
        }

        BigDecimal totalLimit = all.stream()
                .map(b -> b.getLimitAmount() == null ? BigDecimal.ZERO : b.getLimitAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal monthlyDebits = txnRepo.findByAccount_User(user).stream()
                .filter(t -> t.getType() == TransactionType.DEBIT)
                .filter(t -> t.getCreatedAt() != null && !t.getCreatedAt().isBefore(monthStart.atStartOfDay()))
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<BudgetResponse> out = new ArrayList<>();
        for (Budget b : all) {
            BigDecimal spent = BigDecimal.ZERO;
            if (totalLimit.compareTo(BigDecimal.ZERO) > 0 && b.getLimitAmount() != null) {
                BigDecimal ratio = b.getLimitAmount().divide(totalLimit, 6, RoundingMode.HALF_UP);
                spent = monthlyDebits.multiply(ratio).setScale(2, RoundingMode.HALF_UP);
            }
            out.add(toResponse(b, spent));
        }
        return out;
    }

    // ✅ NEW: create
    public BudgetResponse create(User user, BudgetCreateRequest req) {
        if (req.getName() == null || req.getName().isBlank()) {
            throw new RuntimeException("Category name is required");
        }
        if (req.getLimit() == null || req.getLimit().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Limit must be positive");
        }
        Budget b = Budget.builder()
                .user(user)
                .name(req.getName())
                .icon(req.getIcon() == null ? "category" : req.getIcon())
                .color(req.getColor() == null ? "#1976d2" : req.getColor())
                .limitAmount(req.getLimit())
                .period(req.getPeriod() == null ? "MONTHLY" : req.getPeriod())
                .budgetMonth(LocalDate.now().withDayOfMonth(1))
                .createdAt(LocalDateTime.now())
                .build();
        return toResponse(budgetRepo.save(b), BigDecimal.ZERO);
    }

    // ✅ NEW: update
    public BudgetResponse update(User user, Long id, BudgetCreateRequest req) {
        Budget b = budgetRepo.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Budget not found"));
        if (req.getName() != null) b.setName(req.getName());
        if (req.getIcon() != null) b.setIcon(req.getIcon());
        if (req.getColor() != null) b.setColor(req.getColor());
        if (req.getLimit() != null && req.getLimit().compareTo(BigDecimal.ZERO) > 0) b.setLimitAmount(req.getLimit());
        if (req.getPeriod() != null) b.setPeriod(req.getPeriod());
        return toResponse(budgetRepo.save(b), BigDecimal.ZERO);
    }

    // ✅ NEW: delete
    public void delete(User user, Long id) {
        Budget b = budgetRepo.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Budget not found"));
        budgetRepo.delete(b);
    }

    private BudgetResponse toResponse(Budget b, BigDecimal spent) {
        return new BudgetResponse(
                b.getId(),
                b.getName() == null && b.getCategory() != null ? b.getCategory().name() : b.getName(),
                b.getIcon() == null ? "category" : b.getIcon(),
                b.getColor() == null ? "#1976d2" : b.getColor(),
                b.getLimitAmount(),
                spent,
                b.getPeriod() == null ? "MONTHLY" : b.getPeriod(),
                b.getCreatedAt() == null ? LocalDateTime.now().toString() : b.getCreatedAt().toString()
        );
    }

    private void seedDefaults(User user, LocalDate monthStart) {
        String[][] seeds = {
                {"Food & Dining", "restaurant", "#e65100", "5000"},
                {"Transportation", "directions_car", "#1565c0", "3000"},
                {"Shopping", "shopping_bag", "#7b1fa2", "8000"},
                {"Entertainment", "movie", "#c62828", "3000"},
                {"Utilities & Bills", "bolt", "#2e7d32", "4000"},
                {"Health & Fitness", "fitness_center", "#00838f", "2000"},
                {"Education", "school", "#4527a0", "5000"},
                {"Others", "more_horiz", "#546e7a", "3000"}
        };
        for (String[] s : seeds) {
            Budget b = Budget.builder()
                    .user(user)
                    .name(s[0])
                    .icon(s[1])
                    .color(s[2])
                    .limitAmount(new BigDecimal(s[3]))
                    .period("MONTHLY")
                    .budgetMonth(monthStart)
                    .createdAt(LocalDateTime.now())
                    .build();
            budgetRepo.save(b);
        }
    }

    // ===================== Legacy enum-based methods (kept for compatibility) =====================

    public Budget createBudget(User user,
                               Category category,
                               BigDecimal limit,
                               LocalDate month) {

        if (limit.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Limit must be positive");
        }

        LocalDate normalizedMonth = month.withDayOfMonth(1);

        budgetRepo.findByUserAndCategoryAndBudgetMonth(
                user, category, normalizedMonth
        ).ifPresent(b -> {
            throw new RuntimeException("Budget already exists for category");
        });

        Budget budget = Budget.builder()
                .user(user)
                .category(category)
                .name(category.name())
                .limitAmount(limit)
                .budgetMonth(normalizedMonth)
                .build();

        return budgetRepo.save(budget);
    }

    public List<BudgetSummaryDTO> getSummary(User user, LocalDate month) {

        LocalDate normalizedMonth = month.withDayOfMonth(1);

        List<Budget> budgets =
                budgetRepo.findByUserAndBudgetMonth(user, normalizedMonth);

        List<Transaction> transactions =
                txnRepo.findByAccount_User(user);

        List<BudgetSummaryDTO> result = new ArrayList<>();

        for (Budget b : budgets) {
            if (b.getCategory() == null) continue;

            BigDecimal spent = transactions.stream()
                    .filter(t -> t.getType() == TransactionType.DEBIT)
                    .filter(t -> t.getCategory() == b.getCategory())
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal remaining = b.getLimitAmount().subtract(spent);

            double utilization = b.getLimitAmount().doubleValue() == 0 ? 0 :
                    spent.doubleValue() / b.getLimitAmount().doubleValue() * 100;

            result.add(new BudgetSummaryDTO(
                    b.getCategory().name(),
                    b.getLimitAmount(),
                    spent,
                    remaining,
                    utilization
            ));
        }

        return result;
    }
}
