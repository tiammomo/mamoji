package com.mamoji.module.auth.service;

import com.mamoji.module.auth.dto.LoginRequest;
import com.mamoji.module.auth.dto.LoginResponse;
import com.mamoji.module.auth.dto.RegisterRequest;

/** Authentication Service Interface */
public interface AuthService {

    /** User login */
    LoginResponse login(LoginRequest request);

    /** User register */
    void register(RegisterRequest request);

    /** User logout */
    void logout(String token);

    /** Get current user profile */
    Object getProfile(Long userId);

    /** Check if username exists */
    boolean existsByUsername(String username);
}
