package com.mamoji.module.category.entity;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 分类实体类
 * 对应数据库表 fin_category，存储收支分类信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("fin_category")
public class FinCategory implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    /** 分类ID，自增主键 */
    @TableId(type = IdType.AUTO)
    private Long categoryId;

    /** 创建者用户ID，0 表示系统预设分类 */
    private Long userId;

    /** 所属账本ID，0 表示系统预设分类 */
    private Long ledgerId;

    /** 分类名称 */
    private String name;

    /** 分类类型：income（收入）、expense（支出） */
    private String type;

    /** 状态：0=禁用，1=正常 */
    private Integer status;

    /** 创建时间 */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** 最后更新时间 */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
