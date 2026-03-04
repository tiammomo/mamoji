package com.mamoji.controller;

import com.mamoji.common.PermissionConstants;
import com.mamoji.common.RoleConstants;
import com.mamoji.dto.AccountDTO;
import com.mamoji.entity.User;
import com.mamoji.security.AuthenticationUser;
import com.mamoji.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {
    private final AccountService accountService;

    private boolean hasAccountPermission(User user) {
        return RoleConstants.isAdmin(user.getRole()) ||
               PermissionConstants.hasPermission(user.getPermissions(), PermissionConstants.PERM_MANAGE_ACCOUNTS);
    }

    private ResponseEntity<Map<String, Object>> forbiddenResponse() {
        Map<String, Object> error = new HashMap<>();
        error.put("code", 1003);
        error.put("message", "无账户管理权限");
        error.put("data", null);
        return ResponseEntity.status(403).body(error);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAccounts(@AuthenticationUser User user) {
        List<AccountDTO> accounts = accountService.getAccounts(user.getId());
        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", accounts);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getAccount(@PathVariable Long id, @AuthenticationUser User user) {
        AccountDTO account = accountService.getAccount(id, user.getId());
        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", account);
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createAccount(@RequestBody AccountDTO dto, @AuthenticationUser User user) {
        if (!hasAccountPermission(user)) {
            return forbiddenResponse();
        }
        AccountDTO account = accountService.createAccount(dto, user.getId());
        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", account);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateAccount(@PathVariable Long id, @RequestBody AccountDTO dto, @AuthenticationUser User user) {
        if (!hasAccountPermission(user)) {
            return forbiddenResponse();
        }
        AccountDTO account = accountService.updateAccount(id, dto, user.getId());
        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", account);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteAccount(@PathVariable Long id, @AuthenticationUser User user) {
        if (!hasAccountPermission(user)) {
            return forbiddenResponse();
        }
        accountService.deleteAccount(id, user.getId());
        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", null);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(@AuthenticationUser User user) {
        Map<String, java.math.BigDecimal> summary = accountService.getAccountSummary(user.getId());
        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", summary);
        return ResponseEntity.ok(result);
    }
}
