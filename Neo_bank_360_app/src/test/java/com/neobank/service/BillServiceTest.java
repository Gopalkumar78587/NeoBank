package com.neobank.service;

import com.neobank.entity.Bill;
import com.neobank.entity.User;
import com.neobank.enums.BillStatus;
import com.neobank.repository.AccountRepository;
import com.neobank.repository.BillRepository;
import com.neobank.repository.RewardRepository;
import com.neobank.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BillServiceTest {

    @Mock
    private BillRepository billRepository;

    @Mock
    private RewardRepository rewardRepository;

    @Mock
    private TransactionRepository txnRepo;

    @Mock
    private AccountRepository accountRepository;

    @InjectMocks
    private BillService billService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail("gopal@neobank.in");
        user.setFullName("Gopal Kumar");
    }

    private Bill validBill() {
        Bill bill = new Bill();
        bill.setBillerName("Electricity Board");
        bill.setAmount(BigDecimal.valueOf(1200));
        bill.setDueDate(LocalDate.now().plusDays(5));
        bill.setStatus(BillStatus.PENDING);
        return bill;
    }

    // ─── createBill: success ─────────────────────────────────────

    @Test
    void createBill_validBill_savesAndReturns() {
        Bill bill = validBill();

        when(billRepository.existsByUserAndBillerNameAndDueDateBetween(
                eq(user), eq("Electricity Board"), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(false);
        when(billRepository.save(any(Bill.class))).thenAnswer(inv -> inv.getArgument(0));

        Bill result = billService.createBill(bill, user);

        assertNotNull(result);
        assertEquals(user, result.getUser());
        assertEquals(BillStatus.PENDING, result.getStatus());
        verify(billRepository).save(bill);
    }

    // ─── createBill: validation failures ─────────────────────────

    @Test
    void createBill_zeroAmount_throws() {
        Bill bill = validBill();
        bill.setAmount(BigDecimal.ZERO);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> billService.createBill(bill, user));
        assertEquals("Amount must be greater than zero", ex.getMessage());
    }

    @Test
    void createBill_negativeAmount_throws() {
        Bill bill = validBill();
        bill.setAmount(BigDecimal.valueOf(-100));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> billService.createBill(bill, user));
        assertEquals("Amount must be greater than zero", ex.getMessage());
    }

    @Test
    void createBill_pastDueDate_throws() {
        Bill bill = validBill();
        bill.setDueDate(LocalDate.now().minusDays(1));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> billService.createBill(bill, user));
        assertEquals("Due date must be in the future", ex.getMessage());
    }

    @Test
    void createBill_nullDueDate_throws() {
        Bill bill = validBill();
        bill.setDueDate(null);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> billService.createBill(bill, user));
        assertEquals("Due date must be in the future", ex.getMessage());
    }

    @Test
    void createBill_duplicateSameMonth_throws() {
        Bill bill = validBill();

        when(billRepository.existsByUserAndBillerNameAndDueDateBetween(
                eq(user), eq("Electricity Board"), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> billService.createBill(bill, user));
        assertEquals("Duplicate bill for same month", ex.getMessage());
    }
}
