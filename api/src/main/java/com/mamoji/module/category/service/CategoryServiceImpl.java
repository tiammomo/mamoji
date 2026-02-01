package com.mamoji.module.category.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.mamoji.common.exception.BusinessException;
import com.mamoji.common.factory.DtoConverter;
import com.mamoji.common.result.ResultCode;
import com.mamoji.common.service.AbstractCrudService;
import com.mamoji.module.category.dto.CategoryDTO;
import com.mamoji.module.category.dto.CategoryVO;
import com.mamoji.module.category.entity.FinCategory;
import com.mamoji.module.category.mapper.FinCategoryMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/** Category Service Implementation */
@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl
        extends AbstractCrudService<FinCategoryMapper, FinCategory, CategoryVO>
        implements CategoryService {

    private final DtoConverter dtoConverter;

    @Override
    protected CategoryVO toVO(FinCategory entity) {
        return dtoConverter.convertCategory(entity);
    }

    @Override
    protected void validateOwnership(Long userId, FinCategory entity) {
        if (entity.getUserId() != null
                && entity.getUserId() != 0
                && !entity.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.CATEGORY_NOT_FOUND);
        }
    }

    @Override
    public List<CategoryVO> listCategories(Long userId) {
        List<FinCategory> categories =
                this.list(
                        new LambdaQueryWrapper<FinCategory>()
                                .eq(FinCategory::getStatus, 1)
                                .and(
                                        wrapper ->
                                                wrapper.eq(FinCategory::getUserId, 0)
                                                        .or()
                                                        .eq(FinCategory::getUserId, userId))
                                .orderByAsc(FinCategory::getType)
                                .orderByAsc(FinCategory::getCategoryId));
        return dtoConverter.convertCategoryList(categories);
    }

    @Override
    public List<CategoryVO> listCategoriesByType(Long userId, String type) {
        List<FinCategory> categories =
                this.list(
                        new LambdaQueryWrapper<FinCategory>()
                                .eq(FinCategory::getStatus, 1)
                                .eq(FinCategory::getType, type)
                                .and(
                                        wrapper ->
                                                wrapper.eq(FinCategory::getUserId, 0)
                                                        .or()
                                                        .eq(FinCategory::getUserId, userId))
                                .orderByAsc(FinCategory::getCategoryId));
        return dtoConverter.convertCategoryList(categories);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createCategory(Long userId, CategoryDTO request) {
        validateUniqueName(userId, request.getName(), null);
        FinCategory category =
                FinCategory.builder()
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
        getByIdWithValidation(userId, categoryId);
        validateSystemCategory(getById(categoryId));
        validateUniqueName(userId, request.getName(), categoryId);

        this.update(
                new LambdaUpdateWrapper<FinCategory>()
                        .eq(FinCategory::getCategoryId, categoryId)
                        .set(FinCategory::getName, request.getName()));
        log.info("Category updated: categoryId={}, name={}", categoryId, request.getName());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteCategory(Long userId, Long categoryId) {
        getByIdWithValidation(userId, categoryId);
        validateSystemCategory(getById(categoryId));

        this.update(
                new LambdaUpdateWrapper<FinCategory>()
                        .eq(FinCategory::getCategoryId, categoryId)
                        .set(FinCategory::getStatus, 0));
        log.info("Category deleted: categoryId={}", categoryId);
    }

    // ==================== Private Helper Methods ====================

    private void validateUniqueName(Long userId, String name, Long excludeId) {
        LambdaQueryWrapper<FinCategory> wrapper =
                new LambdaQueryWrapper<FinCategory>()
                        .eq(FinCategory::getUserId, userId)
                        .eq(FinCategory::getName, name)
                        .eq(FinCategory::getStatus, 1);
        if (excludeId != null) {
            wrapper.ne(FinCategory::getCategoryId, excludeId);
        }
        if (this.count(wrapper) > 0) {
            throw new BusinessException(2001, "分类名称已存在");
        }
    }

    private void validateSystemCategory(FinCategory category) {
        if (category.getUserId() != null && category.getUserId() == 0) {
            throw new BusinessException(2001, "系统默认分类不能修改或删除");
        }
    }
}
