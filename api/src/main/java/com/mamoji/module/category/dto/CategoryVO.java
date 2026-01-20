package com.mamoji.module.category.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Category Response VO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryVO {

    /**
     * Category ID
     */
    private Long categoryId;

    /**
     * User ID
     */
    private Long userId;

    /**
     * Category name
     */
    private String name;

    /**
     * Category type: income, expense
     */
    private String type;

    /**
     * Status
     */
    private Integer status;

    /**
     * Creation time
     */
    private LocalDateTime createdAt;
}
