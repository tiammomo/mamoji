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
 * 用户偏好设置实体类
 * 对应数据库表 sys_preference，存储用户的个性化配置
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("sys_preference")
public class SysPreference implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    /** 偏好设置ID，自增主键 */
    @TableId(type = IdType.AUTO)
    private Long prefId;

    /** 所属用户ID，唯一 */
    private Long userId;

    /** 默认货币，如 CNY、USD 等 */
    private String currency;

    /** 时区，如 Asia/Shanghai */
    private String timezone;

    /** 日期格式，如 yyyy-MM-dd */
    private String dateFormat;

    /** 月份起始日期，1-28 之间的整数 */
    private Integer monthStart;

    /** 创建时间 */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** 最后更新时间 */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
