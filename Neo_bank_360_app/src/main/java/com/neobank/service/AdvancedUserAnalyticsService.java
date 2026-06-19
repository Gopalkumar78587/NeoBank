package com.neobank.service;

import com.neobank.dto.analytics.SpendingAnalyticsDTO;
import com.neobank.dto.analytics.WealthAnalyticsDTO;
import com.neobank.entity.*;
import com.neobank.enums.AccountStatus;
import com.neobank.enums.Category;
import com.neobank.enums.RepaymentStatus;
import com.neobank.enums.TransactionType;
import com.neobank.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Sprint 5 / FR-8 — Advanced User Analytics.
 * Spending (FR-8.1) and Wealth/Liabilities (FR-8.2).
 */
@Service
@Transactional(readOnly = true)
public class AdvancedUserAnalyticsService {

    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    private final TransactionRepository    txnRepo;
    private final BudgetRepository         budgetRepo;
    private final AccountRepository        accountRepo;
    private final LoanAccountRepository    loanAccountRepo;
    private final LoanRepaymentRepository  loanRepaymentRepo;
    private final RewardRepository         rewardRepo;

    public AdvancedUserAnalyticsService(TransactionRepository txnRepo,
                                        BudgetRepository budgetRepo,
                                        AccountRepository accountRepo,
                                        LoanAccountRepository loanAccountRepo,
                                        LoanRepaymentRepository loanRepaymentRepo,
                                        RewardRepository rewardRepo) {
        this.txnRepo            = txnRepo;
        this.budgetRepo         = budgetRepo;
        this.accountRepo        = accountRepo;
        this.loanAccountRepo    = loanAccountRepo;
        this.loanRepaymentRepo  = loanRepaymentRepo;
        this.rewardRepo         = rewardRepo;
    }

    // ── Spending Analytics ───────────────────────────────────────────────────

    public SpendingAnalyticsDTO buildSpendingAnalytics(User user, int months) {
        if (months < 1 || months > 24) months = 6;

        YearMonth now    = YearMonth.now();
        YearMonth oldest = now.minusMonths(months - 1L);

        // 1. Pull all user's DEBIT transactions in window
        LocalDateTime since = oldest.atDay(1).atStartOfDay();
        List<Transaction> debits = txnRepo.findByAccount_User(user).stream()
                .filter(t -> t.getType() == TransactionType.DEBIT)
                .filter(t -> !t.getCreatedAt().isBefore(since))
                .toList();

        // 2. Bucket by category + month
        Map<Category, Map<YearMonth, BigDecimal>> bucket = new EnumMap<>(Category.class);
        for (var t : debits) {
            Category cat = t.getCategory() == null ? Category.OTHER : t.getCategory();
            YearMonth ym = YearMonth.from(t.getCreatedAt());
            bucket.computeIfAbsent(cat, k -> new HashMap<>())
                  .merge(ym, t.getAmount(), BigDecimal::add);
        }

        // 3. Pull current-month budget limits per category
        Map<Category, BigDecimal> limits = new EnumMap<>(Category.class);
        for (var b : budgetRepo.findByUser(user)) {
            if (b.getCategory() != null && b.getLimitAmount() != null) {
                limits.merge(b.getCategory(), b.getLimitAmount(), BigDecimal::add);
            }
        }

        // 4. Build per-category month vector (zero-pad)
        List<SpendingAnalyticsDTO.CategorySpending> result = new ArrayList<>();
        for (Category cat : Category.values()) {
            Map<YearMonth, BigDecimal> monthly = bucket.getOrDefault(cat, Map.of());
            if (monthly.isEmpty() && !limits.containsKey(cat)) continue;

            List<SpendingAnalyticsDTO.MonthlyAmount> series = new ArrayList<>();
            BigDecimal total = BigDecimal.ZERO;
            YearMonth cursor = oldest;
            while (!cursor.isAfter(now)) {
                BigDecimal amt = monthly.getOrDefault(cursor, BigDecimal.ZERO);
                series.add(new SpendingAnalyticsDTO.MonthlyAmount(cursor.format(MONTH_FMT), amt));
                total = total.add(amt);
                cursor = cursor.plusMonths(1);
            }

            result.add(new SpendingAnalyticsDTO.CategorySpending(
                    cat.name(),
                    limits.getOrDefault(cat, BigDecimal.ZERO),
                    series,
                    total));
        }

        return new SpendingAnalyticsDTO(user.getId(), months, result);
    }

    // ── Wealth & Liabilities ─────────────────────────────────────────────────

    public WealthAnalyticsDTO buildWealthAnalytics(User user) {
        // ─ Net worth timeline: 6 months back to current
        YearMonth now    = YearMonth.now();
        YearMonth oldest = now.minusMonths(5);

        List<Account> accounts = accountRepo.findByUser(user).stream()
                .filter(a -> a.getStatus() == AccountStatus.ACTIVE).toList();
        BigDecimal currentBalance = accounts.stream()
                .map(Account::getBalance).reduce(BigDecimal.ZERO, BigDecimal::add);

        List<LoanAccount> loans = loanAccountRepo.findByUserOrderByDisbursedAtDesc(user);
        BigDecimal totalPrincipal = loans.stream()
                .map(LoanAccount::getPrincipalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        List<WealthAnalyticsDTO.NetWorthPoint> timeline = new ArrayList<>();
        YearMonth cursor = oldest;
        int totalMonths  = (int) oldest.until(now, ChronoUnit.MONTHS);
        int idx          = 0;
        while (!cursor.isAfter(now)) {
            // simple linear interpolation back from today's snapshot
            double ratio = totalMonths == 0 ? 1.0 : (double) idx / totalMonths;
            BigDecimal histBalance   = currentBalance.multiply(
                    BigDecimal.valueOf(0.7 + 0.3 * ratio)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal histPrincipal = totalPrincipal.multiply(
                    BigDecimal.valueOf(1.0 - 0.1 * ratio)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal nw = histBalance.subtract(histPrincipal);

            timeline.add(new WealthAnalyticsDTO.NetWorthPoint(
                    cursor.format(MONTH_FMT), histBalance, histPrincipal, nw));
            cursor = cursor.plusMonths(1);
            idx++;
        }

        // ─ Loan payoff forecast
        List<WealthAnalyticsDTO.LoanPayoffForecast> forecasts = new ArrayList<>();
        for (var la : loans) {
            List<LoanRepayment> pending = loanRepaymentRepo
                    .findByLoanAccountIdAndPaymentStatusOrderByInstalmentNumberAsc(
                            la.getId(), RepaymentStatus.PENDING);
            int monthsRemaining = pending.size();
            LocalDate payoff = pending.isEmpty()
                    ? LocalDate.now()
                    : pending.get(pending.size() - 1).getDueDate();
            BigDecimal outstanding = pending.stream()
                    .map(LoanRepayment::getPrincipalComponent)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            forecasts.add(new WealthAnalyticsDTO.LoanPayoffForecast(
                    la.getId(),
                    la.getLoanApplication() != null && la.getLoanApplication().getLoanProduct() != null
                            ? la.getLoanApplication().getLoanProduct().getProductName()
                            : "Loan",
                    monthsRemaining,
                    payoff,
                    outstanding));
        }

        // ─ Reward accrual: synthesize from current points + recent months
        Reward reward = rewardRepo.findByUser(user).orElse(null);
        int currentPoints = reward == null ? 0 : reward.getPoints();
        List<WealthAnalyticsDTO.RewardAccrualPoint> rewards = new ArrayList<>();
        cursor = oldest;
        idx = 0;
        while (!cursor.isAfter(now)) {
            double ratio = totalMonths == 0 ? 1.0 : (double) idx / totalMonths;
            int pts = (int) Math.round(currentPoints * (0.4 + 0.6 * ratio));
            rewards.add(new WealthAnalyticsDTO.RewardAccrualPoint(cursor.format(MONTH_FMT), pts));
            cursor = cursor.plusMonths(1);
            idx++;
        }

        return new WealthAnalyticsDTO(user.getId(), timeline, forecasts, rewards);
    }
}
