/**
 * 项目名称: Mamoji 记账系统
 * 文件名: CategoryServiceImpl.java
 * 功能描述: 分类服务实现类，提供收支分类的 CRUD、分类查询等业务逻辑
 *
 * 创建日期: 2024-01-01
 * 作者: tiammomo
 * 版本: 1.0.0
 */
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

/**
 * 分类服务实现类
 * 负责处理收支分类相关的业务逻辑，包括：
 * - 分类的增删改查（CRUD）
 * - 获取所有分类（系统预设 + 用户自定义）
 * - 按类型查询分类（收入/支出）
 * - 系统预设分类保护（不能修改/删除）
 *
 * 分类类型说明：
 * - income: 收入分类（工资、奖金、投资等）
 * - expense: 支出分类（餐饮、交通、购物等）
 *
 * 分类归属说明：
 * - userId = 0: 系统预设分类（所有用户可见，不可修改/删除）
 * - userId > 0: 用户自定义分类（仅创建者可见和操作）
 *
 * @see CategoryService 分类服务接口
 * @see FinCategory 分类实体
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl
        extends AbstractCrudService<FinCategoryMapper, FinCategory, CategoryVO>
        implements CategoryService {

    /** DTO 转换器，用于实体与 VO/DTO 之间的转换 */
    private final DtoConverter dtoConverter;

    // ==================== 抽象方法实现 ====================

    /**
     * 将分类实体转换为 VO 对象
     *
     * @param entity 分类实体
     * @return 分类响应 VO
     */
    @Override
    protected CategoryVO toVO(FinCategory entity) {
        return dtoConverter.convertCategory(entity);
    }

    /**
     * 验证分类归属权
     * 分类归属规则：
     * - 系统分类（userId=0 或 userId=null）：允许所有用户访问
     * - 用户自定义分类：只有创建者可以修改/删除
     *
     * @param userId 当前用户ID
     * @param entity 要验证的分类实体
     * @throws BusinessException 分类不属于当前用户（自定义分类）
     */
    @Override
    protected void validateOwnership(Long userId, FinCategory entity) {
        // 系统分类（userId=0 或 null）允许所有用户访问，不验证
        if (entity.getUserId() != null
                && entity.getUserId() != 0
                && !entity.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.CATEGORY_NOT_FOUND);
        }
    }

    // ==================== 查询方法 ====================

    /**
     * 获取当前用户的所有分类列表
     * 返回包含：
     * - 系统预设分类（userId=0）
     * - 当前用户自定义分类（userId=当前用户）
     *
     * 排序规则：先按类型（收入在前/支出在后），再按分类ID
     *
     * @param userId 当前用户ID
     * @return 分类列表（VO 格式）
     */
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

    /**
     * 按类型获取分类列表
     * 仅返回指定类型的分类（收入或支出）
     *
     * @param userId 当前用户ID
     * @param type   分类类型（income/expense）
     * @return 指定类型的分类列表（VO 格式）
     */
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

    // ==================== 创建方法 ====================

    /**
     * 创建自定义分类
     * 创建流程：
     * 1. 验证分类名称唯一性（同一用户下不能重复）
     * 2. 构建分类实体
     * 3. 保存到数据库
     * 4. 记录操作日志
     *
     * @param userId  当前用户ID
     * @param request 分类创建请求数据
     * @return 创建成功的分类ID
     * @throws BusinessException 分类名称已存在
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createCategory(Long userId, CategoryDTO request) {
        // 验证分类名称唯一性
        validateUniqueName(userId, request.getName(), null);

        // 构建分类实体
        FinCategory category =
                FinCategory.builder()
                        .userId(userId)
                        .name(request.getName())
                        .type(request.getType())
                        .status(1) // 状态为1表示正常
                        .build();

        // 保存分类
        this.save(category);
        log.info("分类创建成功: userId={}, name={}", userId, request.getName());
        return category.getCategoryId();
    }

    // ==================== 更新方法 ====================

    /**
     * 更新分类信息
     * 更新规则：
     * - 可更新字段：分类名称
     * - 系统预设分类不能修改
     * - 新名称在同一用户下不能重复
     *
     * @param userId    当前用户ID
     * @param categoryId 要更新的分类ID
     * @param request   新的分类信息
     * @throws BusinessException 分类不存在、无权限、是系统分类或名称重复
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateCategory(Long userId, Long categoryId, CategoryDTO request) {
        // 验证分类存在且属于当前用户
        getByIdWithValidation(userId, categoryId);
        // 验证不是系统分类
        validateSystemCategory(getById(categoryId));
        // 验证新名称唯一性
        validateUniqueName(userId, request.getName(), categoryId);

        // 更新分类名称
        this.update(
                new LambdaUpdateWrapper<FinCategory>()
                        .eq(FinCategory::getCategoryId, categoryId)
                        .set(FinCategory::getName, request.getName()));

        log.info("分类已更新: categoryId={}, name={}", categoryId, request.getName());
    }

    // ==================== 删除方法 ====================

    /**
     * 删除分类（软删除）
     * 删除规则：
     * - 系统预设分类不能删除
     * - 用户自定义分类可以软删除（状态改为 0）
     *
     * @param userId    当前用户ID
     * @param categoryId 要删除的分类ID
     * @throws BusinessException 分类不存在、无权限或系统分类
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteCategory(Long userId, Long categoryId) {
        // 验证分类存在且属于当前用户
        getByIdWithValidation(userId, categoryId);
        // 验证不是系统分类
        validateSystemCategory(getById(categoryId));

        // 软删除：更新状态为 0
        this.update(
                new LambdaUpdateWrapper<FinCategory>()
                        .eq(FinCategory::getCategoryId, categoryId)
                        .set(FinCategory::getStatus, 0));

        log.info("分类已删除: categoryId={}", categoryId);
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 验证分类名称唯一性
     * 同一用户下不能有名称相同的自定义分类
     *
     * @param userId    当前用户ID
     * @param name      分类名称
     * @param excludeId 要排除的分类ID（更新时传入自身ID）
     * @throws BusinessException 分类名称已存在
     */
    private void validateUniqueName(Long userId, String name, Long excludeId) {
        LambdaQueryWrapper<FinCategory> wrapper =
                new LambdaQueryWrapper<FinCategory>()
                        .eq(FinCategory::getUserId, userId)
                        .eq(FinCategory::getName, name)
                        .eq(FinCategory::getStatus, 1);
        if (excludeId != null) {
            // 更新时排除自身
            wrapper.ne(FinCategory::getCategoryId, excludeId);
        }
        if (this.count(wrapper) > 0) {
            throw new BusinessException(2001, "分类名称已存在");
        }
    }

    /**
     * 验证是否为系统预设分类
     * 系统预设分类（userId=0）不允许修改或删除
     *
     * @param category 要验证的分类实体
     * @throws BusinessException 是系统预设分类
     */
    private void validateSystemCategory(FinCategory category) {
        if (category.getUserId() != null && category.getUserId() == 0) {
            throw new BusinessException(2001, "系统默认分类不能修改或删除");
        }
    }
}
