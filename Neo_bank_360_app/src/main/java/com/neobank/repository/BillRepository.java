package com.neobank.repository;

import com.neobank.entity.Bill;
import com.neobank.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface BillRepository extends JpaRepository<Bill, Long> {

    List<Bill> findByUser(User user);

    boolean existsByUserAndBillerNameAndDueDateBetween(
            User user,
            String billerName,
            LocalDate start,
            LocalDate end
    );
}