package com.neobank.repository;

import com.neobank.entity.SystemAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface SystemAuditLogRepository extends JpaRepository<SystemAuditLog, Long> {

    @Query("""
        SELECT l FROM SystemAuditLog l
        WHERE (:from   IS NULL OR l.eventTimestamp >= :from)
          AND (:to     IS NULL OR l.eventTimestamp <= :to)
          AND (:status IS NULL OR l.responseStatus = :status)
        ORDER BY l.eventTimestamp DESC
        """)
    Page<SystemAuditLog> search(@Param("from")   LocalDateTime from,
                                @Param("to")     LocalDateTime to,
                                @Param("status") Integer status,
                                Pageable pageable);

    // Health indicators
    long countByResponseStatusGreaterThanEqual(int status);

    @Query("""
        SELECT COALESCE(AVG(l.executionTimeMs), 0)
        FROM SystemAuditLog l
        WHERE l.eventTimestamp >= :since
        """)
    Double avgExecutionTimeSince(@Param("since") LocalDateTime since);

    @Query(nativeQuery = true, value = """
        SELECT HOUR(event_timestamp) AS hr,
               SUM(CASE WHEN response_status >= 400 THEN 1 ELSE 0 END) AS errCount,
               COUNT(*) AS totalCount
        FROM system_audit_log
        WHERE event_timestamp >= :since
        GROUP BY HOUR(event_timestamp)
        ORDER BY hr
        """)
    java.util.List<Object[]> hourlyErrorBuckets(@Param("since") LocalDateTime since);

    @Query(nativeQuery = true, value = """
        SELECT HOUR(event_timestamp) AS hr,
               AVG(execution_time_ms) AS avgMs
        FROM system_audit_log
        WHERE event_timestamp >= :since
        GROUP BY HOUR(event_timestamp)
        ORDER BY hr
        """)
    java.util.List<Object[]> hourlyResponseTimeBuckets(@Param("since") LocalDateTime since);
}
