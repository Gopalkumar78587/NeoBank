package com.neobank.controller;

import com.neobank.entity.Account;
import com.neobank.entity.Transaction;
import com.neobank.enums.TransactionType;
import com.neobank.repository.AccountRepository;
import com.neobank.service.OtpService;
import com.neobank.service.TransactionService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/customer/accounts/{accountId}/transactions")
@PreAuthorize("isAuthenticated()")
public class TransactionController {

    private final TransactionService transactionService;
    private final AccountRepository accountRepository;
    private final OtpService otpService;

    public TransactionController(
            TransactionService transactionService,
            AccountRepository accountRepository,
            OtpService otpService) {
        this.transactionService = transactionService;
        this.accountRepository = accountRepository;
        this.otpService = otpService;
    }

    // ✅ GET TRANSACTIONS
    @GetMapping
    public List<Transaction> getTransactions(@PathVariable Long accountId) {

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        return transactionService.getTransactions(account);
    }

    // ✅ CREATE TRANSACTION (combined endpoint - assumes OTP already verified separately,
    //    or accepts otp param to verify inline)
    @PostMapping
    public ResponseEntity<Transaction> create(
            @PathVariable Long accountId,
            @RequestParam TransactionType type,
            @RequestParam BigDecimal amount,
            @RequestParam(required = false, defaultValue = "") String description,
            @RequestParam(required = false) String otp,
            Authentication authentication) {

        if (otp != null && !otp.isBlank()) {
            otpService.verifyOtp(authentication.getName(), otp);
        }

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        Transaction tx = transactionService.createTransaction(
                account, type, amount, description, authentication.getName()
        );
        return ResponseEntity.ok(tx);
    }

    // ✅ ATOMIC ACCOUNT-TO-ACCOUNT TRANSFER (real-bank behavior)
    @PostMapping("/transfer")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<java.util.Map<String, Object>> transfer(
            @PathVariable Long accountId,
            @RequestParam String toAccountNumber,
            @RequestParam BigDecimal amount,
            @RequestParam(required = false, defaultValue = "") String note,
            Authentication authentication) {

        Account source = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Source account not found"));
        Account dest = accountRepository.findByAccountNumber(toAccountNumber.trim())
                .orElseThrow(() -> new RuntimeException("Destination account not found: " + toAccountNumber));

        if (source.getId().equals(dest.getId())) {
            throw new RuntimeException("Cannot transfer to the same account");
        }

        String descDebit  = "Transfer to "   + maskAcc(dest.getAccountNumber())   + (note.isBlank() ? "" : " — " + note);
        String descCredit = "Transfer from " + maskAcc(source.getAccountNumber()) + (note.isBlank() ? "" : " — " + note);

        Transaction debit = transactionService.createTransaction(
                source, TransactionType.DEBIT, amount, descDebit, authentication.getName());
        Transaction credit = transactionService.createTransaction(
                dest, TransactionType.CREDIT, amount, descCredit, authentication.getName());

        debit.setReferenceId(credit.getId());
        credit.setReferenceId(debit.getId());

        return ResponseEntity.ok(java.util.Map.of(
                "message", "Transfer successful",
                "amount", amount,
                "from", maskAcc(source.getAccountNumber()),
                "to", maskAcc(dest.getAccountNumber()),
                "debitTxnId", debit.getId(),
                "creditTxnId", credit.getId(),
                "sourceBalance", source.getBalance()
        ));
    }

    private static String maskAcc(String n) {
        if (n == null || n.length() < 4) return n;
        return "NB****" + n.substring(n.length() - 4);
    }

    // ✅ SEND OTP (legacy - kept for backwards compatibility, no-op clients)
    @PostMapping("/initiate")
    public ResponseEntity<String> initiateTransaction(Authentication authentication) {
        otpService.generateOtp(authentication.getName());
        return ResponseEntity.ok("OTP sent");
    }

    // ✅ CONFIRM TRANSACTION (legacy)
    @PostMapping("/confirm")
    public ResponseEntity<Transaction> confirmTransaction(
            @PathVariable Long accountId,
            @RequestParam TransactionType type,
            @RequestParam BigDecimal amount,
            @RequestParam String description,
            @RequestParam String otp,
            Authentication authentication) {

        otpService.verifyOtp(authentication.getName(), otp);

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        Transaction tx = transactionService.createTransaction(
                account, type, amount, description, authentication.getName()
        );

        return ResponseEntity.ok(tx);
    }
}
