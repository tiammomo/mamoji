package com.mamoji.common.decorator;

import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Audit log entity for production use.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("sys_audit_log")
public class AuditLogEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String action;

    @TableField("entity_type")
    private String entityType;

    @TableField("entity_id")
    private Long entityId;

    @TableField("user_id")
    private Long userId;

    private String method;

    private String parameters;

    private long duration;

    private boolean success;

    @TableField("error_message")
    private String errorMessage;

    @TableField("created_at")
    private LocalDateTime createdAt;

    public AuditDecorator.AuditLog toAuditLog() {
        return AuditDecorator.AuditLog.builder()
                .id(this.id)
                .action(this.action)
                .entityType(this.entityType)
                .entityId(this.entityId)
                .userId(this.userId)
                .method(this.method)
                .parameters(this.parameters)
                .duration(this.duration)
                .success(this.success)
                .errorMessage(this.errorMessage)
                .createdAt(this.createdAt)
                .build();
    }

    public static AuditLogEntity fromAuditLog(AuditDecorator.AuditLog log) {
        return AuditLogEntity.builder()
                .id(log.getId())
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .userId(log.getUserId())
                .method(log.getMethod())
                .parameters(log.getParameters())
                .duration(log.getDuration())
                .success(log.isSuccess())
                .errorMessage(log.getErrorMessage())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
