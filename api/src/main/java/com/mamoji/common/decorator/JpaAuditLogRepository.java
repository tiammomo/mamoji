package com.mamoji.common.decorator;

import java.util.List;

import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

/**
 * Production JPA implementation of AuditLogRepository.
 */
@Repository
@Primary
@Profile("!test")
public class JpaAuditLogRepository implements AuditDecorator.AuditLogRepository {

    private final AuditLogMapper auditLogMapper;

    public JpaAuditLogRepository(AuditLogMapper auditLogMapper) {
        this.auditLogMapper = auditLogMapper;
    }

    @Override
    public void save(AuditDecorator.AuditLog auditLog) {
        auditLogMapper.insert(AuditLogEntity.fromAuditLog(auditLog));
    }

    @Override
    public List<AuditDecorator.AuditLog> findByUserId(Long userId) {
        return auditLogMapper.selectByUserId(userId).stream()
                .map(AuditLogEntity::toAuditLog)
                .toList();
    }

    @Override
    public List<AuditDecorator.AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId) {
        return auditLogMapper.selectByEntityTypeAndEntityId(entityType, entityId).stream()
                .map(AuditLogEntity::toAuditLog)
                .toList();
    }
}
