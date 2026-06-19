package com.neobank.entity;

import com.neobank.enums.BillStatus;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class BillEntityTest {

    @Test
    void bill_defaultStatus_isPending() {
        Bill bill = Bill.builder()
                .billerName("Electricity Board")
                .amount(BigDecimal.valueOf(1200))
                .dueDate(LocalDate.now().plusDays(5))
                .build();

        assertEquals(BillStatus.PENDING, bill.getStatus());
    }

    @Test
    void bill_defaultRecurring_isFalse() {
        Bill bill = Bill.builder()
                .billerName("Internet Provider")
                .amount(BigDecimal.valueOf(999))
                .dueDate(LocalDate.now().plusDays(10))
                .build();

        assertFalse(bill.isRecurring());
    }

    @Test
    void bill_createdAt_isSetByDefault() {
        Bill bill = Bill.builder()
                .billerName("Water Board")
                .amount(BigDecimal.valueOf(500))
                .dueDate(LocalDate.now().plusDays(3))
                .build();

        assertNotNull(bill.getCreatedAt());
    }

    @Test
    void bill_settersWork() {
        Bill bill = new Bill();
        bill.setBillerName("Gas Agency");
        bill.setAmount(BigDecimal.valueOf(800));
        bill.setStatus(BillStatus.PAID);

        assertEquals("Gas Agency", bill.getBillerName());
        assertEquals(BigDecimal.valueOf(800), bill.getAmount());
        assertEquals(BillStatus.PAID, bill.getStatus());
    }
}
