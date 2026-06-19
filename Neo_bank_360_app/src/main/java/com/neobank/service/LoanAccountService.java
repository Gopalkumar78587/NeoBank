package com.neobank.service;

import com.neobank.dto.Loan.LoanAccountResponse;
import com.neobank.dto.Loan.RepaymentScheduleResponse;
import com.neobank.entity.*;
import com.neobank.enums.LoanApplicationStatus;
import com.neobank.enums.RepaymentStatus;
import com.neobank.repository.LoanAccountRepository;
import com.neobank.repository.LoanRepaymentRepository;
import com.neobank.util.EmiCalculatorUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanAccountService {

    private final LoanAccountRepository loanAccountRepository;
    private final LoanRepaymentRepository loanRepaymentRepository;

    /**
     * Called atomically on loan approval.
     * Creates LoanAccount and generates full amortization schedule.
     */
    @Transactional
    public LoanAccount createAccountAndSchedule(LoanApplication application) {

        BigDecimal principal = application.getRequestedAmount();
        BigDecimal annualRate = application.getLoanProduct().getAnnualInterestRate();
        int tenure = application.getRequestedTenureMonths();

        BigDecimal emi = EmiCalculatorUtil.calculateEMI(principal, annualRate, tenure);

        LoanAccount account = LoanAccount.builder()
                .loanApplication(application)
                .user(application.getUser())
                .principalAmount(principal)
                .annualInterestRate(annualRate)
                .tenureMonths(tenure)
                .emiAmount(emi)
                .disbursedAt(LocalDateTime.now())
                .build();

        account = loanAccountRepository.save(account);

        generateSchedule(account);

        return account;
    }

    private void generateSchedule(LoanAccount account) {
        BigDecimal monthlyRate = account.getAnnualInterestRate()
                .divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);

        BigDecimal outstanding = account.getPrincipalAmount();
        BigDecimal emi = account.getEmiAmount();
        LocalDate disbursed = account.getDisbursedAt().toLocalDate();

        List<LoanRepayment> repayments = new ArrayList<>();
        int tenure = account.getTenureMonths();

        for (int i = 1; i <= tenure; i++) {
            BigDecimal interest = outstanding.multiply(monthlyRate)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal principalComp = emi.subtract(interest);

            // Final instalment: absorb rounding residual
            if (i == tenure) {
                principalComp = outstanding;
                interest = emi.subtract(principalComp);
                if (interest.compareTo(BigDecimal.ZERO) < 0) {
                    interest = BigDecimal.ZERO;
                }
            }

            outstanding = outstanding.subtract(principalComp)
                    .setScale(2, RoundingMode.HALF_UP);

            LoanRepayment repayment = LoanRepayment.builder()
                    .loanAccount(account)
                    .instalmentNumber(i)
                    .dueDate(disbursed.plusMonths(i))
                    .emiAmount(emi)
                    .principalComponent(principalComp)
                    .interestComponent(interest)
                    .paymentStatus(RepaymentStatus.PENDING)
                    .build();

            repayments.add(repayment);
        }

        loanRepaymentRepository.saveAll(repayments);
    }

    public List<LoanAccountResponse> getMyAccounts(User user) {
        return loanAccountRepository.findByUserOrderByDisbursedAtDesc(user)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<RepaymentScheduleResponse> getRepaymentSchedule(
            Long loanAccountId, User user, String status) {

        LoanAccount account = loanAccountRepository.findById(loanAccountId)
                .orElseThrow(() -> new RuntimeException("Loan account not found"));

        // BR-06: ownership check
        if (!account.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Access denied to this loan account");
        }

        List<LoanRepayment> repayments;
        if (status != null && !status.isBlank()) {
            repayments = loanRepaymentRepository
                    .findByLoanAccountIdAndPaymentStatusOrderByInstalmentNumberAsc(
                            loanAccountId, RepaymentStatus.valueOf(status));
        } else {
            repayments = loanRepaymentRepository
                    .findByLoanAccountIdOrderByInstalmentNumberAsc(loanAccountId);
        }

        // Apply overdue logic on fetch
        LocalDate today = LocalDate.now();
        repayments.forEach(r -> {
            if (r.getPaymentStatus() == RepaymentStatus.PENDING &&
                    r.getDueDate().isBefore(today)) {
                r.setPaymentStatus(RepaymentStatus.OVERDUE);
            }
        });
        loanRepaymentRepository.saveAll(repayments);

        return repayments.stream().map(this::toScheduleResponse).collect(Collectors.toList());
    }

    public RepaymentScheduleResponse markAsPaid(Long loanAccountId, Long repaymentId, User user) {
        LoanAccount account = loanAccountRepository.findById(loanAccountId)
                .orElseThrow(() -> new RuntimeException("Loan account not found"));

        if (!account.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Access denied");
        }

        LoanRepayment repayment = loanRepaymentRepository.findById(repaymentId)
                .orElseThrow(() -> new RuntimeException("Repayment record not found"));

        if (!repayment.getLoanAccount().getId().equals(loanAccountId)) {
            throw new RuntimeException("Repayment does not belong to this loan account");
        }

        if (repayment.getPaymentStatus() == RepaymentStatus.PAID) {
            throw new RuntimeException("Instalment is already paid");
        }

        repayment.setPaymentStatus(RepaymentStatus.PAID);
        repayment.setPaidAt(LocalDateTime.now());
        return toScheduleResponse(loanRepaymentRepository.save(repayment));
    }

    private LoanAccountResponse toResponse(LoanAccount a) {
        return new LoanAccountResponse(
                a.getId(),
                a.getLoanApplication().getId(),
                a.getLoanApplication().getLoanProduct().getProductName(),
                a.getPrincipalAmount(),
                a.getAnnualInterestRate(),
                a.getTenureMonths(),
                a.getEmiAmount(),
                a.getDisbursedAt()
        );
    }

    private RepaymentScheduleResponse toScheduleResponse(LoanRepayment r) {
        return new RepaymentScheduleResponse(
                r.getId(),
                r.getInstalmentNumber(),
                r.getDueDate(),
                r.getEmiAmount(),
                r.getPrincipalComponent(),
                r.getInterestComponent(),
                r.getPaymentStatus(),
                r.getPaidAt()
        );
    }
}
