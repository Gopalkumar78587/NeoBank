package com.neobank.service;

import com.neobank.dto.Account.AccountCreateRequest;
import com.neobank.dto.Account.AccountResponse;
import com.neobank.entity.Account;
import com.neobank.entity.User;
import com.neobank.enums.AccountStatus;
import com.neobank.enums.AccountType;
import com.neobank.repository.AccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @InjectMocks
    private AccountService accountService;

    private User sampleUser() {
        User u = new User();
        u.setFullName("Gopal Kumar");
        u.setEmail("gopal@neobank.in");
        return u;
    }

    @Test
    void createAccount_withInitialDeposit_savesAndReturnsAccount() {
        AccountCreateRequest req = new AccountCreateRequest();
        // set via reflection-safe setters when available; use builder fallback
        // AccountCreateRequest has package-visible fields — set via getters return type
        // We verify save is called and result equals saved entity

        Account saved = Account.builder()
                .accountNumber("NB20260001")
                .accountType(AccountType.SAVINGS)
                .balance(BigDecimal.valueOf(5000))
                .status(AccountStatus.ACTIVE)
                .user(sampleUser())
                .build();

        when(accountRepository.save(any(Account.class))).thenReturn(saved);

        // Use reflection to set request fields since class has no setter
        try {
            var f1 = AccountCreateRequest.class.getDeclaredField("accountType");
            var f2 = AccountCreateRequest.class.getDeclaredField("initialDeposit");
            f1.setAccessible(true);
            f2.setAccessible(true);
            f1.set(req, AccountType.SAVINGS);
            f2.set(req, BigDecimal.valueOf(5000));
        } catch (Exception e) {
            fail("Could not set AccountCreateRequest fields: " + e.getMessage());
        }

        Account result = accountService.createAccount(sampleUser(), req);

        assertNotNull(result);
        assertEquals("NB20260001", result.getAccountNumber());
        assertEquals(BigDecimal.valueOf(5000), result.getBalance());
        verify(accountRepository).save(any(Account.class));
    }

    @Test
    void createAccount_withNullDeposit_usesZeroBalance() {
        AccountCreateRequest req = new AccountCreateRequest();
        try {
            var f1 = AccountCreateRequest.class.getDeclaredField("accountType");
            f1.setAccessible(true);
            f1.set(req, AccountType.CURRENT);
            // initialDeposit left null
        } catch (Exception e) {
            fail(e.getMessage());
        }

        Account saved = Account.builder()
                .accountNumber("NB20260002")
                .accountType(AccountType.CURRENT)
                .balance(BigDecimal.ZERO)
                .status(AccountStatus.ACTIVE)
                .user(sampleUser())
                .build();

        when(accountRepository.save(any(Account.class))).thenReturn(saved);

        Account result = accountService.createAccount(sampleUser(), req);

        assertNotNull(result);
        assertEquals(BigDecimal.ZERO, result.getBalance());
    }

    @Test
    void getUserAccounts_returnsResponseList() {
        User user = sampleUser();
        Account acc = Account.builder()
                .id(1L)
                .accountNumber("NB20260001")
                .accountType(AccountType.SAVINGS)
                .balance(BigDecimal.valueOf(1000))
                .status(AccountStatus.ACTIVE)
                .closureStatus(com.neobank.enums.AccountClosureStatus.NONE)
                .user(user)
                .build();

        when(accountRepository.findByUser(user)).thenReturn(List.of(acc));

        List<AccountResponse> responses = accountService.getUserAccounts(user);

        assertEquals(1, responses.size());
        assertEquals("SAVINGS", responses.get(0).accountType());
        assertEquals(BigDecimal.valueOf(1000), responses.get(0).balance());
        assertEquals("ACTIVE", responses.get(0).status());
    }

    @Test
    void getUserAccounts_noAccounts_returnsEmptyList() {
        User user = sampleUser();
        when(accountRepository.findByUser(user)).thenReturn(List.of());

        List<AccountResponse> responses = accountService.getUserAccounts(user);

        assertTrue(responses.isEmpty());
    }
}
