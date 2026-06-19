package com.neobank.repository;

import com.neobank.entity.Budget;
import com.neobank.entity.User;
import com.neobank.enums.Category;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByUserAndBudgetMonth(User user, LocalDate month);

    List<Budget> findByUser(User user);

    Optional<Budget> findByUserAndCategoryAndBudgetMonth(
            User user,
            Category category,
            LocalDate month
    );

    Optional<Budget> findByIdAndUser(Long id, User user);
}