package com.mamoji.module.category.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.mamoji.common.result.Result;
import com.mamoji.module.category.dto.CategoryDTO;
import com.mamoji.module.category.dto.CategoryVO;
import com.mamoji.module.category.service.CategoryService;
import com.mamoji.security.UserPrincipal;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * 分类控制器
 * 提供收支分类管理的 REST API 接口，包括分类的增删改查
 */
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    /**
     * 获取当前用户的所有分类列表
     * @param user 当前登录用户
     * @param type 可选的分类类型过滤（income/expense）
     * @return 分类列表
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
     * 创建新分类
     * @param user 当前登录用户
     * @param request 分类创建请求
     * @return 创建成功的分类ID
     */
    @PostMapping
    public Result<Long> createCategory(
            @AuthenticationPrincipal UserPrincipal user, @Valid @RequestBody CategoryDTO request) {
        Long categoryId = categoryService.createCategory(user.userId(), request);
        return Result.success(categoryId);
    }

    /**
     * 更新分类信息
     * @param user 当前登录用户
     * @param id 分类ID
     * @param request 分类更新请求
     * @return 无内容
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
     * 删除分类
     * @param user 当前登录用户
     * @param id 分类ID
     * @return 无内容
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteCategory(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable Long id) {
        categoryService.deleteCategory(user.userId(), id);
        return Result.success();
    }
}
