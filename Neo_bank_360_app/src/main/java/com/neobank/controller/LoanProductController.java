package com.neobank.controller;

import com.neobank.dto.Loan.LoanProductRequest;
import com.neobank.dto.Loan.LoanProductResponse;
import com.neobank.service.LoanProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans/products")
@RequiredArgsConstructor
public class LoanProductController {

    private final LoanProductService loanProductService;

    /**
     * ADMIN ONLY — Create a new loan product.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LoanProductResponse> create(
            @Valid @RequestBody LoanProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(loanProductService.create(request));
    }

    /**
     * All authenticated users — list all loan products.
     */
    @GetMapping
    public ResponseEntity<List<LoanProductResponse>> getAll() {
        return ResponseEntity.ok(loanProductService.getAll());
    }

    /**
     * All authenticated users — get a specific product by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<LoanProductResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(loanProductService.getById(id));
    }
}
