package com.mamoji.module.category.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * 分类响应 VO
 * 用于展示分类的详细信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryVO {

    /** 分类ID */
    private Long categoryId;

    /** 用户ID */
    private Long userId;

    /** 分类名称 */
    private String name;

    /** 分类类型：income（收入）、expense（支出） */
    private String type;

    /** 状态：0=禁用，1=正常 */
    private Integer status;

    /** 创建时间 */
    private LocalDateTime createdAt;
}
