package com.neobank.repository;

import com.neobank.entity.Reward;
import com.neobank.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RewardRepository extends JpaRepository<Reward, Long> {

    // ✅ Find reward by user
    Optional<Reward> findByUser(User user);
}
