package com.mamoji.common;

/**
 * Permission constants for the application
 */
public class PermissionConstants {
    // Permission bit flags
    public static final int PERM_NONE = 0;
    public static final int PERM_MANAGE_USERS = 1 << 0;      // 1 - 用户管理
    public static final int PERM_MANAGE_ACCOUNTS = 1 << 1;  // 2 - 账户管理
    public static final int PERM_MANAGE_CATEGORIES = 1 << 2; // 4 - 分类管理
    public static final int PERM_MANAGE_BUDGETS = 1 << 3;   // 8 - 预算管理

    // Default permissions for regular users
    public static final int DEFAULT_USER_PERMISSIONS = PERM_NONE;

    // Default permissions for admin
    public static final int DEFAULT_ADMIN_PERMISSIONS =
        PERM_MANAGE_USERS | PERM_MANAGE_ACCOUNTS | PERM_MANAGE_CATEGORIES | PERM_MANAGE_BUDGETS;

    public static boolean hasPermission(Integer userPermissions, int requiredPermission) {
        if (userPermissions == null) return false;
        return (userPermissions & requiredPermission) == requiredPermission;
    }

    public static boolean hasAnyPermission(Integer userPermissions, int... requiredPermissions) {
        if (userPermissions == null) return false;
        for (int perm : requiredPermissions) {
            if ((userPermissions & perm) == perm) {
                return true;
            }
        }
        return false;
    }

    public static String getPermissionNames(int permissions) {
        StringBuilder sb = new StringBuilder();
        if ((permissions & PERM_MANAGE_USERS) == PERM_MANAGE_USERS) {
            sb.append("用户管理 ").append(" ");
        }
        if ((permissions & PERM_MANAGE_ACCOUNTS) == PERM_MANAGE_ACCOUNTS) {
            sb.append("账户管理 ").append(" ");
        }
        if ((permissions & PERM_MANAGE_CATEGORIES) == PERM_MANAGE_CATEGORIES) {
            sb.append("分类管理 ").append(" ");
        }
        if ((permissions & PERM_MANAGE_BUDGETS) == PERM_MANAGE_BUDGETS) {
            sb.append("预算管理").append(" ");
        }
        return sb.toString().trim();
    }
}
