# 账本功能后端实现指南

## 1. 项目结构

```
api/src/main/java/com/mamoji/module/ledger/
├── controller/
│   └── LedgerController.java          # 账本管理 API
├── entity/
│   ├── FinLedger.java                 # 账本实体
│   ├── FinLedgerMember.java           # 账本成员实体
│   └── FinInvitation.java             # 邀请实体
├── mapper/
│   ├── FinLedgerMapper.java
│   ├── FinLedgerMemberMapper.java
│   └── FinInvitationMapper.java
├── service/
│   ├── LedgerService.java             # 服务接口
│   └── LedgerServiceImpl.java         # 服务实现
├── dto/
│   ├── request/
│   │   ├── CreateLedgerRequest.java
│   │   ├── UpdateLedgerRequest.java
│   │   ├── CreateInvitationRequest.java
│   │   └── UpdateMemberRoleRequest.java
│   └── response/
│       ├── LedgerVO.java
│       ├── MemberVO.java
│       └── InvitationVO.java
├── exception/
│   ├── LedgerException.java
│   └── ErrorCode.java
└── annotation/
    └── RequiresLedgerPermission.java  # 权限注解
```

## 2. 核心代码

### 2.1 FinLedger.java（实体类）
```java
package com.mamoji.module.ledger.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("fin_ledger")
public class FinLedger {

    @TableId(type = IdType.AUTO)
    private Long ledgerId;

    private String name;

    private String description;

    private Long ownerId;

    private Integer isDefault;

    private String currency;

    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
```

### 2.2 FinLedgerMember.java（实体类）
```java
package com.mamoji.module.ledger.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("fin_ledger_member")
public class FinLedgerMember {

    @TableId(type = IdType.AUTO)
    private Long memberId;

    private Long ledgerId;

    private Long userId;

    private String role;  // owner, admin, editor, viewer

    private LocalDateTime joinedAt;

    private Long invitedBy;

    private Integer status;
}
```

### 2.3 LedgerService.java（服务接口）
```java
package com.mamoji.module.ledger.service;

import com.mamoji.module.ledger.dto.request.*;
import com.mamoji.module.ledger.dto.response.*;
import java.util.List;

public interface LedgerService {

    // 账本 CRUD
    List<LedgerVO> getLedgers(Long userId);

    LedgerVO getLedger(Long ledgerId, Long userId);

    Long createLedger(CreateLedgerRequest request, Long userId);

    void updateLedger(Long ledgerId, UpdateLedgerRequest request, Long userId);

    void deleteLedger(Long ledgerId, Long userId);

    void setDefaultLedger(Long ledgerId, Long userId);

    // 成员管理
    List<MemberVO> getMembers(Long ledgerId, Long userId);

    void updateMemberRole(Long ledgerId, Long targetUserId, String newRole, Long operatorId);

    void removeMember(Long ledgerId, Long targetUserId, Long operatorId);

    void quitLedger(Long ledgerId, Long userId);

    // 邀请管理
    InvitationVO createInvitation(Long ledgerId, CreateInvitationRequest request, Long userId);

    List<InvitationVO> getInvitations(Long ledgerId, Long userId);

    void revokeInvitation(Long ledgerId, String inviteCode, Long userId);

    Long joinByInvitation(String inviteCode, Long userId);

    // 权限校验
    boolean hasAccess(Long ledgerId, Long userId);

    String getUserRole(Long ledgerId, Long userId);
}
```

### 2.4 LedgerServiceImpl.java（服务实现）
```java
package com.mamoji.module.ledger.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mamoji.common.exception.BizException;
import com.mamoji.common.utils.IdGenerator;
import com.mamoji.module.ledger.dto.request.*;
import com.mamoji.module.ledger.dto.response.*;
import com.mamoji.module.ledger.entity.*;
import com.mamoji.module.ledger.exception.LedgerErrorCode;
import com.mamoji.module.ledger.mapper.*;
import com.mamoji.module.ledger.service.LedgerService;
import com.mamoji.module.ledger.service.LedgerPermissionChecker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LedgerServiceImpl implements LedgerService {

    private final FinLedgerMapper ledgerMapper;
    private final FinLedgerMemberMapper memberMapper;
    private final FinInvitationMapper invitationMapper;
    private final LedgerPermissionChecker permissionChecker;

    @Override
    public List<LedgerVO> getLedgers(Long userId) {
        // 获取用户所属的所有账本
        List<FinLedgerMember> memberships = memberMapper.selectList(
            new LambdaQueryWrapper<FinLedgerMember>()
                .eq(FinLedgerMember::getUserId, userId)
                .eq(FinLedgerMember::getStatus, 1)
        );

        if (memberships.isEmpty()) {
            return List.of();
        }

        List<Long> ledgerIds = memberships.stream()
            .map(FinLedgerMember::getLedgerId)
            .collect(Collectors.toList());

        List<FinLedger> ledgers = ledgerMapper.selectBatchIds(ledgerIds);

        // 获取默认账本
        Long defaultLedgerId = ledgers.stream()
            .filter(l -> Integer.valueOf(1).equals(l.getIsDefault()))
            .map(FinLedger::getLedgerId)
            .findFirst()
            .orElse(ledgerIds.get(0));

        return ledgers.stream()
            .map(ledger -> {
                FinLedgerMember membership = memberships.stream()
                    .filter(m -> m.getLedgerId().equals(ledger.getLedgerId()))
                    .findFirst()
                    .orElse(null);

                return LedgerVO.builder()
                    .ledgerId(ledger.getLedgerId())
                    .name(ledger.getName())
                    .description(ledger.getDescription())
                    .ownerId(ledger.getOwnerId())
                    .isDefault(ledger.getIsDefault())
                    .currency(ledger.getCurrency())
                    .role(membership != null ? membership.getRole() : null)
                    .memberCount(memberMapper.countActiveMembers(ledger.getLedgerId()))
                    .build();
            })
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Long createLedger(CreateLedgerRequest request, Long userId) {
        // 创建账本
        FinLedger ledger = FinLedger.builder()
            .name(request.getName())
            .description(request.getDescription())
            .ownerId(userId)
            .currency(request.getCurrency() != null ? request.getCurrency() : "CNY")
            .isDefault(0)
            .status(1)
            .build();

        ledgerMapper.insert(ledger);

        // 创建者自动成为 owner
        FinLedgerMember member = FinLedgerMember.builder()
            .ledgerId(ledger.getLedgerId())
            .userId(userId)
            .role("owner")
            .invitedBy(userId)
            .joinedAt(LocalDateTime.now())
            .status(1)
            .build();

        memberMapper.insert(member);

        return ledger.getLedgerId();
    }

    @Override
    public void deleteLedger(Long ledgerId, Long userId) {
        // 校验权限
        permissionChecker.checkPermission(ledgerId, userId, "ledger:delete");

        // 检查是否还有其他成员
        int memberCount = memberMapper.countActiveMembers(ledgerId);
        if (memberCount > 1) {
            throw new BizException(LedgerErrorCode.CANNOT_DELETE_LEDGER_WITH_MEMBERS);
        }

        // 软删除账本
        ledgerMapper.updateStatus(ledgerId, 0);
        memberMapper.updateStatusByLedgerId(ledgerId, 0);
    }

    @Override
    @Transactional
    public Long joinByInvitation(String inviteCode, Long userId) {
        // 查找邀请码
        FinInvitation invitation = invitationMapper.findByCode(inviteCode)
            .orElseThrow(() -> new BizException(LedgerErrorCode.INVITATION_NOT_FOUND));

        // 检查状态
        if (!Integer.valueOf(1).equals(invitation.getStatus())) {
            throw new BizException(LedgerErrorCode.INVITATION_DISABLED);
        }

        // 检查过期时间
        if (invitation.getExpiresAt() != null && invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BizException(LedgerErrorCode.INVITATION_EXPIRED);
        }

        // 检查使用次数
        if (invitation.getMaxUses() > 0 && invitation.getUsedCount() >= invitation.getMaxUses()) {
            throw new BizException(LedgerErrorCode.INVITATION_MAX_USES_REACHED);
        }

        // 检查是否已是成员
        boolean alreadyMember = memberMapper.existsByLedgerAndUser(invitation.getLedgerId(), userId);
        if (alreadyMember) {
            throw new BizException(LedgerErrorCode.ALREADY_MEMBER);
        }

        // 检查账本状态
        FinLedger ledger = ledgerMapper.selectById(invitation.getLedgerId());
        if (ledger == null || !Integer.valueOf(1).equals(ledger.getStatus())) {
            throw new BizException(LedgerErrorCode.LEDGER_NOT_FOUND);
        }

        // 添加成员
        FinLedgerMember member = FinLedgerMember.builder()
            .ledgerId(invitation.getLedgerId())
            .userId(userId)
            .role(invitation.getRole())
            .invitedBy(invitation.getCreatedBy())
            .joinedAt(LocalDateTime.now())
            .status(1)
            .build();

        memberMapper.insert(member);

        // 更新邀请使用次数
        invitationMapper.incrementUsedCount(invitation.getInviteId());

        return invitation.getLedgerId();
    }

    @Override
    public boolean hasAccess(Long ledgerId, Long userId) {
        return memberMapper.existsByLedgerAndUser(ledgerId, userId);
    }

    @Override
    public String getUserRole(Long ledgerId, Long userId) {
        return memberMapper.findByLedgerAndUser(ledgerId, userId)
            .map(FinLedgerMember::getRole)
            .orElse(null);
    }
}
```

### 2.5 LedgerPermissionChecker.java（权限校验）
```java
package com.mamoji.module.ledger.service;

import com.mamoji.common.exception.BizException;
import com.mamoji.module.ledger.exception.LedgerErrorCode;
import com.mamoji.module.ledger.mapper.FinLedgerMemberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class LedgerPermissionChecker {

    private final FinLedgerMemberMapper memberMapper;

    // 角色权限映射
    private static final Set<String> DELETE_PERMISSIONS = Set.of("owner");
    private static final Set<String> ADMIN_PERMISSIONS = Set.of("owner", "admin");
    private static final Set<String> EDIT_PERMISSIONS = Set.of("owner", "admin", "editor");
    private static final Set<String> INVITE_PERMISSIONS = Set.of("owner", "admin");

    public void checkPermission(Long ledgerId, Long userId, String permission) {
        String role = memberMapper.findRoleByLedgerAndUser(ledgerId, userId)
            .orElseThrow(() -> new BizException(LedgerErrorCode.NO_ACCESS));

        boolean hasPermission = switch (permission) {
            case "ledger:delete" -> DELETE_PERMISSIONS.contains(role);
            case "ledger:admin" -> ADMIN_PERMISSIONS.contains(role);
            case "data:edit" -> EDIT_PERMISSIONS.contains(role);
            case "member:invite" -> INVITE_PERMISSIONS.contains(role);
            default -> false;
        };

        if (!hasPermission) {
            throw new BizException(LedgerErrorCode.NO_PERMISSION);
        }
    }
}
```

### 2.6 LedgerController.java（控制器）
```java
package com.mamoji.module.ledger.controller;

import com.mamoji.common.result.ApiResponse;
import com.mamoji.module.ledger.dto.request.*;
import com.mamoji.module.ledger.dto.response.*;
import com.mamoji.module.ledger.service.LedgerService;
import com.mamoji.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/ledgers")
@RequiredArgsConstructor
public class LedgerController {

    private final LedgerService ledgerService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping
    public ApiResponse<List<LedgerVO>> getLedgers(
            @RequestHeader("Authorization") String token) {
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        List<LedgerVO> ledgers = ledgerService.getLedgers(userId);
        return ApiResponse.success(ledgers);
    }

    @PostMapping
    public ApiResponse<Long> createLedger(
            @RequestHeader("Authorization") String token,
            @RequestBody CreateLedgerRequest request) {
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        Long ledgerId = ledgerService.createLedger(request, userId);
        return ApiResponse.success(ledgerId);
    }

    @GetMapping("/{id}")
    public ApiResponse<LedgerVO> getLedger(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        LedgerVO ledger = ledgerService.getLedger(id, userId);
        return ApiResponse.success(ledger);
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updateLedger(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id,
            @RequestBody UpdateLedgerRequest request) {
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        ledgerService.updateLedger(id, request, userId);
        return ApiResponse.success();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteLedger(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        ledgerService.deleteLedger(id, userId);
        return ApiResponse.success();
    }

    @PutMapping("/{id}/default")
    public ApiResponse<Void> setDefault(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        ledgerService.setDefaultLedger(id, userId);
        return ApiResponse.success();
    }

    @GetMapping("/{id}/members")
    public ApiResponse<List<MemberVO>> getMembers(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        List<MemberVO> members = ledgerService.getMembers(id, userId);
        return ApiResponse.success(members);
    }

    @PutMapping("/{id}/members/{targetUserId}/role")
    public ApiResponse<Void> updateMemberRole(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id,
            @PathVariable Long targetUserId,
            @RequestBody UpdateMemberRoleRequest request) {
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        ledgerService.updateMemberRole(id, targetUserId, request.getRole(), userId);
        return ApiResponse.success();
    }

    @DeleteMapping("/{id}/members/{targetUserId}")
    public ApiResponse<Void> removeMember(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id,
            @PathVariable Long targetUserId) {
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        ledgerService.removeMember(id, targetUserId, userId);
        return ApiResponse.success();
    }

    @DeleteMapping("/{id}/members/me")
    public ApiResponse<Void> quitLedger(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        ledgerService.quitLedger(id, userId);
        return ApiResponse.success();
    }

    @PostMapping("/{id}/invitations")
    public ApiResponse<InvitationVO> createInvitation(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id,
            @RequestBody CreateInvitationRequest request) {
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        InvitationVO invitation = ledgerService.createInvitation(id, request, userId);
        return ApiResponse.success(invitation);
    }

    @GetMapping("/{id}/invitations")
    public ApiResponse<List<InvitationVO>> getInvitations(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        List<InvitationVO> invitations = ledgerService.getInvitations(id, userId);
        return ApiResponse.success(invitations);
    }

    @DeleteMapping("/{id}/invitations/{code}")
    public ApiResponse<Void> revokeInvitation(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id,
            @PathVariable String code) {
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        ledgerService.revokeInvitation(id, code, userId);
        return ApiResponse.success();
    }
}
```

### 2.7 错误码定义 LedgerErrorCode.java
```java
package com.mamoji.module.ledger.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum LedgerErrorCode {

    LEDGER_NOT_FOUND("LEDGER_001", "账本不存在"),
    NO_ACCESS("LEDGER_002", "无权访问该账本"),
    LEDGER_NAME_EXISTS("LEDGER_003", "账本名称已存在"),
    CANNOT_DELETE_LEDGER_WITH_MEMBERS("LEDGER_004", "账本还有其他成员，无法删除"),
    CANNOT_MODIFY_OWNER_ROLE("LEDGER_005", "不能修改账本所有者的角色"),
    CANNOT_REMOVE_OWNER("LEDGER_006", "不能移除账本所有者"),

    INVITATION_NOT_FOUND("INVITE_001", "邀请码不存在"),
    INVITATION_DISABLED("INVITE_002", "邀请码已禁用"),
    INVITATION_EXPIRED("INVITE_003", "邀请码已过期"),
    INVITATION_MAX_USES_REACHED("INVITE_004", "邀请码已达到使用次数上限"),
    ALREADY_MEMBER("INVITE_005", "已是账本成员"),

    NO_PERMISSION("PERM_001", "权限不足");

    private final String code;
    private final String message;
}
```

## 3. Mapper XML 示例

### 3.1 FinLedgerMemberMapper.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.mamoji.module.ledger.mapper.FinLedgerMemberMapper">

    <select id="countActiveMembers" resultType="int">
        SELECT COUNT(*)
        FROM fin_ledger_member
        WHERE ledger_id = #{ledgerId}
          AND status = 1
    </select>

    <select id="existsByLedgerAndUser" resultType="boolean">
        SELECT EXISTS(
            SELECT 1 FROM fin_ledger_member
            WHERE ledger_id = #{ledgerId}
              AND user_id = #{userId}
              AND status = 1
        )
    </select>

    <select id="findRoleByLedgerAndUser">
        SELECT role
        FROM fin_ledger_member
        WHERE ledger_id = #{ledgerId}
          AND user_id = #{userId}
          AND status = 1
    </select>

    <update id="updateStatusByLedgerId">
        UPDATE fin_ledger_member
        SET status = 0
        WHERE ledger_id = #{ledgerId}
    </update>

</mapper>
```

### 3.2 FinInvitationMapper.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.mamoji.module.ledger.mapper.FinInvitationMapper">

    <select id="findByCode" resultType="FinInvitation">
        SELECT *
        FROM fin_invitation
        WHERE invite_code = #{code}
          AND status = 1
    </select>

    <update id="incrementUsedCount">
        UPDATE fin_invitation
        SET used_count = used_count + 1
        WHERE invite_id = #{inviteId}
    </update>

</mapper>
```

## 4. 数据迁移 SQL

### 4.1 迁移脚本 migration_v2_ledger.sql
```sql
-- ===========================================
-- Mamoji v2: 账本功能数据迁移
-- ===========================================

USE mamoji;

-- 1. 创建账本表
CREATE TABLE fin_ledger (
    ledger_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    owner_id BIGINT NOT NULL,
    is_default TINYINT NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'CNY',
    status TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_owner_id (owner_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 创建账本成员表
CREATE TABLE fin_ledger_member (
    member_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ledger_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'editor',
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    invited_by BIGINT,
    status TINYINT NOT NULL DEFAULT 1,
    UNIQUE KEY uk_ledger_user (ledger_id, user_id),
    INDEX idx_ledger_id (ledger_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 创建邀请表
CREATE TABLE fin_invitation (
    invite_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ledger_id BIGINT NOT NULL,
    invite_code VARCHAR(32) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'editor',
    max_uses INT NOT NULL DEFAULT 0,
    used_count INT NOT NULL DEFAULT 0,
    expires_at DATETIME,
    created_by BIGINT NOT NULL,
    status TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ledger_id (ledger_id),
    INDEX idx_invite_code (invite_code),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 为现有表添加 ledger_id 字段
ALTER TABLE fin_category
    ADD COLUMN ledger_id BIGINT NOT NULL DEFAULT 0 COMMENT '账本ID: 0=系统默认' AFTER user_id,
    ADD INDEX idx_ledger_id (ledger_id);

ALTER TABLE fin_account
    ADD COLUMN ledger_id BIGINT NOT NULL COMMENT '账本ID' AFTER user_id,
    ADD INDEX idx_ledger_id (ledger_id);

ALTER TABLE fin_transaction
    ADD COLUMN ledger_id BIGINT NOT NULL COMMENT '账本ID' AFTER user_id,
    ADD INDEX idx_ledger_id (ledger_id);

ALTER TABLE fin_budget
    ADD COLUMN ledger_id BIGINT NOT NULL COMMENT '账本ID' AFTER user_id,
    ADD INDEX idx_ledger_id (ledger_id);

-- 5. 为每个现有用户创建默认账本
INSERT INTO fin_ledger (ledger_id, name, owner_id, is_default, currency)
SELECT
    u.user_id AS ledger_id,
    CONCAT(u.username, '的账本') AS name,
    u.user_id AS owner_id,
    1 AS is_default,
    COALESCE(p.currency, 'CNY') AS currency
FROM sys_user u
LEFT JOIN sys_preference p ON u.user_id = p.user_id
WHERE u.status = 1;

-- 6. 用户成为自己账本的 owner
INSERT INTO fin_ledger_member (ledger_id, user_id, role, invited_by)
SELECT ledger_id, owner_id, 'owner', owner_id FROM fin_ledger;

-- 7. 现有数据关联到账本
UPDATE fin_category SET ledger_id = user_id WHERE ledger_id = 0;
UPDATE fin_account SET ledger_id = user_id WHERE ledger_id IS NULL;
UPDATE fin_transaction SET ledger_id = user_id WHERE ledger_id IS NULL;
UPDATE fin_budget SET ledger_id = user_id WHERE ledger_id IS NULL;

-- 8. 更新外键约束
-- 注意: 实际的 FOREIGN KEY 约束可根据需要添加

SELECT 'Migration completed successfully!' AS result;
```
