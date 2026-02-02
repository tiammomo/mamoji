package com.mamoji.module.auth.entity;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 用户实体类
 * 对应数据库表 sys_user，存储用户账户信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("sys_user")
public class SysUser implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    /** 用户ID，自增主键 */
    @TableId(type = IdType.AUTO)
    private Long userId;

    /** 用户名，唯一 */
    private String username;

    /** 密码，BCrypt 加密存储 */
    private String password;

    /** 手机号 */
    private String phone;

    /** 邮箱 */
    private String email;

    /** 角色：super_admin（超级管理员）、admin（管理员）、normal（普通用户） */
    private String role;

    /** 状态：0=禁用，1=正常 */
    private Integer status;

    /** 创建时间 */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** 最后更新时间 */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
