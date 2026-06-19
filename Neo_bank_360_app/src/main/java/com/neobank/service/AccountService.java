package com.neobank.service;

import com.neobank.dto.Account.AccountCreateRequest;
import com.neobank.dto.Account.AccountResponse;
import com.neobank.entity.Account;
import com.neobank.entity.User;
import com.neobank.enums.AccountClosureStatus;
import com.neobank.enums.AccountStatus;
import com.neobank.repository.AccountRepository;
import com.neobank.util.AccountNumberGenerator;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AccountService {

    private final AccountRepository accountRepository;

    public AccountService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    // ✅ CREATE ACCOUNT (SAFE) — submits as PENDING_APPROVAL until admin approves.
    public Account createAccount(User user, AccountCreateRequest request) {

        // Real-bank rule: KYC must be completed before opening an account.
        if (!user.isKycVerified()) {
            throw new RuntimeException("KYC verification required. Please complete your profile (Aadhaar, PAN, Date of Birth) before opening an account.");
        }

        if (request.getAcceptedTerms() != null && !request.getAcceptedTerms()) {
            throw new RuntimeException("Terms & conditions must be accepted");
        }

        BigDecimal initial =
                request.getInitialDeposit() != null
                        ? request.getInitialDeposit()
                        : BigDecimal.ZERO;

        // Real-bank minimum balance enforcement (Savings: 1000, Current: 5000)
        BigDecimal minRequired = switch (request.getAccountType().name()) {
            case "CURRENT" -> new BigDecimal("5000");
            default -> new BigDecimal("1000");
        };
        if (initial.compareTo(minRequired) < 0) {
            throw new RuntimeException("Minimum initial deposit for " + request.getAccountType().name()
                    + " account is ₹" + minRequired);
        }

        Account account = Account.builder()
                .accountNumber(AccountNumberGenerator.generate())
                .accountType(request.getAccountType())
                .balance(BigDecimal.ZERO)                            // ✅ No balance until approved
                .pendingDeposit(initial)                              // ✅ held until admin approves
                .status(AccountStatus.PENDING_APPROVAL)               // ✅ needs admin review
                .closureStatus(AccountClosureStatus.NONE)
                .perTransactionLimit(new BigDecimal("50000"))
                .dailyLimit(new BigDecimal("100000"))
                .user(user)
                .createdAt(LocalDateTime.now())
                .nomineeName(trim(request.getNomineeName()))
                .nomineeRelation(trim(request.getNomineeRelation()))
                .nomineeDob(request.getNomineeDob())
                .purpose(trim(request.getPurpose()))
                .communicationMode(trim(request.getCommunicationMode()))
                .occupation(trim(request.getOccupation()))
                .employmentStatus(trim(request.getEmploymentStatus()))
                .branchPreference(trim(request.getBranchPreference()))
                .debitCardRequired(Boolean.TRUE.equals(request.getDebitCardRequired()))
                .chequeBookRequired(Boolean.TRUE.equals(request.getChequeBookRequired()))
                .netBankingRequired(Boolean.TRUE.equals(request.getNetBankingRequired()))
                .build();

        return accountRepository.save(account);
    }

    private static String trim(String s) { return s == null ? null : s.trim(); }

    // ✅ CUSTOMER ACCOUNTS (MASKED)

		public List<AccountResponse> getUserAccounts(User user) {
		
		    return accountRepository.findByUser(user)   // ✅ CORRECT
		            .stream()
		            .map(acc -> new AccountResponse(
		                    acc.getId(),
		                    AccountNumberGenerator.mask(acc.getAccountNumber()),
		                    acc.getAccountType().name(),
		                    acc.getBalance(),
		                    acc.getStatus().name(),
		                    acc.getClosureStatus().name()
		            ))
		            .toList();
}

}