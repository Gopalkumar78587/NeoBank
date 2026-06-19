package com.neobank.controller;

import com.neobank.dto.Account.AccountCreateRequest;
import com.neobank.dto.Account.AccountResponse;
import com.neobank.entity.Account;
import com.neobank.entity.Transaction;
import com.neobank.entity.User;
import com.neobank.enums.AccountClosureStatus;
import com.neobank.enums.AccountStatus;
import com.neobank.enums.TransactionType;
import com.neobank.repository.AccountRepository;
import com.neobank.repository.TransactionRepository;
import com.neobank.repository.UserRepository;
import com.neobank.service.AccountService;
import com.neobank.service.OtpService;
import com.neobank.util.AccountNumberGenerator;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/customer/accounts")
@PreAuthorize("isAuthenticated()")
public class CustomerAccountController {

    private final AccountService accountService;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final OtpService otpService;
    private final TransactionRepository transactionRepository;

    public CustomerAccountController(
            AccountService accountService,
            AccountRepository accountRepository,
            UserRepository userRepository,
            OtpService otpService,
            TransactionRepository transactionRepository) {
        this.accountService = accountService;
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.otpService = otpService;
        this.transactionRepository = transactionRepository;
    }

    private User currentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Account ownAccount(Long id, User user) {
        return accountRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Account not found"));
    }

    // ✅ CREATE ACCOUNT
    @PostMapping
    public AccountResponse createAccount(
            @RequestBody AccountCreateRequest request,
            Authentication authentication) {

        Account account = accountService.createAccount(currentUser(authentication), request);

        return new AccountResponse(
                account.getId(),
                AccountNumberGenerator.mask(account.getAccountNumber()),
                account.getAccountType().name(),
                account.getBalance(),
                account.getStatus().name(),
                account.getClosureStatus().name()
        );
    }

    // ✅ GET ACCOUNTS
    @GetMapping
    public List<AccountResponse> getAccounts(Authentication authentication) {
        return accountService.getUserAccounts(currentUser(authentication));
    }

    // ✅ FREEZE OWN ACCOUNT
    @PatchMapping("/{id}/freeze")
    public ResponseEntity<Map<String, String>> freezeOwn(
            @PathVariable Long id,
            Authentication authentication) {

        Account acc = ownAccount(id, currentUser(authentication));
        acc.setStatus(AccountStatus.FROZEN);
        accountRepository.save(acc);
        return ResponseEntity.ok(Map.of("message", "Account frozen"));
    }

    // ✅ ACTIVATE OWN ACCOUNT
    @PatchMapping("/{id}/activate")
    public ResponseEntity<Map<String, String>> activateOwn(
            @PathVariable Long id,
            Authentication authentication) {

        Account acc = ownAccount(id, currentUser(authentication));
        if (acc.getStatus() == AccountStatus.CLOSED) {
            throw new RuntimeException("Closed accounts cannot be reactivated by customer");
        }
        acc.setStatus(AccountStatus.ACTIVE);
        accountRepository.save(acc);
        return ResponseEntity.ok(Map.of("message", "Account activated"));
    }

    // ✅ CLOSE - alias for request-closure
    @PatchMapping("/{id}/close")
    public ResponseEntity<Map<String, String>> close(
            @PathVariable Long id,
            Authentication authentication) {

        return requestClosureSimple(id, authentication);
    }

    // ✅ SIMPLE REQUEST CLOSURE (no OTP - frontend handles OTP separately via /api/customer/otp)
    @PostMapping("/{id}/request-closure")
    public ResponseEntity<Map<String, String>> requestClosureSimple(
            @PathVariable Long id,
            Authentication authentication) {

        User user = currentUser(authentication);
        Account account = ownAccount(id, user);

        if (account.getBalance().compareTo(BigDecimal.ZERO) > 0) {
            throw new RuntimeException("Balance must be zero to close account");
        }

        account.setClosureStatus(AccountClosureStatus.PENDING);
        accountRepository.save(account);

        return ResponseEntity.ok(Map.of("message", "Closure request submitted"));
    }

    // ✅ STEP 1: SEND OTP (legacy - kept for backwards compatibility)
    @PostMapping("/{id}/request-closure/send-otp")
    public ResponseEntity<String> sendOtp(
            @PathVariable Long id,
            Authentication authentication) {

        User user = currentUser(authentication);
        Account account = ownAccount(id, user);

        if (account.getBalance().compareTo(BigDecimal.ZERO) > 0) {
            throw new RuntimeException("Balance must be zero to close account");
        }

        otpService.generateOtp(user.getEmail());
        return ResponseEntity.ok("✅ OTP sent successfully");
    }

    // ✅ STEP 2: VERIFY OTP + REQUEST CLOSURE (legacy)
    @PostMapping("/{id}/request-closure/verify")
    public ResponseEntity<String> verifyOtp(
            @PathVariable Long id,
            @RequestParam String otp,
            Authentication authentication) {

        User user = currentUser(authentication);
        otpService.verifyOtp(user.getEmail(), otp);

        Account account = ownAccount(id, user);
        account.setClosureStatus(AccountClosureStatus.PENDING);
        accountRepository.save(account);

        return ResponseEntity.ok("✅ Closure request submitted");
    }

    // ✅ BALANCE HISTORY (derived from transactions)
    @GetMapping("/{id}/balance-history")
    public List<Map<String, Object>> balanceHistory(
            @PathVariable Long id,
            Authentication authentication) {

        Account account = ownAccount(id, currentUser(authentication));
        List<Transaction> txs = transactionRepository.findByAccountOrderByCreatedAtDesc(account);
        List<Map<String, Object>> history = new ArrayList<>();
        for (Transaction t : txs) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("date", t.getCreatedAt().toString());
            entry.put("balance", t.getBalanceAfter());
            entry.put("amount", t.getAmount());
            entry.put("type", t.getType().name());
            history.add(entry);
        }
        Collections.reverse(history);
        return history;
    }

    // ✅ CREDIT LIMIT (per-transaction credit ceiling)
    @GetMapping("/{id}/credit-limit")
    public Map<String, Object> creditLimit(
            @PathVariable Long id,
            Authentication authentication) {

        Account acc = ownAccount(id, currentUser(authentication));
        return Map.of(
                "perTransactionLimit", acc.getPerTransactionLimit(),
                "dailyLimit", acc.getDailyLimit()
        );
    }

    // ✅ DEBIT LIMIT (same fields - both directions share account limits)
    @GetMapping("/{id}/debit-limit")
    public Map<String, Object> debitLimit(
            @PathVariable Long id,
            Authentication authentication) {

        Account acc = ownAccount(id, currentUser(authentication));
        BigDecimal todaySum = transactionRepository.sumTodayAmount(acc.getId(), LocalDate.now());
        return Map.of(
                "perTransactionLimit", acc.getPerTransactionLimit(),
                "dailyLimit", acc.getDailyLimit(),
                "usedToday", todaySum,
                "remainingToday", acc.getDailyLimit().subtract(todaySum)
        );
    }

    // ✅ STATEMENT (CSV download)
    @GetMapping("/{id}/statement")
    public ResponseEntity<ByteArrayResource> statement(
            @PathVariable Long id,
            @RequestParam int month,
            @RequestParam int year,
            Authentication authentication) {

        Account account = ownAccount(id, currentUser(authentication));
        YearMonth ym = YearMonth.of(year, month);
        LocalDateTime from = ym.atDay(1).atStartOfDay();
        LocalDateTime to = ym.atEndOfMonth().atTime(23, 59, 59);

        DateTimeFormatter dt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        StringBuilder csv = new StringBuilder();
        csv.append("NeoBank360 Statement\n");
        csv.append("Account: ").append(AccountNumberGenerator.mask(account.getAccountNumber())).append('\n');
        csv.append("Period : ").append(ym).append('\n');
        csv.append("Holder : ").append(account.getUser().getFullName()).append("\n\n");
        csv.append("Date,Type,Amount,Balance After,Description\n");

        List<Transaction> txs = transactionRepository.findByAccountOrderByCreatedAtDesc(account);
        BigDecimal credits = BigDecimal.ZERO;
        BigDecimal debits = BigDecimal.ZERO;
        for (Transaction t : txs) {
            if (t.getCreatedAt() == null) continue;
            if (t.getCreatedAt().isBefore(from) || t.getCreatedAt().isAfter(to)) continue;
            csv.append(t.getCreatedAt().format(dt)).append(',')
               .append(t.getType().name()).append(',')
               .append(t.getAmount()).append(',')
               .append(t.getBalanceAfter()).append(',')
               .append(t.getDescription() == null ? "" : t.getDescription().replace(",", " "))
               .append('\n');
            if (t.getType() == TransactionType.CREDIT) credits = credits.add(t.getAmount());
            else debits = debits.add(t.getAmount());
        }
        csv.append("\nSummary\n");
        csv.append("Total Credits,").append(credits).append('\n');
        csv.append("Total Debits,").append(debits).append('\n');
        csv.append("Closing Balance,").append(account.getBalance()).append('\n');

        byte[] bytes = csv.toString().getBytes();
        ByteArrayResource resource = new ByteArrayResource(bytes);
        String filename = "statement_" + year + "_" + String.format("%02d", month) + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .contentLength(bytes.length)
                .body(resource);
    }
}
