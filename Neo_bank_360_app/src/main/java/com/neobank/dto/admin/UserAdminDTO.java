package com.neobank.dto.admin;

import java.time.LocalDateTime;

public record UserAdminDTO(
        Long id,
        String fullName,
        String email,
        String role,
        boolean isActive,
        LocalDateTime createdAt
) {}
