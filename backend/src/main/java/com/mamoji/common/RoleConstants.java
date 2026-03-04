package com.mamoji.common;

/**
 * Role constants for the application
 */
public class RoleConstants {
    public static final int ADMIN = 1;
    public static final int USER = 2;

    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_USER = "USER";

    public static String getRoleName(int role) {
        switch (role) {
            case ADMIN:
                return ROLE_ADMIN;
            case USER:
                return ROLE_USER;
            default:
                return "UNKNOWN";
        }
    }

    public static boolean isAdmin(Integer role) {
        return role != null && role == ADMIN;
    }
}
