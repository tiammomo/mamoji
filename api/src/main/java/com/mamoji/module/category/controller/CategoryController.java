package com.mamoji.module.category.controller;

import com.mamoji.common.result.Result;
import com.mamoji.module.category.dto.CategoryDTO;
import com.mamoji.module.category.dto.CategoryVO;
import com.mamoji.module.category.service.CategoryService;
import com.mamoji.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Category Controller
 */
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    /**
     * Get all categories for current user
     */
    @GetMapping
    public Result<List<CategoryVO>> listCategories(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) String type) {
        List<CategoryVO> categories;
        if (type != null && !type.isEmpty()) {
            categories = categoryService.listCategoriesByType(user.userId(), type);
        } else {
            categories = categoryService.listCategories(user.userId());
        }
        return Result.success(categories);
    }

    /**
     * Create a new category
     */
    @PostMapping
    public Result<Long> createCategory(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody CategoryDTO request) {
        Long categoryId = categoryService.createCategory(user.userId(), request);
        return Result.success(categoryId);
    }

    /**
     * Update a category
     */
    @PutMapping("/{id}")
    public Result<Void> updateCategory(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @Valid @RequestBody CategoryDTO request) {
        categoryService.updateCategory(user.userId(), id, request);
        return Result.success();
    }

    /**
     * Delete a category
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteCategory(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id) {
        categoryService.deleteCategory(user.userId(), id);
        return Result.success();
    }
}
