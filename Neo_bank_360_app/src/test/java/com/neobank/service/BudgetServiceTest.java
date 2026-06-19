package com.neobank.service;

import com.neobank.dto.Budget.BudgetCreateRequest;
import com.neobank.dto.Budget.BudgetResponse;
import com.neobank.entity.Budget;
import com.neobank.entity.User;
import com.neobank.repository.BudgetRepository;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BudgetServiceTest {

    @Mock
    private BudgetRepository budgetRepo;

    @Mock
    private TransactionRepository txnRepo;

    @InjectMocks
    private BudgetService budgetService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail("gopal@neobank.in");
        user.setFullName("Gopal Kumar");
    }

    private Budget sampleBudget(Long id, String name, BigDecimal limit) {
        return Budget.builder()
                .id(id)
                .user(user)
                .name(name)
                .icon("shopping_cart")
                .color("#1976d2")
                .limitAmount(limit)
                .period("MONTHLY")
                .createdAt(LocalDateTime.now())
                .build();
    }

    // ─── create ──────────────────────────────────────────────────

    @Test
    void create_validRequest_returnsResponse() {
        BudgetCreateRequest req = new BudgetCreateRequest("Food", "restaurant", "#ff5722",
                BigDecimal.valueOf(5000), "MONTHLY");

        Budget saved = sampleBudget(1L, "Food", BigDecimal.valueOf(5000));
        when(budgetRepo.save(any(Budget.class))).thenReturn(saved);
        when(txnRepo.findByAccount_User(user)).thenReturn(List.of());

        BudgetResponse response = budgetService.create(user, req);

        assertNotNull(response);
        assertEquals("Food", response.name());
        assertEquals(BigDecimal.valueOf(5000), response.limit());
    }

    @Test
    void create_blankName_throws() {
        BudgetCreateRequest req = new BudgetCreateRequest("", null, null,
                BigDecimal.valueOf(1000), null);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> budgetService.create(user, req));
        assertEquals("Category name is required", ex.getMessage());
    }

    @Test
    void create_nullName_throws() {
        BudgetCreateRequest req = new BudgetCreateRequest(null, null, null,
                BigDecimal.valueOf(1000), null);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> budgetService.create(user, req));
        assertEquals("Category name is required", ex.getMessage());
    }

    @Test
    void create_zeroLimit_throws() {
        BudgetCreateRequest req = new BudgetCreateRequest("Food", null, null,
                BigDecimal.ZERO, null);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> budgetService.create(user, req));
        assertEquals("Limit must be positive", ex.getMessage());
    }

    @Test
    void create_negativeLimit_throws() {
        BudgetCreateRequest req = new BudgetCreateRequest("Food", null, null,
                BigDecimal.valueOf(-500), null);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> budgetService.create(user, req));
        assertEquals("Limit must be positive", ex.getMessage());
    }

    // ─── update ──────────────────────────────────────────────────

    @Test
    void update_existingBudget_updatesFields() {
        Budget existing = sampleBudget(1L, "Food", BigDecimal.valueOf(3000));
        BudgetCreateRequest req = new BudgetCreateRequest("Groceries", "grocery", "#4caf50",
                BigDecimal.valueOf(4000), "MONTHLY");

        when(budgetRepo.findByIdAndUser(1L, user)).thenReturn(Optional.of(existing));
        when(budgetRepo.save(existing)).thenReturn(existing);
        when(txnRepo.findByAccount_User(user)).thenReturn(List.of());

        BudgetResponse response = budgetService.update(user, 1L, req);

        assertNotNull(response);
        assertEquals("Groceries", existing.getName());
        assertEquals(BigDecimal.valueOf(4000), existing.getLimitAmount());
    }

    @Test
    void update_nonExistentBudget_throws() {
        when(budgetRepo.findByIdAndUser(99L, user)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> budgetService.update(user, 99L,
                        new BudgetCreateRequest("X", null, null, BigDecimal.TEN, null)));
        assertEquals("Budget not found", ex.getMessage());
    }

    // ─── delete ──────────────────────────────────────────────────

    @Test
    void delete_existingBudget_callsRepositoryDelete() {
        Budget existing = sampleBudget(1L, "Food", BigDecimal.valueOf(3000));
        when(budgetRepo.findByIdAndUser(1L, user)).thenReturn(Optional.of(existing));

        budgetService.delete(user, 1L);

        verify(budgetRepo).delete(existing);
    }

    @Test
    void delete_nonExistentBudget_throws() {
        when(budgetRepo.findByIdAndUser(99L, user)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> budgetService.delete(user, 99L));
        assertEquals("Budget not found", ex.getMessage());
    }
}
