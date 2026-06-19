package com.neobank.config;

import com.neobank.entity.LoanProduct;
import com.neobank.repository.LoanProductRepository;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Seeds 4 default loan products on first startup so customers always
 * have something to apply for. Admins can still create/edit more.
 */
@Component
public class LoanProductInitializer {

    private final LoanProductRepository repo;

    public LoanProductInitializer(LoanProductRepository repo) {
        this.repo = repo;
    }

    @PostConstruct
    public void seed() {
        List<LoanProduct> defaults = List.of(
            build("Home Loan",     500_000,  10_000_000, "8.40",  "60,120,180,240,300"),
            build("Car Loan",      100_000,   2_500_000, "9.25",  "12,24,36,60,72"),
            build("Education Loan", 50_000,   4_000_000, "10.50", "24,36,60,84,120"),
            build("Personal Loan",  25_000,   1_500_000, "12.99", "12,24,36,48,60")
        );

        for (LoanProduct p : defaults) {
            if (!repo.existsByProductName(p.getProductName())) {
                repo.save(p);
                System.out.println("✅ Seeded loan product: " + p.getProductName());
            }
        }
    }

    private static LoanProduct build(String name, long min, long max, String rate, String tenures) {
        return LoanProduct.builder()
                .productName(name)
                .minAmount(BigDecimal.valueOf(min))
                .maxAmount(BigDecimal.valueOf(max))
                .annualInterestRate(new BigDecimal(rate))
                .allowedTenures(tenures)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
