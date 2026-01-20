package com.mamoji.module.category.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mamoji.common.exception.BusinessException;
import com.mamoji.common.result.ResultCode;
import com.mamoji.module.category.dto.CategoryDTO;
import com.mamoji.module.category.dto.CategoryVO;
import com.mamoji.module.category.entity.FinCategory;
import com.mamoji.module.category.mapper.FinCategoryMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Category Service Implementation
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl extends ServiceImpl<FinCategoryMapper, FinCategory>
        implements CategoryService {

    @Override
    public List<CategoryVO> listCategories(Long userId) {
        List<FinCategory> categories = this.list(
                new LambdaQueryWrapper<FinCategory>()
                        .eq(FinCategory::getStatus, 1)
                        .and(wrapper -> wrapper
                                .eq(FinCategory::getUserId, 0)  // System default
                                .or()
                                .eq(FinCategory::getUserId, userId)  // User's own
                        )
                        .orderByAsc(FinCategory::getType)
                        .orderByAsc(FinCategory::getCategoryId)
        );

        return categories.stream().map(this::toVO).toList();
    }

    @Override
    public List<CategoryVO> listCategoriesByType(Long userId, String type) {
        List<FinCategory> categories = this.list(
                new LambdaQueryWrapper<FinCategory>()
                        .eq(FinCategory::getStatus, 1)
                        .eq(FinCategory::getType, type)
                        .and(wrapper -> wrapper
                                .eq(FinCategory::getUserId, 0)
                                .or()
                                .eq(FinCategory::getUserId, userId)
                        )
                        .orderByAsc(FinCategory::getCategoryId)
        );

        return categories.stream().map(this::toVO).toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createCategory(Long userId, CategoryDTO request) {
        // Check if category name already exists for this user
        Long count = this.count(
                new LambdaQueryWrapper<FinCategory>()
                        .eq(FinCategory::getUserId, userId)
                        .eq(FinCategory::getName, request.getName())
                        .eq(FinCategory::getStatus, 1)
        );

        if (count > 0) {
            throw new BusinessException(2001, "分类名称已存在");
        }

        FinCategory category = FinCategory.builder()
                .userId(userId)
                .name(request.getName())
                .type(request.getType())
                .status(1)
                .build();

        this.save(category);

        log.info("Category created: userId={}, name={}", userId, request.getName());

        return category.getCategoryId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateCategory(Long userId, Long categoryId, CategoryDTO request) {
        FinCategory category = this.getById(categoryId);
        if (category == null) {
            throw new BusinessException(ResultCode.CATEGORY_NOT_FOUND);
        }

        // Only allow update user's own categories (not system default)
        if (category.getUserId() != null && category.getUserId() != 0
                && !category.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.CATEGORY_NOT_FOUND);
        }

        // System categories cannot be modified
        if (category.getUserId() != null && category.getUserId() == 0) {
            throw new BusinessException(2001, "系统默认分类不能修改");
        }

        // Check if name already exists
        Long count = this.count(
                new LambdaQueryWrapper<FinCategory>()
                        .eq(FinCategory::getUserId, userId)
                        .eq(FinCategory::getName, request.getName())
                        .eq(FinCategory::getStatus, 1)
                        .ne(FinCategory::getCategoryId, categoryId)
        );

        if (count > 0) {
            throw new BusinessException(2001, "分类名称已存在");
        }

        this.update(
                new LambdaUpdateWrapper<FinCategory>()
                        .eq(FinCategory::getCategoryId, categoryId)
                        .set(FinCategory::getName, request.getName())
        );

        log.info("Category updated: categoryId={}, name={}", categoryId, request.getName());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteCategory(Long userId, Long categoryId) {
        FinCategory category = this.getById(categoryId);
        if (category == null) {
            throw new BusinessException(ResultCode.CATEGORY_NOT_FOUND);
        }

        // Only allow delete user's own categories (not system default)
        if (category.getUserId() != null && category.getUserId() != 0
                && !category.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.CATEGORY_NOT_FOUND);
        }

        // System categories cannot be deleted
        if (category.getUserId() != null && category.getUserId() == 0) {
            throw new BusinessException(2001, "系统默认分类不能删除");
        }

        // Soft delete
        this.update(
                new LambdaUpdateWrapper<FinCategory>()
                        .eq(FinCategory::getCategoryId, categoryId)
                        .set(FinCategory::getStatus, 0)
        );

        log.info("Category deleted: categoryId={}", categoryId);
    }

    /**
     * Convert entity to VO
     */
    private CategoryVO toVO(FinCategory category) {
        CategoryVO vo = new CategoryVO();
        BeanUtils.copyProperties(category, vo);
        return vo;
    }
}
