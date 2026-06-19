package com.neobank.controller;

import com.neobank.dto.admin.AdminLoanAnalyticsDTO;
import com.neobank.dto.admin.AdminTxnAnalyticsDTO;
import com.neobank.dto.admin.SystemAuditLogDTO;
import com.neobank.entity.SystemAuditLog;
import com.neobank.repository.SystemAuditLogRepository;
import com.neobank.service.AdvancedAdminAnalyticsService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Sprint 5 — FR-7 Advanced Admin Analytics + System Audit Log.
 * All endpoints restricted to ADMIN role (BR-03).
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdvancedAdminAnalyticsController {

    private final AdvancedAdminAnalyticsService service;
    private final SystemAuditLogRepository      auditRepo;

    public AdvancedAdminAnalyticsController(AdvancedAdminAnalyticsService service,
                                            SystemAuditLogRepository auditRepo) {
        this.service   = service;
        this.auditRepo = auditRepo;
    }

    // ── FR-7.1 ─────────────────────────────────────────────────────────────

    @GetMapping("/analytics/transactions")
    public ResponseEntity<?> txnAnalytics(@RequestParam(defaultValue = "30d") String timeframe) {
        try {
            return ResponseEntity.ok(service.buildTransactionAnalytics(timeframe));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/analytics/loans")
    public ResponseEntity<?> loanAnalytics(@RequestParam(defaultValue = "30d") String timeframe) {
        try {
            return ResponseEntity.ok(service.buildLoanAnalytics(timeframe));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    // ── FR-7.2 — System Audit Log ──────────────────────────────────────────

    @GetMapping("/system-logs")
    public Map<String, Object> getSystemLogs(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        LocalDateTime fromDt = parseDt(from);
        LocalDateTime toDt   = parseDt(to);

        Page<SystemAuditLog> result = auditRepo.search(
                fromDt, toDt, status, PageRequest.of(page, size));

        List<SystemAuditLogDTO> content = result.getContent().stream()
                .map(l -> new SystemAuditLogDTO(
                        l.getId(), l.getEndpoint(), l.getHttpMethod(),
                        l.getResponseStatus(), l.getExecutionTimeMs(),
                        l.getActingUserId(), l.getEventTimestamp(),
                        l.getErrorMessage()))
                .collect(Collectors.toList());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("content",       content);
        body.put("totalElements", result.getTotalElements());
        body.put("totalPages",    result.getTotalPages());
        body.put("page",          page);
        body.put("size",          size);
        return body;
    }

    @GetMapping("/system-logs/health")
    public Map<String, Object> getLogsHealth() {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        long total = auditRepo.count();
        long errors4xx = auditRepo.countByResponseStatusGreaterThanEqual(400);
        Double avgMs = auditRepo.avgExecutionTimeSince(since);

        List<Map<String, Object>> errorBuckets = auditRepo.hourlyErrorBuckets(since).stream()
                .map(r -> Map.<String, Object>of(
                        "hour",     ((Number) r[0]).intValue(),
                        "errors",   ((Number) r[1]).longValue(),
                        "total",    ((Number) r[2]).longValue()))
                .collect(Collectors.toList());

        List<Map<String, Object>> rtBuckets = auditRepo.hourlyResponseTimeBuckets(since).stream()
                .map(r -> Map.<String, Object>of(
                        "hour",     ((Number) r[0]).intValue(),
                        "avgMs",    ((Number) r[1]).doubleValue()))
                .collect(Collectors.toList());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("totalLogs",     total);
        body.put("totalErrors",   errors4xx);
        body.put("avgResponseMs", avgMs == null ? 0.0 : avgMs);
        body.put("hourlyErrors",  errorBuckets);
        body.put("hourlyResponse", rtBuckets);
        return body;
    }

    // BR-06: SystemAuditLog is immutable
    @PutMapping("/system-logs/**")
    public ResponseEntity<?> blockPut()    { return method405(); }

    @DeleteMapping("/system-logs/**")
    public ResponseEntity<?> blockDelete() { return method405(); }

    private ResponseEntity<?> method405() {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(Map.of("error", "SystemAuditLog records are immutable"));
    }

    private LocalDateTime parseDt(String s) {
        if (s == null || s.isBlank()) return null;
        try { return LocalDateTime.parse(s); }
        catch (Exception e) {
            try { return java.time.LocalDate.parse(s).atStartOfDay(); }
            catch (Exception e2) { return null; }
        }
    }
}
