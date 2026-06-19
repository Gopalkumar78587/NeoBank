package com.neobank.entity;

import com.neobank.enums.AccountClosureStatus;
import com.neobank.enums.AccountStatus;
import com.neobank.enums.AccountType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class AccountEntityTest {

    @Test
    void account_defaultStatus_isActive() {
        Account account = Account.builder()
                .accountNumber("NB20260001")
                .accountType(AccountType.SAVINGS)
                .balance(BigDecimal.ZERO)
                .build();

        assertEquals(AccountStatus.ACTIVE, account.getStatus());
    }

    @Test
    void account_defaultClosureStatus_isNone() {
        Account account = Account.builder()
                .accountNumber("NB20260001")
                .accountType(AccountType.CURRENT)
                .balance(BigDecimal.ZERO)
                .build();

        assertEquals(AccountClosureStatus.NONE, account.getClosureStatus());
    }

    @Test
    void account_defaultPerTransactionLimit_is50000() {
        Account account = Account.builder()
                .accountNumber("NB20260002")
                .accountType(AccountType.SAVINGS)
                .balance(BigDecimal.ZERO)
                .build();

        assertEquals(new BigDecimal("50000"), account.getPerTransactionLimit());
    }

    @Test
    void account_defaultDailyLimit_is100000() {
        Account account = Account.builder()
                .accountNumber("NB20260003")
                .accountType(AccountType.SAVINGS)
                .balance(BigDecimal.ZERO)
                .build();

        assertEquals(new BigDecimal("100000"), account.getDailyLimit());
    }

    @Test
    void account_settersWork() {
        Account account = new Account();
        account.setAccountNumber("NB20260004");
        account.setBalance(BigDecimal.valueOf(5000));
        account.setStatus(AccountStatus.FROZEN);

        assertEquals("NB20260004", account.getAccountNumber());
        assertEquals(BigDecimal.valueOf(5000), account.getBalance());
        assertEquals(AccountStatus.FROZEN, account.getStatus());
    }
}
