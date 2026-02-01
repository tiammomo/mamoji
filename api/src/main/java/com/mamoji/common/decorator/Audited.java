package com.mamoji.common.decorator;

import java.lang.annotation.*;

import static java.lang.annotation.ElementType.METHOD;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

/**
 * Annotation to mark methods for audit logging.
 */
@Retention(RUNTIME)
@Target(METHOD)
@Documented
public @interface Audited {

    /** Action type (CREATE, READ, UPDATE, DELETE) */
    Action action();

    /** Entity type being operated on */
    String entityType();

    // ==================== Action Types ====================

    enum Action {
        CREATE("创建"),
        READ("读取"),
        UPDATE("更新"),
        DELETE("删除"),
        LOGIN("登录"),
        LOGOUT("登出");

        private final String description;

        Action(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
