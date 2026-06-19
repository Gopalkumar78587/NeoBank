package com.neobank.service;

import com.neobank.entity.Transaction;
import com.neobank.entity.User;
import com.neobank.enums.TransactionType;
import com.neobank.repository.TransactionRepository;

import org.springframework.stereotype.Service;

import java.time.Month;
import java.util.*;

@Service
public class AnalyticsService {

    private final TransactionRepository txnRepo;

    public AnalyticsService(TransactionRepository txnRepo) {
        this.txnRepo = txnRepo;
    }

    public Map<String, Double> monthlySpending(User user) {

        List<Transaction> txns = txnRepo.findByAccount_User(user);

        Map<String, Double> result = new HashMap<>();

        for (Transaction t : txns) {

            if (t.getType() == TransactionType.DEBIT) {

                String month = t.getCreatedAt().getMonth().toString();

                result.put(
                        month,
                        result.getOrDefault(month, 0.0)
                                + t.getAmount().doubleValue()
                );
            }
        }

        return result;
    }

    public Map<String, Double> categorySpending(User user) {

        List<Transaction> txns = txnRepo.findByAccount_User(user);

        Map<String, Double> result = new HashMap<>();

        for (Transaction t : txns) {

            if (t.getType() == TransactionType.DEBIT && t.getCategory() != null) {

                String category = t.getCategory().name();

                result.put(
                        category,
                        result.getOrDefault(category, 0.0)
                                + t.getAmount().doubleValue()
                );
            }
        }

        return result;
    }
}
