package com.neobank.repository;

import com.neobank.entity.LoanRepayment;
import com.neobank.enums.RepaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface LoanRepaymentRepository extends JpaRepository<LoanRepayment, Long> {

    List<LoanRepayment> findByLoanAccountIdOrderByInstalmentNumberAsc(Long loanAccountId);

    List<LoanRepayment> findByLoanAccountIdAndPaymentStatusOrderByInstalmentNumberAsc(
            Long loanAccountId, RepaymentStatus status);

    @Modifying
    @Query("UPDATE LoanRepayment r SET r.paymentStatus = 'OVERDUE' " +
           "WHERE r.paymentStatus = 'PENDING' AND r.dueDate < :today")
    int markOverdue(LocalDate today);
}
