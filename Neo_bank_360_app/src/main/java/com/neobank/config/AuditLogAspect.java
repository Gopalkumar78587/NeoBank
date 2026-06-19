package com.neobank.config;

import com.neobank.entity.SystemAuditLog;
import com.neobank.entity.User;
import com.neobank.repository.SystemAuditLogRepository;
import com.neobank.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Sprint 5 / FR-7.2 — System Audit Log Aspect.
 *
 * Intercepts every controller execution, measures latency,
 * captures HTTP status / error message, and persists a SystemAuditLog
 * entry asynchronously to avoid blocking the request thread.
 *
 * BR-02: Sensitive data (passwords, plain-text JWTs, PII) is NEVER
 * persisted. Only endpoint metadata + sanitised error messages.
 */
@Aspect
@Component
public class AuditLogAspect {

    private static final Logger log = LoggerFactory.getLogger(AuditLogAspect.class);

    private final SystemAuditLogRepository auditRepo;
    private final UserRepository           userRepo;

    public AuditLogAspect(SystemAuditLogRepository auditRepo, UserRepository userRepo) {
        this.auditRepo = auditRepo;
        this.userRepo  = userRepo;
    }

    @Around("execution(* com.neobank.controller..*(..))")
    public Object aroundController(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();

        String endpoint   = "UNKNOWN";
        String httpMethod = "N/A";
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest req = attrs.getRequest();
                endpoint   = req.getRequestURI();
                httpMethod = req.getMethod();
            }
        } catch (Exception ignored) { /* non-web context */ }

        Long actingUserId = currentUserId();

        try {
            Object result = pjp.proceed();
            long elapsed = System.currentTimeMillis() - start;
            persist(endpoint, httpMethod, 200, elapsed, actingUserId, null);
            return result;

        } catch (AccessDeniedException ade) {
            persist(endpoint, httpMethod, 403,
                    System.currentTimeMillis() - start, actingUserId,
                    sanitise(ade.getMessage()));
            throw ade;

        } catch (Throwable ex) {
            persist(endpoint, httpMethod, 500,
                    System.currentTimeMillis() - start, actingUserId,
                    sanitise(ex.getMessage()));
            throw ex;
        }
    }

    @Async
    public void persist(String endpoint, String method, int status,
                        long elapsedMs, Long userId, String errorMessage) {
        try {
            auditRepo.save(SystemAuditLog.builder()
                    .endpoint(truncate(endpoint, 500))
                    .httpMethod(method)
                    .responseStatus(status)
                    .executionTimeMs(elapsedMs)
                    .actingUserId(userId)
                    .errorMessage(truncate(errorMessage, 1000))
                    .build());
        } catch (Exception ex) {
            log.warn("AuditLogAspect: failed to persist audit entry: {}", ex.getMessage());
        }
    }

    private Long currentUserId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth instanceof AnonymousAuthenticationToken) return null;
            return userRepo.findByEmail(auth.getName())
                    .map(User::getId)
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    /** Strip stack-trace remnants & truncate to a safe length. */
    private String sanitise(String msg) {
        if (msg == null) return null;
        int nl = msg.indexOf('\n');
        return (nl > 0 ? msg.substring(0, nl) : msg).trim();
    }

    private String truncate(String value, int max) {
        if (value == null) return null;
        return value.length() <= max ? value : value.substring(0, max);
    }
}
