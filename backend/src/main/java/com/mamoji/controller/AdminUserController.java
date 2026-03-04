package com.mamoji.controller;

import com.mamoji.common.PermissionConstants;
import com.mamoji.common.RoleConstants;
import com.mamoji.entity.User;
import com.mamoji.repository.UserRepository;
import com.mamoji.security.AuthenticationUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Helper method to check if user has permission
    private boolean hasPermission(User user, int permission) {
        // Admin role always has all permissions
        if (RoleConstants.isAdmin(user.getRole())) {
            return true;
        }
        return PermissionConstants.hasPermission(user.getPermissions(), permission);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getUsers(@AuthenticationUser User currentUser) {
        // Only admin can list users
        if (!RoleConstants.isAdmin(currentUser.getRole())) {
            Map<String, Object> error = new HashMap<>();
            error.put("code", 1003);
            error.put("message", "无权限访问");
            error.put("data", null);
            return ResponseEntity.status(403).body(error);
        }

        List<User> users = userRepository.findAll();
        List<Map<String, Object>> userList = users.stream()
            .map(u -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", u.getId());
                map.put("email", u.getEmail());
                map.put("nickname", u.getNickname());
                map.put("role", u.getRole() != null ? u.getRole() : RoleConstants.USER);
                map.put("roleName", RoleConstants.getRoleName(u.getRole() != null ? u.getRole() : RoleConstants.USER));
                map.put("permissions", u.getPermissions() != null ? u.getPermissions() : PermissionConstants.DEFAULT_USER_PERMISSIONS);
                map.put("permissionsName", PermissionConstants.getPermissionNames(u.getPermissions() != null ? u.getPermissions() : PermissionConstants.DEFAULT_USER_PERMISSIONS));
                map.put("familyId", u.getFamilyId() != null ? u.getFamilyId() : 0);
                return map;
            })
            .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", userList);

        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createUser(@AuthenticationUser User currentUser, @RequestBody Map<String, String> request) {
        // Only admin can create users
        if (!RoleConstants.isAdmin(currentUser.getRole())) {
            Map<String, Object> error = new HashMap<>();
            error.put("code", 1003);
            error.put("message", "无权限访问");
            error.put("data", null);
            return ResponseEntity.status(403).body(error);
        }

        String email = request.get("email");
        String password = request.get("password");
        String nickname = request.get("nickname");
        Integer role = request.get("role") != null ? Integer.parseInt(request.get("role")) : RoleConstants.USER;
        Integer permissions = request.get("permissions") != null ? Integer.parseInt(request.get("permissions")) : PermissionConstants.DEFAULT_USER_PERMISSIONS;

        if (userRepository.existsByEmail(email)) {
            Map<String, Object> error = new HashMap<>();
            error.put("code", 2002);
            error.put("message", "邮箱已被注册");
            error.put("data", null);
            return ResponseEntity.badRequest().body(error);
        }

        User user = User.builder()
            .email(email)
            .passwordHash(passwordEncoder.encode(password))
            .nickname(nickname)
            .role(role)
            .permissions(permissions)
            .familyId(currentUser.getFamilyId())
            .build();

        user = userRepository.save(user);

        Map<String, Object> data = new HashMap<>();
        data.put("id", user.getId());
        data.put("email", user.getEmail());
        data.put("nickname", user.getNickname());
        data.put("role", user.getRole());
        data.put("roleName", RoleConstants.getRoleName(user.getRole()));
        data.put("permissions", user.getPermissions());
        data.put("permissionsName", PermissionConstants.getPermissionNames(user.getPermissions()));

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", data);

        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(@AuthenticationUser User currentUser, @PathVariable Long id, @RequestBody Map<String, Object> request) {
        // Only admin can update users
        if (!RoleConstants.isAdmin(currentUser.getRole())) {
            Map<String, Object> error = new HashMap<>();
            error.put("code", 1003);
            error.put("message", "无权限访问");
            error.put("data", null);
            return ResponseEntity.status(403).body(error);
        }

        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("用户不存在"));

        if (request.get("nickname") != null) {
            user.setNickname(request.get("nickname").toString());
        }
        if (request.get("role") != null) {
            user.setRole(Integer.parseInt(request.get("role").toString()));
        }
        if (request.get("permissions") != null) {
            user.setPermissions(Integer.parseInt(request.get("permissions").toString()));
        }
        if (request.get("password") != null && !request.get("password").toString().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(request.get("password").toString()));
        }

        user = userRepository.save(user);

        Map<String, Object> data = new HashMap<>();
        data.put("id", user.getId());
        data.put("email", user.getEmail());
        data.put("nickname", user.getNickname());
        data.put("role", user.getRole());
        data.put("roleName", RoleConstants.getRoleName(user.getRole()));
        data.put("permissions", user.getPermissions());
        data.put("permissionsName", PermissionConstants.getPermissionNames(user.getPermissions()));

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", data);

        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@AuthenticationUser User currentUser, @PathVariable Long id) {
        // Only admin can delete users
        if (!RoleConstants.isAdmin(currentUser.getRole())) {
            Map<String, Object> error = new HashMap<>();
            error.put("code", 1003);
            error.put("message", "无权限访问");
            error.put("data", null);
            return ResponseEntity.status(403).body(error);
        }

        // Cannot delete yourself
        if (currentUser.getId().equals(id)) {
            Map<String, Object> error = new HashMap<>();
            error.put("code", 1004);
            error.put("message", "不能删除自己的账户");
            error.put("data", null);
            return ResponseEntity.badRequest().body(error);
        }

        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("用户不存在"));

        userRepository.delete(user);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", null);

        return ResponseEntity.ok(result);
    }
}
