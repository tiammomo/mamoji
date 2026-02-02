package com.mamoji.module.ledger.service;

import com.mamoji.module.ledger.exception.LedgerErrorCode;
import com.mamoji.module.ledger.exception.LedgerException;
import com.mamoji.module.ledger.mapper.FinLedgerMemberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * 账本权限校验器
 * 提供账本访问权限和操作权限的校验逻辑
 */
@Component
@RequiredArgsConstructor
public class LedgerPermissionChecker {

    private final FinLedgerMemberMapper memberMapper;

    /** 删除账本权限：只有所有者可以删除 */
    private static final Set<String> DELETE_PERMISSIONS = Set.of("owner");
    /** 管理账本权限：所有者和管理员可以管理 */
    private static final Set<String> ADMIN_PERMISSIONS = Set.of("owner", "admin");
    /** 编辑数据权限：所有者、管理员、编辑者可以编辑 */
    private static final Set<String> EDIT_PERMISSIONS = Set.of("owner", "admin", "editor");
    /** 邀请成员权限：所有者和管理员可以邀请 */
    private static final Set<String> INVITE_PERMISSIONS = Set.of("owner", "admin");

    /**
     * 检查用户是否有权限访问账本
     * @param ledgerId 账本ID
     * @param userId 用户ID
     * @throws LedgerException 无访问权限时抛出异常
     */
    public void checkAccess(Long ledgerId, Long userId) {
        if (!hasAccess(ledgerId, userId)) {
            throw new LedgerException(LedgerErrorCode.NO_ACCESS);
        }
    }

    /**
     * 检查用户是否有权限执行指定操作
     * @param ledgerId 账本ID
     * @param userId 用户ID
     * @param permission 权限标识
     * @throws LedgerException 权限不足时抛出异常
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
     * 检查是否是账本所有者
     * @param ledgerId 账本ID
     * @param userId 用户ID
     * @throws LedgerException 不是所有者时抛出异常
     */
    public void checkOwner(Long ledgerId, Long userId) {
        checkPermission(ledgerId, userId, "ledger:delete");
    }

    /**
     * 检查是否可以管理成员
     * @param ledgerId 账本ID
     * @param userId 用户ID
     * @throws LedgerException 无权限时抛出异常
     */
    public void canManageMembers(Long ledgerId, Long userId) {
        checkPermission(ledgerId, userId, "ledger:admin");
    }

    /**
     * 检查是否可以邀请成员
     * @param ledgerId 账本ID
     * @param userId 用户ID
     * @throws LedgerException 无权限时抛出异常
     */
    public void canInvite(Long ledgerId, Long userId) {
        checkPermission(ledgerId, userId, "member:invite");
    }

    /**
     * 检查是否可以编辑数据
     * @param ledgerId 账本ID
     * @param userId 用户ID
     * @throws LedgerException 无权限时抛出异常
     */
    public void canEditData(Long ledgerId, Long userId) {
        checkPermission(ledgerId, userId, "data:edit");
    }

    /**
     * 检查用户是否有账本访问权限
     * @param ledgerId 账本ID
     * @param userId 用户ID
     * @return 是否有访问权限
     */
    public boolean hasAccess(Long ledgerId, Long userId) {
        return memberMapper.existsByLedgerAndUser(ledgerId, userId);
    }

    /**
     * 获取用户在账本中的角色
     * @param ledgerId 账本ID
     * @param userId 用户ID
     * @return 角色名称，不存在时返回 null
     */
    public String getUserRole(Long ledgerId, Long userId) {
        return memberMapper.findRoleByLedgerAndUser(ledgerId, userId).orElse(null);
    }
}
