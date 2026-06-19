package com.neobank.service;

import com.neobank.entity.Account;
import com.neobank.entity.Transaction;
import com.neobank.enums.AccountStatus;
import com.neobank.enums.AccountType;
import com.neobank.enums.TransactionType;
import com.neobank.repository.AccountRepository;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private OtpService otpService;

    @InjectMocks
    private TransactionService transactionService;

    private Account activeAccount;

    @BeforeEach
    void setUp() {
        activeAccount = Account.builder()
                .id(1L)
                .accountNumber("NB20260001")
                .accountType(AccountType.SAVINGS)
                .balance(BigDecimal.valueOf(10000))
                .status(AccountStatus.ACTIVE)
                .perTransactionLimit(BigDecimal.valueOf(50000))
                .dailyLimit(BigDecimal.valueOf(100000))
                .closureStatus(com.neobank.enums.AccountClosureStatus.NONE)
                .build();
    }

    private Transaction savedTransaction(Account account, TransactionType type,
                                          BigDecimal amount, BigDecimal balanceAfter) {
        return Transaction.builder()
                .id(1L)
                .account(account)
                .type(type)
                .amount(amount)
                .balanceAfter(balanceAfter)
                .createdAt(LocalDateTime.now())
                .build();
    }

    // ─── createTransaction: success ──────────────────────────────

    @Test
    void createTransaction_credit_updatesBalance() {
        BigDecimal amount = BigDecimal.valueOf(2000);
        BigDecimal expectedBalance = BigDecimal.valueOf(12000);

        when(otpService.isOtpVerified("gopal@neobank.in")).thenReturn(true);
        when(transactionRepository.sumTodayAmount(eq(1L), any())).thenReturn(BigDecimal.ZERO);
        when(accountRepository.save(activeAccount)).thenReturn(activeAccount);
        when(transactionRepository.save(any(Transaction.class)))
                .thenReturn(savedTransaction(activeAccount, TransactionType.CREDIT, amount, expectedBalance));

        Transaction tx = transactionService.createTransaction(
                activeAccount, TransactionType.CREDIT, amount, "Salary", "gopal@neobank.in");

        assertEquals(expectedBalance, activeAccount.getBalance());
        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    void createTransaction_debit_updatesBalance() {
        BigDecimal amount = BigDecimal.valueOf(3000);
        BigDecimal expectedBalance = BigDecimal.valueOf(7000);

        when(otpService.isOtpVerified("gopal@neobank.in")).thenReturn(true);
        when(transactionRepository.sumTodayAmount(eq(1L), any())).thenReturn(BigDecimal.ZERO);
        when(accountRepository.save(activeAccount)).thenReturn(activeAccount);
        when(transactionRepository.save(any(Transaction.class)))
                .thenReturn(savedTransaction(activeAccount, TransactionType.DEBIT, amount, expectedBalance));

        Transaction tx = transactionService.createTransaction(
                activeAccount, TransactionType.DEBIT, amount, "Shopping", "gopal@neobank.in");

        assertEquals(expectedBalance, activeAccount.getBalance());
    }

    // ─── createTransaction: guard failures ───────────────────────

    @Test
    void createTransaction_otpNotVerified_throws() {
        when(otpService.isOtpVerified("gopal@neobank.in")).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                transactionService.createTransaction(
                        activeAccount, TransactionType.DEBIT,
                        BigDecimal.valueOf(500), "test", "gopal@neobank.in"));

        assertEquals("OTP not verified", ex.getMessage());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void createTransaction_frozenAccount_throws() {
        activeAccount.setStatus(AccountStatus.FROZEN);
        when(otpService.isOtpVerified("gopal@neobank.in")).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                transactionService.createTransaction(
                        activeAccount, TransactionType.DEBIT,
                        BigDecimal.valueOf(500), "test", "gopal@neobank.in"));

        assertEquals("Account not active", ex.getMessage());
    }

    @Test
    void createTransaction_zeroAmount_throws() {
        when(otpService.isOtpVerified("gopal@neobank.in")).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                transactionService.createTransaction(
                        activeAccount, TransactionType.DEBIT,
                        BigDecimal.ZERO, "test", "gopal@neobank.in"));

        assertEquals("Invalid amount", ex.getMessage());
    }

    @Test
    void createTransaction_exceedsPerTransactionLimit_throws() {
        when(otpService.isOtpVerified("gopal@neobank.in")).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                transactionService.createTransaction(
                        activeAccount, TransactionType.DEBIT,
                        BigDecimal.valueOf(60000), "big payment", "gopal@neobank.in"));

        assertEquals("Per-transaction limit exceeded", ex.getMessage());
    }

    @Test
    void createTransaction_exceedsDailyLimit_throws() {
        when(otpService.isOtpVerified("gopal@neobank.in")).thenReturn(true);
        // Already spent 95,000 today
        when(transactionRepository.sumTodayAmount(eq(1L), any()))
                .thenReturn(BigDecimal.valueOf(95000));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                transactionService.createTransaction(
                        activeAccount, TransactionType.DEBIT,
                        BigDecimal.valueOf(10000), "overdraft", "gopal@neobank.in"));

        assertEquals("Daily transaction limit exceeded", ex.getMessage());
    }

    @Test
    void createTransaction_insufficientBalance_throws() {
        when(otpService.isOtpVerified("gopal@neobank.in")).thenReturn(true);
        when(transactionRepository.sumTodayAmount(eq(1L), any())).thenReturn(BigDecimal.ZERO);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                transactionService.createTransaction(
                        activeAccount, TransactionType.DEBIT,
                        BigDecimal.valueOf(15000), "withdrawal", "gopal@neobank.in"));

        assertEquals("Insufficient balance", ex.getMessage());
    }

    // ─── getTransactions ─────────────────────────────────────────

    @Test
    void getTransactions_returnsOrderedList() {
        List<Transaction> txList = List.of(
                savedTransaction(activeAccount, TransactionType.CREDIT, BigDecimal.valueOf(100), BigDecimal.valueOf(100))
        );
        when(transactionRepository.findByAccountOrderByCreatedAtDesc(activeAccount)).thenReturn(txList);

        List<Transaction> result = transactionService.getTransactions(activeAccount);

        assertEquals(1, result.size());
        assertEquals(TransactionType.CREDIT, result.get(0).getType());
    }
}
