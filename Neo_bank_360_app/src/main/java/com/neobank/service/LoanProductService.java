package com.neobank.service;

import com.neobank.dto.Loan.LoanProductRequest;
import com.neobank.dto.Loan.LoanProductResponse;
import com.neobank.entity.LoanProduct;
import com.neobank.repository.LoanProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanProductService {

    private final LoanProductRepository loanProductRepository;

    @CacheEvict(value = "loanProducts", allEntries = true)
    public LoanProductResponse create(LoanProductRequest req) {
        if (req.getMaxAmount().compareTo(req.getMinAmount()) <= 0) {
            throw new RuntimeException("Maximum amount must be greater than minimum amount");
        }
        if (loanProductRepository.existsByProductName(req.getProductName())) {
            throw new RuntimeException("Loan product with this name already exists");
        }

        LoanProduct product = LoanProduct.builder()
                .productName(req.getProductName())
                .minAmount(req.getMinAmount())
                .maxAmount(req.getMaxAmount())
                .annualInterestRate(req.getAnnualInterestRate())
                .allowedTenures(req.getAllowedTenures())
                .build();

        return toResponse(loanProductRepository.save(product));
    }

    @Cacheable(value = "loanProducts", key = "'all'")
    public List<LoanProductResponse> getAll() {
        return loanProductRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public LoanProductResponse getById(Long id) {
        LoanProduct product = loanProductRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan product not found with id: " + id));
        return toResponse(product);
    }

    private LoanProductResponse toResponse(LoanProduct p) {
        List<Integer> tenures = Arrays.stream(p.getAllowedTenures().split(","))
                .map(String::trim)
                .map(Integer::parseInt)
                .collect(Collectors.toList());

        return new LoanProductResponse(
                p.getId(),
                p.getProductName(),
                p.getMinAmount(),
                p.getMaxAmount(),
                p.getAnnualInterestRate(),
                tenures,
                p.getCreatedAt()
        );
    }
}
