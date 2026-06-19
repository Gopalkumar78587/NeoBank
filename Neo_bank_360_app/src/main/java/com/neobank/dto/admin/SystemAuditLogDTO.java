package com.neobank.dto.admin;

import java.time.LocalDateTime;

public record SystemAuditLogDTO(
        Long id,
        String endpoint,
        String httpMethod,
        Integer responseStatus,
        Long executionTimeMs,
        Long actingUserId,
        LocalDateTime eventTimestamp,
        String errorMessage
) {}
