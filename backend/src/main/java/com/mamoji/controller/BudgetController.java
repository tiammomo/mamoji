package com.mamoji.controller;

import com.mamoji.common.PermissionConstants;
import com.mamoji.common.RoleConstants;
import com.mamoji.dto.BudgetDTO;
import com.mamoji.entity.User;
import com.mamoji.security.AuthenticationUser;
import com.mamoji.service.BudgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/budgets")
@RequiredArgsConstructor
public class BudgetController {
    private final BudgetService budgetService;

    // Helper to check if user has permission
    private boolean hasBudgetPermission(User user) {
        return RoleConstants.isAdmin(user.getRole()) ||
               PermissionConstants.hasPermission(user.getPermissions(), PermissionConstants.PERM_MANAGE_BUDGETS);
    }

    private ResponseEntity<Map<String, Object>> forbiddenResponse() {
        Map<String, Object> error = new HashMap<>();
        error.put("code", 1003);
        error.put("message", "无预算管理权限");
        error.put("data", null);
        return ResponseEntity.status(403).body(error);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getBudgets(
            @AuthenticationUser User user,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        List<BudgetDTO> budgets;
        if (startDate != null && !startDate.isEmpty() && endDate != null && !endDate.isEmpty()) {
            budgets = budgetService.getBudgetsByDateRange(user.getId(),
                java.time.LocalDate.parse(startDate), java.time.LocalDate.parse(endDate));
        } else {
            budgets = budgetService.getBudgets(user.getId());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", budgets);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/active")
    public ResponseEntity<Map<String, Object>> getActiveBudgets(@AuthenticationUser User user) {
        List<BudgetDTO> budgets = budgetService.getActiveBudgets(user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", budgets);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getBudget(@PathVariable Long id, @AuthenticationUser User user) {
        BudgetDTO budget = budgetService.getBudget(id, user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", budget);

        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createBudget(@RequestBody BudgetDTO dto, @AuthenticationUser User user) {
        if (!hasBudgetPermission(user)) {
            return forbiddenResponse();
        }
        BudgetDTO budget = budgetService.createBudget(dto, user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", budget);

        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateBudget(@PathVariable Long id, @RequestBody BudgetDTO dto, @AuthenticationUser User user) {
        if (!hasBudgetPermission(user)) {
            return forbiddenResponse();
        }
        BudgetDTO budget = budgetService.updateBudget(id, dto, user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", budget);

        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteBudget(@PathVariable Long id, @AuthenticationUser User user) {
        if (!hasBudgetPermission(user)) {
            return forbiddenResponse();
        }
        budgetService.deleteBudget(id, user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", null);

        return ResponseEntity.ok(result);
    }
}
