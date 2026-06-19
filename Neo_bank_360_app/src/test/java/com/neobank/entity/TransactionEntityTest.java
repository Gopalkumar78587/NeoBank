package com.neobank.entity;

import com.neobank.enums.TransactionType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class TransactionEntityTest {

    @Test
    void transaction_builderSetsAllFields() {
        Account account = Account.builder()
                .id(1L)
                .accountNumber("NB20260001")
                .build();

        Transaction tx = Transaction.builder()
                .id(1L)
                .account(account)
                .type(TransactionType.CREDIT)
                .amount(BigDecimal.valueOf(5000))
                .balanceAfter(BigDecimal.valueOf(15000))
                .description("Salary")
                .createdAt(LocalDateTime.of(2026, 6, 1, 10, 0))
                .build();

        assertEquals(1L, tx.getId());
        assertEquals(account, tx.getAccount());
        assertEquals(TransactionType.CREDIT, tx.getType());
        assertEquals(BigDecimal.valueOf(5000), tx.getAmount());
        assertEquals(BigDecimal.valueOf(15000), tx.getBalanceAfter());
        assertEquals("Salary", tx.getDescription());
        assertNotNull(tx.getCreatedAt());
    }

    @Test
    void transaction_noArgsConstructor_works() {
        Transaction tx = new Transaction();
        tx.setType(TransactionType.DEBIT);
        tx.setAmount(BigDecimal.valueOf(200));

        assertEquals(TransactionType.DEBIT, tx.getType());
        assertEquals(BigDecimal.valueOf(200), tx.getAmount());
    }
}
