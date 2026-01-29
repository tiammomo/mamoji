package com.mamoji.module.auth.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mamoji.module.auth.dto.LoginRequest;
import com.mamoji.module.auth.dto.LoginResponse;
import com.mamoji.module.auth.dto.RegisterRequest;
import com.mamoji.module.auth.service.AuthService;

/** Auth Controller Unit Tests Tests public endpoints without Spring context */
@ExtendWith(MockitoExtension.class)
public class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock private AuthService authService;

    @InjectMocks private AuthController authController;

    private ObjectMapper objectMapper;
    private final Long testUserId = 999L;

    @BeforeEach
    void setUp() {
        mockMvc =
                MockMvcBuilders.standaloneSetup(authController)
                        .setControllerAdvice(
                                new com.mamoji.common.exception.GlobalExceptionHandler())
                        .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Successful login")
    public void testSuccessfulLogin() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");
        request.setPassword("password123");

        LoginResponse response =
                LoginResponse.builder()
                        .userId(testUserId)
                        .username("testuser")
                        .token("jwt-token-123")
                        .tokenType("Bearer")
                        .expiresIn(86400L)
                        .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(
                        post("/api/v1/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.token").value("jwt-token-123"))
                .andExpect(jsonPath("$.data.userId").value(testUserId))
                .andExpect(jsonPath("$.data.username").value("testuser"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Invalid credentials")
    public void testInvalidLogin() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");
        request.setPassword("wrongpassword");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new RuntimeException("用户名或密码错误"));

        mockMvc.perform(
                        post("/api/v1/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(500))
                .andExpect(jsonPath("$.message").value("用户名或密码错误"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Successful registration")
    public void testSuccessfulRegister() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setPassword("password123");
        request.setEmail("newuser@example.com");

        // register() returns void, so no need to mock for successful case

        mockMvc.perform(
                        post("/api/v1/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Username already exists")
    public void testRegisterUsernameExists() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("existinguser");
        request.setPassword("password123");

        doThrow(new RuntimeException("用户名已存在"))
                .when(authService)
                .register(any(RegisterRequest.class));

        mockMvc.perform(
                        post("/api/v1/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(500))
                .andExpect(jsonPath("$.message").value("用户名已存在"));
    }
}
