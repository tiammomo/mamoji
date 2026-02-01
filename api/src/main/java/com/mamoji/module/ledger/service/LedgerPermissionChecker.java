package com.mamoji.module.ledger.service;

import com.mamoji.module.ledger.exception.LedgerErrorCode;
import com.mamoji.module.ledger.exception.LedgerException;
import com.mamoji.module.ledger.mapper.FinLedgerMemberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * 账本权限校验器
 */
@Component
@RequiredArgsConstructor
public class LedgerPermissionChecker {

    private final FinLedgerMemberMapper memberMapper;

    // 角色权限映射
    private static final Set<String> DELETE_PERMISSIONS = Set.of("owner");
    private static final Set<String> ADMIN_PERMISSIONS = Set.of("owner", "admin");
    private static final Set<String> EDIT_PERMISSIONS = Set.of("owner", "admin", "editor");
    private static final Set<String> INVITE_PERMISSIONS = Set.of("owner", "admin");

    /**
     * 检查用户是否有权限访问账本
     */
    public void checkAccess(Long ledgerId, Long userId) {
        if (!hasAccess(ledgerId, userId)) {
            throw new LedgerException(LedgerErrorCode.NO_ACCESS);
        }
    }

    /**
     * 检查用户是否有权限执行操作
     */
    public void checkPermission(Long ledgerId, Long userId, String permission) {
        String role = getUserRole(ledgerId, userId);

        if (role == null) {
            throw new LedgerException(LedgerErrorCode.NO_ACCESS);
        }

        boolean hasPermission = switch (permission) {
            case "ledger:delete" -> DELETE_PERMISSIONS.contains(role);
            case "ledger:admin" -> ADMIN_PERMISSIONS.contains(role);
            case "data:edit" -> EDIT_PERMISSIONS.contains(role);
            case "member:invite" -> INVITE_PERMISSIONS.contains(role);
            default -> false;
        };

        if (!hasPermission) {
            throw new LedgerException(LedgerErrorCode.NO_PERMISSION);
        }
    }

    /**
     * 检查是否是 owner
     */
    public void checkOwner(Long ledgerId, Long userId) {
        checkPermission(ledgerId, userId, "ledger:delete");
    }

    /**
     * 检查是否可以管理成员
     */
    public void canManageMembers(Long ledgerId, Long userId) {
        checkPermission(ledgerId, userId, "ledger:admin");
    }

    /**
     * 检查是否可以邀请成员
     */
    public void canInvite(Long ledgerId, Long userId) {
        checkPermission(ledgerId, userId, "member:invite");
    }

    /**
     * 检查是否可以编辑数据
     */
    public void canEditData(Long ledgerId, Long userId) {
        checkPermission(ledgerId, userId, "data:edit");
    }

    public boolean hasAccess(Long ledgerId, Long userId) {
        return memberMapper.existsByLedgerAndUser(ledgerId, userId);
    }

    public String getUserRole(Long ledgerId, Long userId) {
        return memberMapper.findRoleByLedgerAndUser(ledgerId, userId).orElse(null);
    }
}
