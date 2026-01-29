package com.mamoji.module.category.service;

import java.util.List;

import com.mamoji.module.category.dto.CategoryDTO;
import com.mamoji.module.category.dto.CategoryVO;

/** Category Service Interface */
public interface CategoryService {

    /** Get all categories for a user (including system default) */
    List<CategoryVO> listCategories(Long userId);

    /** Get categories by type */
    List<CategoryVO> listCategoriesByType(Long userId, String type);

    /** Create a new category */
    Long createCategory(Long userId, CategoryDTO request);

    /** Update a category */
    void updateCategory(Long userId, Long categoryId, CategoryDTO request);

    /** Delete a category (soft delete) */
    void deleteCategory(Long userId, Long categoryId);
}
