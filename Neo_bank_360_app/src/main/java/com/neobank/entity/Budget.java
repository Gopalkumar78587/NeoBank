package com.neobank.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.neobank.enums.Category;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "budgets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    private Category category;

    private LocalDate budgetMonth;

    private BigDecimal limitAmount;

    @Column(name = "budget_name")
    private String name;

    private String icon;

    private String color;

    @Column(name = "period_type")
    @Builder.Default
    private String period = "MONTHLY";

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}