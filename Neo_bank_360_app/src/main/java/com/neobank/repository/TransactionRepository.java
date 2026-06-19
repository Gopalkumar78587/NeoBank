package com.neobank.repository;

import com.neobank.entity.Account;
import com.neobank.entity.Transaction;
import com.neobank.entity.User;
import com.neobank.enums.AccountStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface TransactionRepository
        extends JpaRepository<Transaction, Long> {

    // ✅ Latest transactions first
    List<Transaction> findByAccountOrderByCreatedAtDesc(Account account);

    @Query("""
    		SELECT COALESCE(SUM(t.amount), 0)
    		FROM Transaction t
    		WHERE t.account.id = :accountId
    		AND DATE(t.createdAt) = :today
    		""")
    BigDecimal sumTodayAmount(Long accountId, LocalDate today);

    List<Transaction> findByAccount_User(User user);

    // ── Sprint 4: Insights aggregations ──────────────────────────────────────

    @Query("""
        SELECT COALESCE(SUM(t.amount), 0)
        FROM Transaction t
        WHERE t.account.user.id = :userId
          AND t.type = 'CREDIT'
          AND t.account.status = :status
        """)
    BigDecimal sumCreditByUserAndStatus(@Param("userId") Long userId,
                                        @Param("status") AccountStatus status);

    @Query("""
        SELECT COALESCE(SUM(t.amount), 0)
        FROM Transaction t
        WHERE t.account.user.id = :userId
          AND t.type = 'DEBIT'
          AND t.account.status = :status
        """)
    BigDecimal sumDebitByUserAndStatus(@Param("userId") Long userId,
                                       @Param("status") AccountStatus status);

    /**
     * Returns rows: [year(int), month(int), type(String), total(BigDecimal)]
     * for all transactions of a user on active accounts since a given date.
     */
    @Query(nativeQuery = true, value = """
        SELECT YEAR(t.created_at)  AS yr,
               MONTH(t.created_at) AS mo,
               t.type              AS txType,
               SUM(t.amount)       AS total
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE a.user_id = :userId
          AND a.status  = 'ACTIVE'
          AND t.created_at >= :since
        GROUP BY YEAR(t.created_at), MONTH(t.created_at), t.type
        ORDER BY yr DESC, mo DESC
        """)
    List<Object[]> findTrendData(@Param("userId") Long userId,
                                  @Param("since") LocalDateTime since);

    // ── Sprint 4: Platform-wide aggregations (admin) ─────────────────────────

    @Query(nativeQuery = true, value = """
        SELECT COALESCE(SUM(t.amount), 0)
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE t.type = 'CREDIT' AND a.status = 'ACTIVE'
        """)
    BigDecimal sumAllCredit();

    @Query(nativeQuery = true, value = """
        SELECT COALESCE(SUM(t.amount), 0)
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE t.type = 'DEBIT' AND a.status = 'ACTIVE'
        """)
    BigDecimal sumAllDebit();

    /**
     * Last N transactions for a given user (across all their accounts).
     */
    @Query("""
        SELECT t FROM Transaction t
        WHERE t.account.user.id = :userId
        ORDER BY t.createdAt DESC
        """)
    List<Transaction> findRecentByUserId(@Param("userId") Long userId,
                                          org.springframework.data.domain.Pageable pageable);
}