package com.neobank.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "admin_audit_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String adminEmail;

    private String action;     // FREEZE, ACTIVATE, APPROVE_CLOSURE, REJECT_CLOSURE

    private Long accountId;

    private String remarks;

    private LocalDateTime actionTime;
}