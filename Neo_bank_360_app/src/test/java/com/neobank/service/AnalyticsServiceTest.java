package com.neobank.service;

import com.neobank.entity.Account;
import com.neobank.entity.Transaction;
import com.neobank.entity.User;
import com.neobank.enums.Category;
import com.neobank.enums.TransactionType;
import com.neobank.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private TransactionRepository txnRepo;

    @InjectMocks
    private AnalyticsService analyticsService;

    private User user;
    private Account account;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail("gopal@neobank.in");

        account = Account.builder()
                .id(1L)
                .user(user)
                .build();
    }

    private Transaction debitTx(double amount, String month, Category category) {
        int monthNum = switch (month) {
            case "JANUARY" -> 1; case "FEBRUARY" -> 2; case "MARCH" -> 3;
            case "APRIL" -> 4; case "MAY" -> 5; case "JUNE" -> 6;
            case "JULY" -> 7; case "AUGUST" -> 8; case "SEPTEMBER" -> 9;
            case "OCTOBER" -> 10; case "NOVEMBER" -> 11; default -> 12;
        };
        return Transaction.builder()
                .account(account)
                .type(TransactionType.DEBIT)
                .amount(BigDecimal.valueOf(amount))
                .balanceAfter(BigDecimal.ZERO)
                .createdAt(LocalDateTime.of(2026, monthNum, 15, 10, 0))
                .category(category)
                .build();
    }

    private Transaction creditTx(double amount) {
        return Transaction.builder()
                .account(account)
                .type(TransactionType.CREDIT)
                .amount(BigDecimal.valueOf(amount))
                .balanceAfter(BigDecimal.ZERO)
                .createdAt(LocalDateTime.now())
                .build();
    }

    // ─── monthlySpending ─────────────────────────────────────────

    @Test
    void monthlySpending_aggregatesDebitsByMonth() {
        List<Transaction> txns = List.of(
                debitTx(3000, "JANUARY", Category.FOOD),
                debitTx(2000, "JANUARY", Category.FOOD),
                debitTx(5000, "FEBRUARY", Category.ENTERTAINMENT),
                creditTx(10000)  // credits should be excluded
        );
        when(txnRepo.findByAccount_User(user)).thenReturn(txns);

        Map<String, Double> result = analyticsService.monthlySpending(user);

        assertEquals(5000.0, result.get("JANUARY"));
        assertEquals(5000.0, result.get("FEBRUARY"));
        assertNull(result.get("MARCH"));
    }

    @Test
    void monthlySpending_creditsExcluded_returnsEmptyMap() {
        when(txnRepo.findByAccount_User(user)).thenReturn(List.of(creditTx(10000)));

        Map<String, Double> result = analyticsService.monthlySpending(user);

        assertTrue(result.isEmpty());
    }

    @Test
    void monthlySpending_noTransactions_returnsEmptyMap() {
        when(txnRepo.findByAccount_User(user)).thenReturn(List.of());

        Map<String, Double> result = analyticsService.monthlySpending(user);

        assertTrue(result.isEmpty());
    }

    // ─── categorySpending ────────────────────────────────────────

    @Test
    void categorySpending_aggregatesDebitsByCategory() {
        List<Transaction> txns = List.of(
                debitTx(1000, "JUNE", Category.FOOD),
                debitTx(2000, "JUNE", Category.FOOD),
                debitTx(3000, "JUNE", Category.ENTERTAINMENT),
                creditTx(5000)  // excluded
        );
        when(txnRepo.findByAccount_User(user)).thenReturn(txns);

        Map<String, Double> result = analyticsService.categorySpending(user);

        assertEquals(3000.0, result.get("FOOD"));
        assertEquals(3000.0, result.get("ENTERTAINMENT"));
        assertFalse(result.containsKey(null));
    }

    @Test
    void categorySpending_nullCategoryIgnored() {
        Transaction txNoCategory = Transaction.builder()
                .account(account)
                .type(TransactionType.DEBIT)
                .amount(BigDecimal.valueOf(500))
                .balanceAfter(BigDecimal.ZERO)
                .createdAt(LocalDateTime.now())
                .category(null)
                .build();
        when(txnRepo.findByAccount_User(user)).thenReturn(List.of(txNoCategory));

        Map<String, Double> result = analyticsService.categorySpending(user);

        assertTrue(result.isEmpty());
    }
}
