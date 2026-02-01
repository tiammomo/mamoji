package com.mamoji.common.decorator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

/**
 * Audit decorator using Aspect-Oriented Programming. Tracks all CRUD operations for audit trail.
 */
@Slf4j
@Aspect
@Component
public class AuditDecorator {

    private final AuditLogRepository auditLogRepository;

    public AuditDecorator(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Around("@annotation(audited)")
    public Object auditOperation(ProceedingJoinPoint joinPoint, Audited audited) throws Throwable {
        long startTime = System.currentTimeMillis();
        boolean success = true;
        String errorMessage = null;

        try {
            Object result = joinPoint.proceed();
            return result;
        } catch (Exception e) {
            success = false;
            errorMessage = e.getMessage();
            throw e;
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            try {
                MethodSignature signature = (MethodSignature) joinPoint.getSignature();

                AuditLog auditLog = AuditLog.builder()
                        .action(audited.action().name())
                        .entityType(audited.entityType())
                        .entityId(extractEntityId(joinPoint))
                        .userId(extractUserId(joinPoint))
                        .method(signature.getMethod().getName())
                        .parameters(extractParameters(joinPoint))
                        .duration(duration)
                        .success(success)
                        .errorMessage(errorMessage)
                        .createdAt(LocalDateTime.now())
                        .build();

                auditLogRepository.save(auditLog);
            } catch (Exception e) {
                log.warn("Failed to save audit log: {}", e.getMessage());
            }
        }
    }

    private Long extractEntityId(ProceedingJoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        if (args.length > 0 && args[0] instanceof Long) {
            return (Long) args[0];
        }
        return null;
    }

    private Long extractUserId(ProceedingJoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        for (Object arg : args) {
            if (arg instanceof Long) {
                return (Long) arg;
            }
        }
        return null;
    }

    private String extractParameters(ProceedingJoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        List<String> params = new ArrayList<>();
        for (Object arg : args) {
            if (arg != null
                    && !arg.getClass().getSimpleName().equals("Authentication")
                    && !arg.getClass().getSimpleName().equals("HttpServletRequest")) {
                params.add(arg.toString());
            }
        }
        return params.toString();
    }

    // ==================== Audit Log Entity ====================

    @Data
    @Builder
    public static class AuditLog {
        private Long id;
        private String action;
        private String entityType;
        private Long entityId;
        private Long userId;
        private String method;
        private String parameters;
        private long duration;
        private boolean success;
        private String errorMessage;
        private LocalDateTime createdAt;
    }

    // ==================== Repository Interface ====================

    public interface AuditLogRepository {
        void save(AuditLog auditLog);
        List<AuditLog> findByUserId(Long userId);
        List<AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId);
    }
}
