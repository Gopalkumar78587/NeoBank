package com.neobank.service;

import com.neobank.dto.Loan.LoanApplicationResponse;
import com.neobank.dto.Loan.LoanDecisionRequest;
import com.neobank.entity.LoanApplication;
import com.neobank.enums.LoanApplicationStatus;
import com.neobank.repository.LoanApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LoanDecisionService {

    private final LoanApplicationRepository loanApplicationRepository;
    private final LoanAccountService loanAccountService;

    @Transactional
    public LoanApplicationResponse decide(Long applicationId, LoanDecisionRequest req) {

        LoanApplication application = loanApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException(
                        "Loan application not found with id: " + applicationId));

        // BR-02: cannot re-decide
        if (application.getStatus() != LoanApplicationStatus.PENDING) {
            throw new IllegalStateException(
                    "Application is already " + application.getStatus()
                            + " and cannot be actioned again");
        }

        String decision = req.getDecision().toUpperCase();

        if ("APPROVED".equals(decision)) {
            application.setStatus(LoanApplicationStatus.APPROVED);
            application.setAdminRemarks(req.getAdminRemarks());
            application.setDecidedAt(LocalDateTime.now());
            loanApplicationRepository.save(application);

            // BR-04: atomically create LoanAccount + schedule
            loanAccountService.createAccountAndSchedule(application);

        } else if ("REJECTED".equals(decision)) {
            application.setStatus(LoanApplicationStatus.REJECTED);
            application.setAdminRemarks(req.getAdminRemarks());
            application.setDecidedAt(LocalDateTime.now());
            loanApplicationRepository.save(application);

        } else {
            throw new RuntimeException("Decision must be APPROVED or REJECTED");
        }

        return toResponse(application);
    }

    private LoanApplicationResponse toResponse(LoanApplication a) {
        return new LoanApplicationResponse(
                a.getId(),
                a.getLoanProduct().getId(),
                a.getLoanProduct().getProductName(),
                a.getRequestedAmount(),
                a.getRequestedTenureMonths(),
                a.getStatus(),
                a.getAdminRemarks(),
                a.getAppliedAt(),
                a.getDecidedAt(),
                a.getUser().getFullName(),
                a.getUser().getEmail()
        );
    }
}
