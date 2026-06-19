package com.neobank.repository;

import com.neobank.entity.Account;
import com.neobank.entity.User;
import com.neobank.enums.AccountClosureStatus;
import com.neobank.enums.AccountStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {

    // ✅ For listing all customer accounts
    List<Account> findByUser(User user);

    // ✅ For secure ownership check
    Optional<Account> findByIdAndUser(Long id, User user);

    // ✅ For transfers (recipient lookup by account number)
    Optional<Account> findByAccountNumber(String accountNumber);

    // (Admin stats support)
    long countByStatus(AccountStatus status);
    long countByClosureStatus(AccountClosureStatus status);
}