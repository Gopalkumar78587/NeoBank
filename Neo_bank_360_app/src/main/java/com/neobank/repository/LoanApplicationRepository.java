package com.neobank.repository;

import com.neobank.entity.LoanApplication;
import com.neobank.entity.LoanProduct;
import com.neobank.entity.User;
import com.neobank.enums.LoanApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LoanApplicationRepository extends JpaRepository<LoanApplication, Long> {

    List<LoanApplication> findByUserOrderByAppliedAtDesc(User user);

    List<LoanApplication> findAllByOrderByAppliedAtDesc();

    List<LoanApplication> findByStatusOrderByAppliedAtDesc(LoanApplicationStatus status);

    Optional<LoanApplication> findByUserAndLoanProductAndStatus(
            User user, LoanProduct loanProduct, LoanApplicationStatus status);

    boolean existsByUserAndLoanProductAndStatus(
            User user, LoanProduct loanProduct, LoanApplicationStatus status);

    long countByStatus(LoanApplicationStatus status);
}
