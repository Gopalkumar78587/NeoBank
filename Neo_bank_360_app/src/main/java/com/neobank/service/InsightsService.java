package com.neobank.service;

import com.neobank.dto.insights.FinancialInsightsDTO;
import com.neobank.dto.insights.TrendEntryDTO;
import com.neobank.enums.AccountStatus;
import com.neobank.repository.TransactionRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.*;

@Service
public class InsightsService {

    private final TransactionRepository txnRepo;

    public InsightsService(TransactionRepository txnRepo) {
        this.txnRepo = txnRepo;
    }

    @Transactional(readOnly = true)
    public FinancialInsightsDTO buildInsights(Long userId) {

        BigDecimal totalIncome  = txnRepo.sumCreditByUserAndStatus(userId, AccountStatus.ACTIVE);
        BigDecimal totalExpense = txnRepo.sumDebitByUserAndStatus(userId, AccountStatus.ACTIVE);
        BigDecimal savings      = totalIncome.subtract(totalExpense);

        // 6 months back from today
        LocalDateTime since = LocalDate.now().minusMonths(5)
                                       .withDayOfMonth(1)
                                       .atStartOfDay();

        List<Object[]> rawRows = txnRepo.findTrendData(userId, since);

        // Build a map: (year, month) -> [income, expense]
        Map<String, BigDecimal[]> map = new LinkedHashMap<>();
        for (Object[] row : rawRows) {
            int yr    = ((Number) row[0]).intValue();
            int mo    = ((Number) row[1]).intValue();
            String key = yr + "-" + String.format("%02d", mo);
            String type = (String) row[2];
            BigDecimal total = (row[3] instanceof BigDecimal bd) ? bd
                               : new BigDecimal(row[3].toString());

            map.computeIfAbsent(key, k -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            if ("CREDIT".equalsIgnoreCase(type)) {
                map.get(key)[0] = map.get(key)[0].add(total);
            } else {
                map.get(key)[1] = map.get(key)[1].add(total);
            }
        }

        // Ensure all 6 months are present (zero-pad missing months)
        List<TrendEntryDTO> trend = new ArrayList<>();
        LocalDate cursor = LocalDate.now().minusMonths(5).withDayOfMonth(1);
        for (int i = 0; i < 6; i++) {
            int yr = cursor.getYear();
            int mo = cursor.getMonthValue();
            String key = yr + "-" + String.format("%02d", mo);
            BigDecimal[] vals = map.getOrDefault(key, new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            String label = cursor.getMonth()
                                 .getDisplayName(TextStyle.SHORT, Locale.ENGLISH)
                           + " " + yr;
            trend.add(new TrendEntryDTO(label, yr, mo, vals[0], vals[1]));
            cursor = cursor.plusMonths(1);
        }

        return new FinancialInsightsDTO(userId, totalIncome, totalExpense, savings, trend);
    }
}
