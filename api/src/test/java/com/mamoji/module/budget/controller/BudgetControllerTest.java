package com.mamoji.module.budget.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.mamoji.module.budget.dto.BudgetDTO;
import com.mamoji.module.budget.dto.BudgetVO;
import com.mamoji.module.budget.service.BudgetService;
import com.mamoji.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Budget Controller Integration Tests
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class BudgetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BudgetService budgetService;

    private ObjectMapper objectMapper;
    private final Long testUserId = 999L;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        // Set up security context with mock user
        UserPrincipal userPrincipal = new UserPrincipal(testUserId, "testuser");
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        userPrincipal,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    @DisplayName("GET /api/v1/budgets - List all budgets")
    public void testListBudgets() throws Exception {
        BudgetVO budget = createBudgetVO(1L, "Test Budget", new BigDecimal("1000.00"), new BigDecimal("200.00"));
        when(budgetService.listBudgets(testUserId)).thenReturn(List.of(budget));

        mockMvc.perform(get("/api/v1/budgets")
                        .principal(SecurityContextHolder.getContext().getAuthentication()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].budgetId").value(1))
                .andExpect(jsonPath("$.data[0].name").value("Test Budget"));
    }

    @Test
    @DisplayName("GET /api/v1/budgets?activeOnly=true - List active budgets only")
    public void testListActiveBudgets() throws Exception {
        BudgetVO budget = createBudgetVO(1L, "Active Budget", new BigDecimal("1000.00"), new BigDecimal("100.00"));
        when(budgetService.listActiveBudgets(testUserId)).thenReturn(List.of(budget));

        mockMvc.perform(get("/api/v1/budgets")
                        .param("activeOnly", "true")
                        .principal(SecurityContextHolder.getContext().getAuthentication()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].status").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/budgets/{id} - Get budget by ID")
    public void testGetBudget() throws Exception {
        BudgetVO budget = createBudgetVO(1L, "Test Budget", new BigDecimal("1000.00"), new BigDecimal("200.00"));
        when(budgetService.getBudget(testUserId, 1L)).thenReturn(budget);

        mockMvc.perform(get("/api/v1/budgets/1")
                        .principal(SecurityContextHolder.getContext().getAuthentication()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.budgetId").value(1))
                .andExpect(jsonPath("$.data.name").value("Test Budget"));
    }

    @Test
    @DisplayName("POST /api/v1/budgets - Create budget")
    public void testCreateBudget() throws Exception {
        BudgetDTO request = createBudgetDTO("New Budget", new BigDecimal("1000.00"));
        when(budgetService.createBudget(eq(testUserId), any(BudgetDTO.class))).thenReturn(1L);

        mockMvc.perform(post("/api/v1/budgets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .principal(SecurityContextHolder.getContext().getAuthentication()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").value(1));
    }

    @Test
    @DisplayName("PUT /api/v1/budgets/{id} - Update budget")
    public void testUpdateBudget() throws Exception {
        BudgetDTO request = createBudgetDTO("Updated Budget", new BigDecimal("1500.00"));

        mockMvc.perform(put("/api/v1/budgets/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .principal(SecurityContextHolder.getContext().getAuthentication()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("DELETE /api/v1/budgets/{id} - Delete budget")
    public void testDeleteBudget() throws Exception {
        mockMvc.perform(delete("/api/v1/budgets/1")
                        .principal(SecurityContextHolder.getContext().getAuthentication()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    private BudgetVO createBudgetVO(Long id, String name, BigDecimal amount, BigDecimal spent) {
        BudgetVO vo = new BudgetVO();
        vo.setBudgetId(id);
        vo.setName(name);
        vo.setAmount(amount);
        vo.setSpent(spent);
        vo.setRemaining(amount.subtract(spent));
        vo.setStatus(1);
        vo.setProgress(spent.multiply(BigDecimal.valueOf(100)).divide(amount, 2, RoundingMode.HALF_UP).doubleValue());
        vo.setStartDate(LocalDate.now().withDayOfMonth(1));
        vo.setEndDate(LocalDate.now().withDayOfMonth(1).plusMonths(1));
        return vo;
    }

    private BudgetDTO createBudgetDTO(String name, BigDecimal amount) {
        BudgetDTO dto = new BudgetDTO();
        dto.setName(name);
        dto.setAmount(amount);
        dto.setStartDate(LocalDate.now().withDayOfMonth(1));
        dto.setEndDate(LocalDate.now().withDayOfMonth(1).plusMonths(1));
        return dto;
    }
}
