package com.mamoji.module.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 分类请求 DTO
 * 用于创建和更新分类的请求参数
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDTO {

    /** 分类ID，更新时必传 */
    private Long categoryId;

    /** 分类名称，必填 */
    @NotBlank(message = "分类名称不能为空")
    private String name;

    /** 分类类型：income（收入）、expense（支出），必填 */
    @NotNull(message = "分类类型不能为空")
    private String type;
}
