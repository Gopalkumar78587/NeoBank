package com.neobank.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "system_audit_log",
    indexes = {
        @Index(name = "idx_audit_status",    columnList = "response_status"),
        @Index(name = "idx_audit_timestamp", columnList = "event_timestamp")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String endpoint;

    @Column(name = "http_method", nullable = false, length = 10)
    private String httpMethod;

    @Column(name = "response_status", nullable = false)
    private Integer responseStatus;

    @Column(name = "execution_time_ms", nullable = false)
    private Long executionTimeMs;

    @Column(name = "acting_user_id")
    private Long actingUserId;

    @Builder.Default
    @Column(name = "event_timestamp", nullable = false)
    private LocalDateTime eventTimestamp = LocalDateTime.now();

    @Column(name = "error_message", length = 1000)
    private String errorMessage;
}
