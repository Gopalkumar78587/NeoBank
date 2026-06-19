package com.neobank.service;

import com.neobank.entity.Account;
import com.neobank.entity.Transaction;
import com.neobank.enums.AccountStatus;
import com.neobank.enums.TransactionType;
import com.neobank.repository.AccountRepository;
import com.neobank.repository.TransactionRepository;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TransactionService {

	private final TransactionRepository transactionRepository;
	private final AccountRepository accountRepository;
	private final OtpService otpService;

	public TransactionService(TransactionRepository transactionRepository, AccountRepository accountRepository,
			OtpService otpService) {

		this.transactionRepository = transactionRepository;
		this.accountRepository = accountRepository;
		this.otpService = otpService;
	}

	public Transaction createTransaction(Account account, TransactionType type, BigDecimal amount, String description,
			String userEmail) {

		if (account.getStatus() != AccountStatus.ACTIVE) {
			throw new RuntimeException("Account not active");
		}

		if (amount.compareTo(BigDecimal.ZERO) <= 0) {
			throw new RuntimeException("Invalid amount");
		}

		if (amount.compareTo(account.getPerTransactionLimit()) > 0) {
			throw new RuntimeException("Per-transaction limit exceeded");
		}

		BigDecimal todayTotal = transactionRepository.sumTodayAmount(account.getId(), LocalDate.now());

		if (todayTotal.add(amount).compareTo(account.getDailyLimit()) > 0) {
			throw new RuntimeException("Daily transaction limit exceeded");
		}

		BigDecimal balance = account.getBalance();

		if (type == TransactionType.DEBIT && balance.compareTo(amount) < 0) {
			throw new RuntimeException("Insufficient balance");
		}

		BigDecimal updatedBalance = type == TransactionType.CREDIT ? balance.add(amount) : balance.subtract(amount);

		account.setBalance(updatedBalance);
		accountRepository.save(account);

		Transaction tx = Transaction.builder().account(account).type(type).amount(amount).balanceAfter(updatedBalance)
				.description(description).createdAt(LocalDateTime.now()).build();

		return transactionRepository.save(tx);
	}

	public List<Transaction> getTransactions(Account account) {
		return transactionRepository.findByAccountOrderByCreatedAtDesc(account);
	}
}