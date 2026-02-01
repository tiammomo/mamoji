package com.mamoji.common.decorator;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

/**
 * In-memory implementation of AuditLogRepository for testing.
 * In production, replace with JPA repository implementation.
 */
@Repository
@Primary
@Profile("test")
public class InMemoryAuditLogRepository implements AuditDecorator.AuditLogRepository {

    private final ConcurrentHashMap<Long, List<AuditDecorator.AuditLog>> logs = new ConcurrentHashMap<>();

    @Override
    public void save(AuditDecorator.AuditLog auditLog) {
        logs.computeIfAbsent(auditLog.getUserId(), k -> new ArrayList<>()).add(auditLog);
    }

    @Override
    public List<AuditDecorator.AuditLog> findByUserId(Long userId) {
        return logs.getOrDefault(userId, new ArrayList<>());
    }

    @Override
    public List<AuditDecorator.AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId) {
        List<AuditDecorator.AuditLog> result = new ArrayList<>();
        for (List<AuditDecorator.AuditLog> userLogs : logs.values()) {
            for (AuditDecorator.AuditLog log : userLogs) {
                if (entityType.equals(log.getEntityType()) && entityId.equals(log.getEntityId())) {
                    result.add(log);
                }
            }
        }
        return result;
    }
}
