package com.mamoji.module.auth.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * User Entity
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("sys_user")
public class SysUser implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * User ID
     */
    @TableId(type = IdType.AUTO)
    private Long userId;

    /**
     * Username (unique)
     */
    private String username;

    /**
     * Password (BCrypt encrypted)
     */
    private String password;

    /**
     * Phone number
     */
    private String phone;

    /**
     * Email
     */
    private String email;

    /**
     * Role: super_admin, admin, normal
     */
    private String role;

    /**
     * Status: 0=disabled, 1=normal
     */
    private Integer status;

    /**
     * Creation time
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /**
     * Last update time
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
