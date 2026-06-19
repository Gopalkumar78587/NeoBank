package com.neobank.service;

import com.neobank.entity.*;
import com.neobank.enums.*;
import com.neobank.repository.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Transactional
public class BillService {

    private final BillRepository billRepository;
    private final RewardRepository rewardRepository;
    private final TransactionRepository txnRepo;
    private final AccountRepository accountRepository;

    public BillService(BillRepository billRepository,
                       RewardRepository rewardRepository,
                       TransactionRepository txnRepo,
                       AccountRepository accountRepository) {
        this.billRepository = billRepository;
        this.rewardRepository = rewardRepository;
        this.txnRepo = txnRepo;
        this.accountRepository = accountRepository;
    }

    // ✅ CREATE BILL
    public Bill createBill(Bill bill, User user) {

        if (bill.getAmount() == null || bill.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Amount must be greater than zero");
        }

        if (bill.getDueDate() == null || bill.getDueDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Due date must be in the future");
        }

        YearMonth ym = YearMonth.from(bill.getDueDate());

        boolean exists = billRepository
                .existsByUserAndBillerNameAndDueDateBetween(
                        user,
                        bill.getBillerName(),
                        ym.atDay(1),
                        ym.atEndOfMonth()
                );

        if (exists) {
            throw new RuntimeException("Duplicate bill for same month");
        }

        bill.setUser(user);
        if (bill.getStatus() == null) bill.setStatus(BillStatus.PENDING);
        if (bill.getCreatedAt() == null) bill.setCreatedAt(LocalDateTime.now());

        return billRepository.save(bill);
    }

    // ✅ REMINDER LOGIC
    public List<Bill> getBillsWithReminder(User user) {

        List<Bill> bills = billRepository.findByUser(user);
        LocalDate today = LocalDate.now();

        for (Bill bill : bills) {
            long days = ChronoUnit.DAYS.between(today, bill.getDueDate());
            bill.setReminder(
                    days >= 0 && days <= 3 && bill.getStatus() == BillStatus.PENDING
            );
        }
        return bills;
    }

    // ✅ FILTER BY STATUS
    public List<Bill> getBillsByStatus(User user, BillStatus status) {
        return billRepository.findByUser(user).stream()
                .filter(b -> b.getStatus() == status)
                .toList();
    }

    // ✅ UPDATE STATUS (allows admin override / cancellation)
    public Bill updateStatus(Long id, BillStatus newStatus, User user) {

        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        if (!bill.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access");
        }

        bill.setStatus(newStatus);
        if (newStatus == BillStatus.PAID && bill.getPaidAt() == null) {
            bill.setPaidAt(LocalDateTime.now());
        }
        return billRepository.save(bill);
    }

    // ✅ TOGGLE AUTO-PAY
    public Bill toggleAutoPay(Long id, boolean enabled, User user) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found"));
        if (!bill.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access");
        }
        bill.setAutoPayEnabled(enabled);
        return billRepository.save(bill);
    }

    // ✅ PAY BILL (FULL REAL BANK LOGIC)
    public Bill payBill(Long billId, Long accountId, User user) {

        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        if (!bill.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access");
        }

        if (bill.getStatus() == BillStatus.PAID) {
            throw new RuntimeException("Bill already paid");
        }

        Account acc = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        if (!acc.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Account does not belong to user");
        }

        if (acc.getBalance().compareTo(bill.getAmount()) < 0) {
            bill.setStatus(BillStatus.FAILED);
            billRepository.save(bill);
            throw new RuntimeException("Insufficient balance");
        }

        // ✅ Deduct
        acc.setBalance(acc.getBalance().subtract(bill.getAmount()));
        accountRepository.save(acc);

        // ✅ Save transaction
        Transaction txn = Transaction.builder()
                .amount(bill.getAmount())
                .type(TransactionType.DEBIT)
                .category(Category.UTILITIES)
                .description("Bill Payment: " + bill.getBillerName())
                .createdAt(LocalDateTime.now())
                .account(acc)
                .balanceAfter(acc.getBalance())
                .referenceId(bill.getId())
                .build();
        txnRepo.save(txn);

        // ✅ Update bill
        bill.setStatus(BillStatus.PAID);
        bill.setPaidAt(LocalDateTime.now());
        bill.setAccountId(accountId);
        bill.setReferenceNumber("REF" + System.currentTimeMillis());
        Bill saved = billRepository.save(bill);

        // ✅ ADD REWARD
        Reward reward = rewardRepository.findByUser(user)
                .orElseGet(() -> {
                    Reward r = new Reward();
                    r.setUser(user);
                    r.setPoints(0);
                    return r;
                });
        reward.setPoints(reward.getPoints() + 10);
        rewardRepository.save(reward);

        return saved;
    }

    // ✅ ANALYTICS
    public Map<String, Object> analytics(User user) {
        List<Bill> bills = billRepository.findByUser(user);

        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal totalPending = BigDecimal.ZERO;
        BigDecimal totalOverdue = BigDecimal.ZERO;

        Map<String, BigDecimal> categoryAmount = new LinkedHashMap<>();
        Map<String, Integer> categoryCount = new LinkedHashMap<>();
        Map<String, BigDecimal> monthly = new java.util.TreeMap<>();

        DateTimeFormatter ymf = DateTimeFormatter.ofPattern("yyyy-MM");

        for (Bill b : bills) {
            String cat = b.getCategory() == null ? "Other" : b.getCategory();
            categoryAmount.merge(cat, b.getAmount(), BigDecimal::add);
            categoryCount.merge(cat, 1, Integer::sum);

            switch (b.getStatus()) {
                case PAID -> {
                    totalPaid = totalPaid.add(b.getAmount());
                    LocalDateTime when = b.getPaidAt();
                    if (when == null) when = b.getDueDate().atStartOfDay();
                    monthly.merge(when.format(ymf), b.getAmount(), BigDecimal::add);
                }
                case PENDING -> totalPending = totalPending.add(b.getAmount());
                case OVERDUE -> totalOverdue = totalOverdue.add(b.getAmount());
                default -> { /* SCHEDULED/FAILED/CANCELLED ignored */ }
            }
        }

        List<Map<String, Object>> categoryBreakdown = categoryAmount.entrySet().stream()
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("category", e.getKey());
                    m.put("amount", e.getValue());
                    m.put("count", categoryCount.getOrDefault(e.getKey(), 0));
                    return m;
                })
                .toList();

        List<Map<String, Object>> monthlySpending = monthly.entrySet().stream()
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("month", e.getKey());
                    m.put("amount", e.getValue());
                    return m;
                })
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalPaid", totalPaid);
        result.put("totalPending", totalPending);
        result.put("totalOverdue", totalOverdue);
        result.put("categoryBreakdown", categoryBreakdown);
        result.put("monthlySpending", monthlySpending);
        return result;
    }
}
