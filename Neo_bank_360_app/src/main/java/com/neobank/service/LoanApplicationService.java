package com.neobank.service;

import com.neobank.dto.Loan.LoanApplicationRequest;
import com.neobank.dto.Loan.LoanApplicationResponse;
import com.neobank.entity.LoanApplication;
import com.neobank.entity.LoanProduct;
import com.neobank.entity.User;
import com.neobank.enums.LoanApplicationStatus;
import com.neobank.repository.LoanApplicationRepository;
import com.neobank.repository.LoanProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanApplicationService {

    private final LoanApplicationRepository loanApplicationRepository;
    private final LoanProductRepository loanProductRepository;

    public LoanApplicationResponse apply(User user, LoanApplicationRequest req) {

        LoanProduct product = loanProductRepository.findById(req.getLoanProductId())
                .orElseThrow(() -> new RuntimeException("Loan product not found"));

        // BR-01: amount within [min, max]
        if (req.getRequestedAmount().compareTo(product.getMinAmount()) < 0 ||
                req.getRequestedAmount().compareTo(product.getMaxAmount()) > 0) {
            throw new RuntimeException(
                    "Requested amount must be between " + product.getMinAmount()
                            + " and " + product.getMaxAmount());
        }

        // BR-02: tenure must match allowed tenures
        List<Integer> allowed = Arrays.stream(product.getAllowedTenures().split(","))
                .map(String::trim).map(Integer::parseInt).collect(Collectors.toList());
        if (!allowed.contains(req.getRequestedTenureMonths())) {
            throw new RuntimeException(
                    "Tenure " + req.getRequestedTenureMonths()
                            + " months is not allowed. Allowed: " + product.getAllowedTenures());
        }

        // BR-04: no duplicate PENDING application
        if (loanApplicationRepository.existsByUserAndLoanProductAndStatus(
                user, product, LoanApplicationStatus.PENDING)) {
            throw new RuntimeException(
                    "A pending application for this product already exists");
        }

        LoanApplication application = LoanApplication.builder()
                .user(user)
                .loanProduct(product)
                .requestedAmount(req.getRequestedAmount())
                .requestedTenureMonths(req.getRequestedTenureMonths())
                .status(LoanApplicationStatus.PENDING)
                .build();

        return toResponse(loanApplicationRepository.save(application));
    }

    public List<LoanApplicationResponse> getMyApplications(User user) {
        return loanApplicationRepository.findByUserOrderByAppliedAtDesc(user)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<LoanApplicationResponse> getAllApplications(String status) {
        if (status != null && !status.isBlank()) {
            return loanApplicationRepository
                    .findByStatusOrderByAppliedAtDesc(LoanApplicationStatus.valueOf(status))
                    .stream().map(this::toResponse).collect(Collectors.toList());
        }
        return loanApplicationRepository.findAllByOrderByAppliedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
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
