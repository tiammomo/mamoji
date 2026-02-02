package com.mamoji.module.category.service;

import java.util.List;

import com.mamoji.module.category.dto.CategoryDTO;
import com.mamoji.module.category.dto.CategoryVO;

/**
 * 分类服务接口
 * 定义收支分类管理相关的业务操作
 */
public interface CategoryService {

    /**
     * 获取用户的所有分类（包含系统预设）
     * @param userId 用户ID
     * @return 分类列表
     */
    List<CategoryVO> listCategories(Long userId);

    /**
     * 按类型获取分类列表
     * @param userId 用户ID
     * @param type 分类类型（income/expense）
     * @return 指定类型的分类列表
     */
    List<CategoryVO> listCategoriesByType(Long userId, String type);

    /**
     * 创建新分类
     * @param userId 用户ID
     * @param request 分类创建请求
     * @return 创建成功的分类ID
     */
    Long createCategory(Long userId, CategoryDTO request);

    /**
     * 更新分类信息
     * @param userId 用户ID
     * @param categoryId 分类ID
     * @param request 更新请求
     */
    void updateCategory(Long userId, Long categoryId, CategoryDTO request);

    /**
     * 删除分类（软删除）
     * @param userId 用户ID
     * @param categoryId 分类ID
     */
    void deleteCategory(Long userId, Long categoryId);
}
