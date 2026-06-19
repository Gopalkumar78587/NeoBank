package com.neobank.repository;

import com.neobank.entity.AdminAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminAuditLogRepository
        extends JpaRepository<AdminAuditLog, Long> {
}