package com.mamoji.module.category.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mamoji.MySqlIntegrationTestBase;
import com.mamoji.config.TestSecurityConfig;
import com.mamoji.module.category.entity.FinCategory;

/** Category Mapper Integration Tests Tests CRUD operations using real H2 database */
@Import(TestSecurityConfig.class)
class CategoryMapperTest extends MySqlIntegrationTestBase {

    @Autowired private FinCategoryMapper categoryMapper;

    private final Long testUserId = 999L;

    @BeforeEach
    void setUp() {
        categoryMapper.delete(
                new LambdaQueryWrapper<FinCategory>().isNotNull(FinCategory::getCategoryId));
    }

    @AfterEach
    void tearDown() {
        categoryMapper.delete(
                new LambdaQueryWrapper<FinCategory>().isNotNull(FinCategory::getCategoryId));
    }

    @Test
    @DisplayName("Insert category should persist and return generated ID")
    void insert_ShouldPersistAndReturnGeneratedId() {
        FinCategory category =
                FinCategory.builder()
                        .userId(testUserId)
                        .name("Test Category")
                        .type("expense")
                        .status(1)
                        .build();

        int result = categoryMapper.insert(category);

        assertThat(result).isGreaterThan(0);
        assertThat(category.getCategoryId()).isNotNull();
    }

    @Test
    @DisplayName("Select by ID should return category when exists")
    void selectById_ShouldReturnCategoryWhenExists() {
        FinCategory category =
                FinCategory.builder()
                        .userId(testUserId)
                        .name("Find Me Category")
                        .type("income")
                        .status(1)
                        .build();
        categoryMapper.insert(category);

        FinCategory found = categoryMapper.selectById(category.getCategoryId());

        assertThat(found).isNotNull();
        assertThat(found.getName()).isEqualTo("Find Me Category");
    }

    @Test
    @DisplayName("Select with type filter should return only matching types")
    void selectList_WithTypeFilter_ShouldReturnOnlyMatchingTypes() {
        FinCategory incomeCategory =
                FinCategory.builder()
                        .userId(testUserId)
                        .name("Salary")
                        .type("income")
                        .status(1)
                        .build();
        categoryMapper.insert(incomeCategory);

        FinCategory expenseCategory =
                FinCategory.builder()
                        .userId(testUserId)
                        .name("Food")
                        .type("expense")
                        .status(1)
                        .build();
        categoryMapper.insert(expenseCategory);

        List<FinCategory> incomeResults =
                categoryMapper.selectList(
                        new LambdaQueryWrapper<FinCategory>()
                                .eq(FinCategory::getUserId, testUserId)
                                .eq(FinCategory::getType, "income"));

        assertThat(incomeResults).hasSize(1);
        assertThat(incomeResults.get(0).getName()).isEqualTo("Salary");
    }

    @Test
    @DisplayName("Select with status filter should return only active categories")
    void selectList_WithStatusFilter_ShouldReturnOnlyActiveCategories() {
        FinCategory activeCategory =
                FinCategory.builder()
                        .userId(testUserId)
                        .name("Active Category")
                        .type("expense")
                        .status(1)
                        .build();
        categoryMapper.insert(activeCategory);

        FinCategory deletedCategory =
                FinCategory.builder()
                        .userId(testUserId)
                        .name("Deleted Category")
                        .type("expense")
                        .status(0)
                        .build();
        categoryMapper.insert(deletedCategory);

        List<FinCategory> activeResults =
                categoryMapper.selectList(
                        new LambdaQueryWrapper<FinCategory>()
                                .eq(FinCategory::getUserId, testUserId)
                                .eq(FinCategory::getStatus, 1));

        assertThat(activeResults).hasSize(1);
        assertThat(activeResults.get(0).getName()).isEqualTo("Active Category");
    }

    @Test
    @DisplayName("Update by ID should modify existing category")
    void updateById_ShouldModifyExistingCategory() {
        FinCategory category =
                FinCategory.builder()
                        .userId(testUserId)
                        .name("Original Name")
                        .type("expense")
                        .status(1)
                        .build();
        categoryMapper.insert(category);

        category.setName("Updated Name");
        int result = categoryMapper.updateById(category);

        assertThat(result).isGreaterThan(0);

        FinCategory updated = categoryMapper.selectById(category.getCategoryId());
        assertThat(updated.getName()).isEqualTo("Updated Name");
    }

    @Test
    @DisplayName("Delete by ID should remove category")
    void deleteById_ShouldRemoveCategory() {
        FinCategory category =
                FinCategory.builder()
                        .userId(testUserId)
                        .name("To Delete")
                        .type("expense")
                        .status(1)
                        .build();
        categoryMapper.insert(category);

        int result = categoryMapper.deleteById(category.getCategoryId());

        assertThat(result).isGreaterThan(0);

        FinCategory deleted = categoryMapper.selectById(category.getCategoryId());
        assertThat(deleted).isNull();
    }

    @Test
    @DisplayName("Select with name filter should return matching category")
    void selectList_WithNameFilter_ShouldReturnMatchingCategory() {
        for (int i = 1; i <= 3; i++) {
            FinCategory category =
                    FinCategory.builder()
                            .userId(testUserId)
                            .name("Category " + i)
                            .type("expense")
                            .status(1)
                            .build();
            categoryMapper.insert(category);
        }

        List<FinCategory> results =
                categoryMapper.selectList(
                        new LambdaQueryWrapper<FinCategory>()
                                .eq(FinCategory::getUserId, testUserId)
                                .like(FinCategory::getName, "Category 1"));

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getName()).isEqualTo("Category 1");
    }

    @Test
    @DisplayName("Select count should return correct count")
    void selectCount_ShouldReturnCorrectCount() {
        for (int i = 1; i <= 5; i++) {
            FinCategory category =
                    FinCategory.builder()
                            .userId(testUserId)
                            .name("Category " + i)
                            .type("expense")
                            .status(1)
                            .build();
            categoryMapper.insert(category);
        }

        Long count =
                categoryMapper.selectCount(
                        new LambdaQueryWrapper<FinCategory>()
                                .eq(FinCategory::getUserId, testUserId)
                                .eq(FinCategory::getStatus, 1));

        assertThat(count).isEqualTo(5L);
    }
}
