package com.neobank.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /** Handles @Valid bean-validation failures — returns first field error message */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse("Validation failed");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }

    /** Handles Jackson deserialization failures (bad JSON, wrong date format, unknown enum, etc.) */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleBadBody(HttpMessageNotReadableException ex) {
        String raw = ex.getMessage() != null ? ex.getMessage() : "";
        String detail;
        if (raw.contains("LocalDate") || raw.contains("date") || raw.contains("Date")) {
            detail = "Invalid date format. Please use yyyy-MM-dd (e.g. 2026-07-15)";
        } else if (raw.contains("Enum") || raw.contains("enum")) {
            detail = "Invalid value for enum field";
        } else {
            detail = "Invalid request body";
        }
        return ResponseEntity.badRequest().body(Map.of("message", detail));
    }

    /** Handles wrong credentials at login */
    @ExceptionHandler({BadCredentialsException.class, UsernameNotFoundException.class})
    public ResponseEntity<Map<String, String>> handleAuthError(Exception ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid email or password"));
    }

    /** Handles business-logic errors thrown as RuntimeException (e.g. duplicate email) */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException ex) {
        return ResponseEntity.badRequest().body(Map.of("message",
                ex.getMessage() != null ? ex.getMessage() : "Request failed"));
    }

    /** 403 — cross-user access denied (e.g. loan account ownership) */
    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, String>> handleSecurity(SecurityException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message",
                        ex.getMessage() != null ? ex.getMessage() : "Access denied"));
    }

    /** 409 — state conflict (e.g. already-decided loan application) */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleConflict(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message",
                        ex.getMessage() != null ? ex.getMessage() : "Conflict"));
    }

    /** Catch-all fallback */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneral(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "An unexpected error occurred"));
    }
}
