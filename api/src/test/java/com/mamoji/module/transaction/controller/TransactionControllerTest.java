package com.mamoji.module.transaction.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.mamoji.common.result.PageResult;
import com.mamoji.module.transaction.dto.TransactionDTO;
import com.mamoji.module.transaction.dto.TransactionVO;
import com.mamoji.module.transaction.service.TransactionService;
import com.mamoji.security.UserPrincipal;
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
import org.springframework.core.MethodParameter;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Transaction Controller Unit Tests
 * Tests endpoints without Spring context
 */
@ExtendWith(MockitoExtension.class)
public class TransactionControllerTest {

    private MockMvc mockMvc;

    @Mock
    private TransactionService transactionService;

    @InjectMocks
    private TransactionController transactionController;

    private ObjectMapper objectMapper;
    private final Long testUserId = 999L;

    @BeforeEach
    void setUp() {
        // Create custom argument resolver for UserPrincipal
        HandlerMethodArgumentResolver userPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().equals(UserPrincipal.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return new UserPrincipal(testUserId, "testuser");
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(transactionController)
                .setControllerAdvice(new com.mamoji.common.exception.GlobalExceptionHandler())
                .setCustomArgumentResolvers(userPrincipalResolver)
                .build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("GET /api/v1/transactions - List transactions")
    public void testListTransactions() throws Exception {
        TransactionVO transaction = createTransactionVO(1L, "income", new BigDecimal("1000.00"), "工资");
        PageResult<TransactionVO> pageResult = PageResult.<TransactionVO>builder()
                .current(1L)
                .size(10L)
                .total(1L)
                .records(List.of(transaction))
                .build();

        when(transactionService.listTransactions(eq(testUserId), any()))
                .thenReturn(pageResult);

        mockMvc.perform(get("/api/v1/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.records").isArray())
                .andExpect(jsonPath("$.data.records[0].transactionId").value(1))
                .andExpect(jsonPath("$.data.records[0].type").value("income"));
    }

    @Test
    @DisplayName("GET /api/v1/transactions?type=expense - Filter by type")
    public void testListTransactionsByType() throws Exception {
        TransactionVO transaction = createTransactionVO(2L, "expense", new BigDecimal("50.00"), "餐饮");
        PageResult<TransactionVO> pageResult = PageResult.<TransactionVO>builder()
                .current(1L)
                .size(10L)
                .total(1L)
                .records(List.of(transaction))
                .build();

        when(transactionService.listTransactions(eq(testUserId), any()))
                .thenReturn(pageResult);

        mockMvc.perform(get("/api/v1/transactions")
                        .param("type", "expense"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.records[0].type").value("expense"));
    }

    @Test
    @DisplayName("GET /api/v1/transactions/{id} - Get transaction by ID")
    public void testGetTransaction() throws Exception {
        TransactionVO transaction = createTransactionVO(1L, "income", new BigDecimal("1000.00"), "工资");
        when(transactionService.getTransaction(testUserId, 1L)).thenReturn(transaction);

        mockMvc.perform(get("/api/v1/transactions/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.transactionId").value(1))
                .andExpect(jsonPath("$.data.amount").value(1000.00));
    }

    @Test
    @DisplayName("POST /api/v1/transactions - Create income transaction")
    public void testCreateIncomeTransaction() throws Exception {
        TransactionDTO request = createTransactionDTO("income", new BigDecimal("5000.00"), 1L, 1L);
        when(transactionService.createTransaction(eq(testUserId), any(TransactionDTO.class))).thenReturn(1L);

        mockMvc.perform(post("/api/v1/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").value(1));
    }

    @Test
    @DisplayName("PUT /api/v1/transactions/{id} - Update transaction")
    public void testUpdateTransaction() throws Exception {
        TransactionDTO request = createTransactionDTO("income", new BigDecimal("6000.00"), 1L, 1L);

        mockMvc.perform(put("/api/v1/transactions/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("DELETE /api/v1/transactions/{id} - Delete transaction")
    public void testDeleteTransaction() throws Exception {
        mockMvc.perform(delete("/api/v1/transactions/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    private TransactionVO createTransactionVO(Long id, String type, BigDecimal amount, String note) {
        TransactionVO vo = new TransactionVO();
        vo.setTransactionId(id);
        vo.setUserId(testUserId);
        vo.setAccountId(1L);
        vo.setCategoryId(1L);
        vo.setType(type);
        vo.setAmount(amount);
        vo.setCurrency("CNY");
        vo.setOccurredAt(LocalDateTime.now());
        vo.setNote(note);
        vo.setStatus(1);
        return vo;
    }

    private TransactionDTO createTransactionDTO(String type, BigDecimal amount, Long accountId, Long categoryId) {
        TransactionDTO dto = new TransactionDTO();
        dto.setAccountId(accountId);
        dto.setCategoryId(categoryId);
        dto.setType(type);
        dto.setAmount(amount);
        dto.setCurrency("CNY");
        dto.setOccurredAt(LocalDateTime.now());
        dto.setNote("Test transaction");
        return dto;
    }
}
