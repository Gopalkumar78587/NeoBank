package com.neobank.service;

import com.neobank.dto.admin.AdminLoanAnalyticsDTO;
import com.neobank.dto.admin.AdminTxnAnalyticsDTO;
import com.neobank.entity.LoanApplication;
import com.neobank.entity.LoanRepayment;
import com.neobank.enums.LoanApplicationStatus;
import com.neobank.enums.RepaymentStatus;
import com.neobank.repository.LoanApplicationRepository;
import com.neobank.repository.LoanRepaymentRepository;
import com.neobank.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Sprint 5 / FR-7.1 — Advanced Admin Analytics.
 */
@Service
@Transactional(readOnly = true)
public class AdvancedAdminAnalyticsService {

    private final TransactionRepository     txnRepo;
    private final LoanApplicationRepository loanAppRepo;
    private final LoanRepaymentRepository   loanRepaymentRepo;

    public AdvancedAdminAnalyticsService(TransactionRepository txnRepo,
                                         LoanApplicationRepository loanAppRepo,
                                         LoanRepaymentRepository loanRepaymentRepo) {
        this.txnRepo            = txnRepo;
        this.loanAppRepo        = loanAppRepo;
        this.loanRepaymentRepo  = loanRepaymentRepo;
    }

    public AdminTxnAnalyticsDTO buildTransactionAnalytics(String timeframe) {
        LocalDate today = LocalDate.now();
        LocalDate from  = resolveFrom(timeframe, today);

        // Aggregate from in-memory iteration over all transactions in window.
        // The native query already exists for per-user; for admin we aggregate by date.
        var window = txnRepo.findAll().stream()
                .filter(t -> !t.getCreatedAt().toLocalDate().isBefore(from))
                .toList();

        Map<LocalDate, BigDecimal[]> byDay = new TreeMap<>();
        BigDecimal totalInflow  = BigDecimal.ZERO;
        BigDecimal totalOutflow = BigDecimal.ZERO;

        for (var t : window) {
            LocalDate d = t.getCreatedAt().toLocalDate();
            BigDecimal[] slot = byDay.computeIfAbsent(d,
                    k -> new BigDecimal[]{ BigDecimal.ZERO, BigDecimal.ZERO });
            if (t.getType() != null && t.getType().name().equals("CREDIT")) {
                slot[0] = slot[0].add(t.getAmount());
                totalInflow = totalInflow.add(t.getAmount());
            } else {
                slot[1] = slot[1].add(t.getAmount());
                totalOutflow = totalOutflow.add(t.getAmount());
            }
        }

        // Zero-fill any missing days
        List<AdminTxnAnalyticsDTO.DailyPoint> daily = new ArrayList<>();
        LocalDate cursor = from;
        while (!cursor.isAfter(today)) {
            BigDecimal[] slot = byDay.getOrDefault(cursor,
                    new BigDecimal[]{ BigDecimal.ZERO, BigDecimal.ZERO });
            daily.add(new AdminTxnAnalyticsDTO.DailyPoint(cursor, slot[0], slot[1]));
            cursor = cursor.plusDays(1);
        }

        long count = window.size();
        BigDecimal avgTicket = count == 0
                ? BigDecimal.ZERO
                : totalInflow.add(totalOutflow)
                        .divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);

        return new AdminTxnAnalyticsDTO(timeframe, daily, avgTicket,
                totalInflow, totalOutflow, count);
    }

    public AdminLoanAnalyticsDTO buildLoanAnalytics(String timeframe) {
        LocalDate today = LocalDate.now();
        LocalDate from  = resolveFrom(timeframe, today);

        var apps = loanAppRepo.findAll().stream()
                .filter(a -> !a.getAppliedAt().toLocalDate().isBefore(from))
                .toList();

        Map<String, Long> dist = new LinkedHashMap<>();
        dist.put("PENDING",  apps.stream().filter(a -> a.getStatus() == LoanApplicationStatus.PENDING).count());
        dist.put("APPROVED", apps.stream().filter(a -> a.getStatus() == LoanApplicationStatus.APPROVED).count());
        dist.put("REJECTED", apps.stream().filter(a -> a.getStatus() == LoanApplicationStatus.REJECTED).count());

        Map<String, List<LoanApplication>> byProduct = apps.stream()
                .collect(Collectors.groupingBy(a -> a.getLoanProduct().getProductName()));

        List<AdminLoanAnalyticsDTO.ProductBreakdown> byProductList = byProduct.entrySet().stream()
                .map(e -> new AdminLoanAnalyticsDTO.ProductBreakdown(
                        e.getKey(),
                        e.getValue().stream().filter(a -> a.getStatus() == LoanApplicationStatus.PENDING).count(),
                        e.getValue().stream().filter(a -> a.getStatus() == LoanApplicationStatus.APPROVED).count(),
                        e.getValue().stream().filter(a -> a.getStatus() == LoanApplicationStatus.REJECTED).count()))
                .collect(Collectors.toList());

        // NPA — proxy from overdue repayments
        long totalLoans = loanAppRepo.count();
        Set<Long> overdueLoanAccountIds = loanRepaymentRepo.findAll().stream()
                .filter(r -> r.getPaymentStatus() == RepaymentStatus.OVERDUE)
                .map(r -> r.getLoanAccount().getId())
                .collect(Collectors.toSet());

        long npaCount = overdueLoanAccountIds.size();
        BigDecimal npaRatio = totalLoans == 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(npaCount)
                        .divide(BigDecimal.valueOf(totalLoans), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));

        return new AdminLoanAnalyticsDTO(timeframe, dist, byProductList, npaCount, npaRatio);
    }

    /** BR-05 — validate timeframe and resolve start date. */
    public static LocalDate resolveFrom(String timeframe, LocalDate today) {
        if (timeframe == null) throw new IllegalArgumentException("timeframe required");
        return switch (timeframe.toLowerCase()) {
            case "7d"  -> today.minusDays(6);
            case "30d" -> today.minusDays(29);
            case "ytd" -> LocalDate.of(today.getYear(), Month.JANUARY, 1);
            default    -> throw new IllegalArgumentException("Invalid timeframe: " + timeframe);
        };
    }
}
