package com.mamoji.module.category.entity;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Category Entity (收支分类) */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("fin_category")
public class FinCategory implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    /** Category ID */
    @TableId(type = IdType.AUTO)
    private Long categoryId;

    /** User ID (0 = system default category) */
    private Long userId;

    /** Category name */
    private String name;

    /** Category type: income, expense */
    private String type;

    /** Status: 0=disabled, 1=normal */
    private Integer status;

    /** Creation time */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** Last update time */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
