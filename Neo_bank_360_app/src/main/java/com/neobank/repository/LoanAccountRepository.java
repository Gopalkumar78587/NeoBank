package com.neobank.repository;

import com.neobank.entity.LoanAccount;
import com.neobank.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LoanAccountRepository extends JpaRepository<LoanAccount, Long> {

    List<LoanAccount> findByUserOrderByDisbursedAtDesc(User user);

    Optional<LoanAccount> findByLoanApplicationId(Long loanApplicationId);
}
