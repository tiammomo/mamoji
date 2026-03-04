package com.mamoji.controller;

import com.mamoji.common.PermissionConstants;
import com.mamoji.common.RoleConstants;
import com.mamoji.entity.Category;
import com.mamoji.entity.User;
import com.mamoji.repository.CategoryRepository;
import com.mamoji.security.AuthenticationUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    // Helper to check if user has permission
    private boolean hasCategoryPermission(User user) {
        return RoleConstants.isAdmin(user.getRole()) ||
               PermissionConstants.hasPermission(user.getPermissions(), PermissionConstants.PERM_MANAGE_CATEGORIES);
    }

    private ResponseEntity<Map<String, Object>> forbiddenResponse() {
        Map<String, Object> error = new HashMap<>();
        error.put("code", 1003);
        error.put("message", "无分类管理权限");
        error.put("data", null);
        return ResponseEntity.status(403).body(error);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getCategories(@AuthenticationUser User user) {
        List<Category> allCategories = categoryRepository.findAll();

        List<Category> incomeCategories = allCategories.stream()
            .filter(c -> c.getType() == 1)
            .toList();

        List<Category> expenseCategories = allCategories.stream()
            .filter(c -> c.getType() == 2)
            .toList();

        Map<String, Object> data = new HashMap<>();
        data.put("income", incomeCategories.stream().map(this::toMap).toList());
        data.put("expense", expenseCategories.stream().map(this::toMap).toList());

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", data);

        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createCategory(@AuthenticationUser User user, @RequestBody Map<String, Object> request) {
        if (!hasCategoryPermission(user)) {
            return forbiddenResponse();
        }

        Category category = Category.builder()
            .name(request.get("name").toString())
            .type(Integer.parseInt(request.get("type").toString()))
            .icon(request.get("icon") != null ? request.get("icon").toString() : null)
            .color(request.get("color") != null ? request.get("color").toString() : null)
            .isSystem(0)
            .build();

        category = categoryRepository.save(category);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", toMap(category));

        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateCategory(@AuthenticationUser User user, @PathVariable Long id, @RequestBody Map<String, Object> request) {
        if (!hasCategoryPermission(user)) {
            return forbiddenResponse();
        }

        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("分类不存在"));

        if (request.get("name") != null) {
            category.setName(request.get("name").toString());
        }
        if (request.get("icon") != null) {
            category.setIcon(request.get("icon").toString());
        }
        if (request.get("color") != null) {
            category.setColor(request.get("color").toString());
        }

        category = categoryRepository.save(category);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", toMap(category));

        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteCategory(@AuthenticationUser User user, @PathVariable Long id) {
        if (!hasCategoryPermission(user)) {
            return forbiddenResponse();
        }

        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("分类不存在"));

        // Check if it's a system category
        if (category.getIsSystem() != null && category.getIsSystem() == 1) {
            Map<String, Object> error = new HashMap<>();
            error.put("code", 1005);
            error.put("message", "系统分类不能删除");
            error.put("data", null);
            return ResponseEntity.badRequest().body(error);
        }

        categoryRepository.delete(category);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", null);

        return ResponseEntity.ok(result);
    }

    private Map<String, Object> toMap(Category category) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", category.getId());
        map.put("name", category.getName());
        map.put("icon", category.getIcon());
        map.put("color", category.getColor());
        map.put("type", category.getType());
        map.put("isSystem", category.getIsSystem());
        return map;
    }
}
