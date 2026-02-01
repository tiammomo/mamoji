package com.mamoji.common.decorator;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * Mapper for audit log entity.
 */
@Mapper
public interface AuditLogMapper {

    int insert(AuditLogEntity entity);

    List<AuditLogEntity> selectByUserId(@Param("userId") Long userId);

    List<AuditLogEntity> selectByEntityTypeAndEntityId(
            @Param("entityType") String entityType,
            @Param("entityId") Long entityId);
}
