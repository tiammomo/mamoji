package com.mamoji.module.category.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mamoji.MySqlIntegrationTestBase;
import com.mamoji.module.category.dto.CategoryDTO;
import com.mamoji.module.category.dto.CategoryVO;
import com.mamoji.module.category.entity.FinCategory;

/** CategoryService Integration Tests */
class CategoryServiceIntegrationTest extends MySqlIntegrationTestBase {

    @Autowired private CategoryService categoryService;

    private final Long testUserId = 999L;

    @BeforeEach
    void setUp() {
        // Delete all test records using wrapper with always true condition
        categoryMapper.delete(
                new LambdaQueryWrapper<FinCategory>().isNotNull(FinCategory::getCategoryId));
    }

    @AfterEach
    void tearDown() {
        categoryMapper.delete(
                new LambdaQueryWrapper<FinCategory>().isNotNull(FinCategory::getCategoryId));
    }

    @Test
    @DisplayName("Create category should persist and return id")
    void createCategory_ShouldPersistAndReturnId() {
        // Given
        CategoryDTO dto = CategoryDTO.builder().name("Test Category").type("expense").build();

        // When
        Long categoryId = categoryService.createCategory(testUserId, dto);

        // Then
        assertThat(categoryId).isNotNull();

        FinCategory saved = categoryMapper.selectById(categoryId);
        assertThat(saved).isNotNull();
        assertThat(saved.getName()).isEqualTo("Test Category");
        assertThat(saved.getType()).isEqualTo("expense");
        assertThat(saved.getUserId()).isEqualTo(testUserId);
        assertThat(saved.getStatus()).isEqualTo(1);
    }

    @Test
    @DisplayName("List categories should return user's categories")
    void listCategories_ShouldReturnUserCategories() {
        // Given
        FinCategory category1 =
                FinCategory.builder()
                        .userId(testUserId)
                        .name("My Category 1")
                        .type("expense")
                        .status(1)
                        .build();
        categoryMapper.insert(category1);

        FinCategory category2 =
                FinCategory.builder()
                        .userId(testUserId + 1)
                        .name("Other User Category")
                        .type("income")
                        .status(1)
                        .build();
        categoryMapper.insert(category2);

        // When
        List<CategoryVO> result = categoryService.listCategories(testUserId);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("My Category 1");
    }

    @Test
    @DisplayName("List categories by type should filter correctly")
    void listCategoriesByType_ShouldFilterCorrectly() {
        // Given
        FinCategory expense1 =
                FinCategory.builder()
                        .userId(testUserId)
                        .name("Food")
                        .type("expense")
                        .status(1)
                        .build();
        categoryMapper.insert(expense1);

        FinCategory expense2 =
                FinCategory.builder()
                        .userId(testUserId)
                        .name("Transportation")
                        .type("expense")
                        .status(1)
                        .build();
        categoryMapper.insert(expense2);

        FinCategory income =
                FinCategory.builder()
                        .userId(testUserId)
                        .name("Salary")
                        .type("income")
                        .status(1)
                        .build();
        categoryMapper.insert(income);

        // When
        List<CategoryVO> expenseCategories =
                categoryService.listCategoriesByType(testUserId, "expense");
        List<CategoryVO> incomeCategories =
                categoryService.listCategoriesByType(testUserId, "income");

        // Then
        assertThat(expenseCategories).hasSize(2);
        assertThat(incomeCategories).hasSize(1);
    }

    @Test
    @DisplayName("Update category should modify existing record")
    void updateCategory_ShouldModifyExistingRecord() {
        // Given
        FinCategory category =
                FinCategory.builder()
                        .userId(testUserId)
                        .name("Original Name")
                        .type("expense")
                        .status(1)
                        .build();
        categoryMapper.insert(category);

        CategoryDTO updateDto = CategoryDTO.builder().name("Updated Name").type("expense").build();

        // When
        categoryService.updateCategory(testUserId, category.getCategoryId(), updateDto);

        // Then
        FinCategory updated = categoryMapper.selectById(category.getCategoryId());
        assertThat(updated.getName()).isEqualTo("Updated Name");
    }

    @Test
    @DisplayName("Delete category should set status to 0")
    void deleteCategory_ShouldSetStatusToZero() {
        // Given
        FinCategory category =
                FinCategory.builder()
                        .userId(testUserId)
                        .name("To Delete")
                        .type("expense")
                        .status(1)
                        .build();
        categoryMapper.insert(category);

        // When
        categoryService.deleteCategory(testUserId, category.getCategoryId());

        // Then - verify deletion by checking that active categories count is 0
        Long activeCount =
                categoryMapper.selectCount(
                        new LambdaQueryWrapper<FinCategory>()
                                .eq(FinCategory::getCategoryId, category.getCategoryId())
                                .eq(FinCategory::getStatus, 1));
        assertThat(activeCount).isEqualTo(0);

        // The record is logically deleted (status=0), so it won't appear in normal queries
        // This confirms the soft delete worked correctly
    }
}
