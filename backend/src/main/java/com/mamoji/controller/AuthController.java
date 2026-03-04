package com.mamoji.controller;

import com.mamoji.common.PermissionConstants;
import com.mamoji.common.RoleConstants;
import com.mamoji.entity.User;
import com.mamoji.repository.UserRepository;
import com.mamoji.security.AuthenticationUser;
import com.mamoji.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        String nickname = request.get("nickname");

        log.info("Register request - email: {}", email);

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
            .role(RoleConstants.USER)
            .permissions(PermissionConstants.DEFAULT_USER_PERMISSIONS)
            .build();

        user = userRepository.save(user);
        String token = jwtService.generateToken(user.getId());

        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("user", Map.of(
            "id", user.getId(),
            "email", user.getEmail(),
            "nickname", user.getNickname(),
            "role", user.getRole() != null ? user.getRole() : RoleConstants.USER,
            "roleName", RoleConstants.getRoleName(user.getRole() != null ? user.getRole() : RoleConstants.USER),
            "permissions", user.getPermissions() != null ? user.getPermissions() : PermissionConstants.DEFAULT_USER_PERMISSIONS,
            "isAdmin", RoleConstants.isAdmin(user.getRole())
        ));

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", data);

        return ResponseEntity.ok(result);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        log.info("Login request - email: {}", email);

        User user = userRepository.findByEmail(email)
            .orElse(null);

        log.info("User found: {}", user != null);

        if (user != null) {
            log.info("Password hash in DB: {}", user.getPasswordHash());
            log.info("Password matches: {}", passwordEncoder.matches(password, user.getPasswordHash()));
        }

        if (user == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            Map<String, Object> error = new HashMap<>();
            error.put("code", 1002);
            error.put("message", "用户名或密码错误");
            error.put("data", null);
            return ResponseEntity.badRequest().body(error);
        }

        String token = jwtService.generateToken(user.getId());

        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("user", Map.of(
            "id", user.getId(),
            "email", user.getEmail(),
            "nickname", user.getNickname(),
            "role", user.getRole() != null ? user.getRole() : RoleConstants.USER,
            "roleName", RoleConstants.getRoleName(user.getRole() != null ? user.getRole() : RoleConstants.USER),
            "permissions", user.getPermissions() != null ? user.getPermissions() : PermissionConstants.DEFAULT_USER_PERMISSIONS,
            "isAdmin", RoleConstants.isAdmin(user.getRole())
        ));

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", data);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> test() {
        long count = userRepository.count();
        Map<String, Object> data = new HashMap<>();
        data.put("userCount", count);

        if (count > 0) {
            userRepository.findAll().forEach(u -> {
                log.info("User: {} - {}", u.getEmail(), u.getPasswordHash());
            });
        }

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", data);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@AuthenticationUser User user) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", user.getId());
        data.put("email", user.getEmail());
        data.put("nickname", user.getNickname());
        data.put("familyId", user.getFamilyId() != null ? user.getFamilyId() : 0);
        data.put("role", user.getRole() != null ? user.getRole() : RoleConstants.USER);
        data.put("roleName", RoleConstants.getRoleName(user.getRole() != null ? user.getRole() : RoleConstants.USER));
        data.put("permissions", user.getPermissions() != null ? user.getPermissions() : PermissionConstants.DEFAULT_USER_PERMISSIONS);
        data.put("permissionsName", PermissionConstants.getPermissionNames(user.getPermissions() != null ? user.getPermissions() : PermissionConstants.DEFAULT_USER_PERMISSIONS));
        data.put("isAdmin", RoleConstants.isAdmin(user.getRole()));
        data.put("avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "");

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", data);

        return ResponseEntity.ok(result);
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(@AuthenticationUser User user, @RequestBody Map<String, String> request) {
        String nickname = request.get("nickname");
        String avatarUrl = request.get("avatarUrl");

        if (nickname != null && !nickname.trim().isEmpty()) {
            user.setNickname(nickname.trim());
        }
        if (avatarUrl != null) {
            user.setAvatarUrl(avatarUrl);
        }

        user = userRepository.save(user);

        Map<String, Object> data = new HashMap<>();
        data.put("id", user.getId());
        data.put("email", user.getEmail());
        data.put("nickname", user.getNickname());
        data.put("avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "");

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", data);

        return ResponseEntity.ok(result);
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, Object>> changePassword(@AuthenticationUser User user, @RequestBody Map<String, String> request) {
        String oldPassword = request.get("oldPassword");
        String newPassword = request.get("newPassword");

        if (oldPassword == null || newPassword == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("code", 1005);
            error.put("message", "请提供旧密码和新密码");
            error.put("data", null);
            return ResponseEntity.badRequest().body(error);
        }

        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            Map<String, Object> error = new HashMap<>();
            error.put("code", 1006);
            error.put("message", "旧密码错误");
            error.put("data", null);
            return ResponseEntity.badRequest().body(error);
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "密码修改成功");
        result.put("data", null);

        return ResponseEntity.ok(result);
    }
}
