package com.mamoji.module.transaction.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.mamoji.common.result.PageResult;
import com.mamoji.module.transaction.dto.RefundDTO;
import com.mamoji.module.transaction.dto.RefundSummaryVO;
import com.mamoji.module.transaction.dto.RefundVO;
import com.mamoji.module.transaction.dto.TransactionDTO;
import com.mamoji.module.transaction.dto.TransactionRefundResponseVO;
import com.mamoji.module.transaction.dto.TransactionVO;
import com.mamoji.module.transaction.service.RefundService;
import com.mamoji.module.transaction.service.TransactionService;
import com.mamoji.security.UserPrincipal;

/** Transaction Controller Unit Tests Tests endpoints without Spring context */
@ExtendWith(MockitoExtension.class)
public class TransactionControllerTest {

    private MockMvc mockMvc;

    @Mock private TransactionService transactionService;

    @Mock private RefundService refundService;

    @InjectMocks private TransactionController transactionController;

    private ObjectMapper objectMapper;
    private final Long testUserId = 999L;

    @BeforeEach
    void setUp() {
        // Create custom argument resolver for UserPrincipal
        HandlerMethodArgumentResolver userPrincipalResolver =
                new HandlerMethodArgumentResolver() {
                    @Override
                    public boolean supportsParameter(MethodParameter parameter) {
                        return parameter.getParameterType().equals(UserPrincipal.class);
                    }

                    @Override
                    public Object resolveArgument(
                            MethodParameter parameter,
                            ModelAndViewContainer mavContainer,
                            NativeWebRequest webRequest,
                            WebDataBinderFactory binderFactory) {
                        return new UserPrincipal(testUserId, "testuser");
                    }
                };

        mockMvc =
                MockMvcBuilders.standaloneSetup(transactionController)
                        .setControllerAdvice(
                                new com.mamoji.common.exception.GlobalExceptionHandler())
                        .setCustomArgumentResolvers(userPrincipalResolver)
                        .build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("GET /api/v1/transactions - List transactions")
    public void testListTransactions() throws Exception {
        TransactionVO transaction =
                createTransactionVO(1L, "income", new BigDecimal("1000.00"), "工资");
        PageResult<TransactionVO> pageResult =
                PageResult.<TransactionVO>builder()
                        .current(1L)
                        .size(10L)
                        .total(1L)
                        .records(List.of(transaction))
                        .build();

        when(transactionService.listTransactions(eq(testUserId), any())).thenReturn(pageResult);

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
        TransactionVO transaction =
                createTransactionVO(2L, "expense", new BigDecimal("50.00"), "餐饮");
        PageResult<TransactionVO> pageResult =
                PageResult.<TransactionVO>builder()
                        .current(1L)
                        .size(10L)
                        .total(1L)
                        .records(List.of(transaction))
                        .build();

        when(transactionService.listTransactions(eq(testUserId), any())).thenReturn(pageResult);

        mockMvc.perform(get("/api/v1/transactions").param("type", "expense"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.records[0].type").value("expense"));
    }

    @Test
    @DisplayName("GET /api/v1/transactions/{id} - Get transaction by ID")
    public void testGetTransaction() throws Exception {
        TransactionVO transaction =
                createTransactionVO(1L, "income", new BigDecimal("1000.00"), "工资");
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
        when(transactionService.createTransaction(eq(testUserId), any(TransactionDTO.class)))
                .thenReturn(1L);

        mockMvc.perform(
                        post("/api/v1/transactions")
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

        mockMvc.perform(
                        put("/api/v1/transactions/1")
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

    @Test
    @DisplayName("GET /api/v1/transactions/recent - Get recent transactions")
    public void testGetRecentTransactions() throws Exception {
        TransactionVO transaction =
                createTransactionVO(1L, "expense", new BigDecimal("50.00"), "餐饮");
        when(transactionService.getRecentTransactions(eq(testUserId), any(), any()))
                .thenReturn(List.of(transaction));

        mockMvc.perform(get("/api/v1/transactions/recent").param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].transactionId").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/transactions/{id}/refunds - Get transaction refunds")
    public void testGetTransactionRefunds() throws Exception {
        TransactionRefundResponseVO response =
                TransactionRefundResponseVO.builder()
                        .transaction(
                                TransactionRefundResponseVO.TransactionBasicVO.builder()
                                        .transactionId(1L)
                                        .amount(new BigDecimal("1000.00"))
                                        .type("expense")
                                        .build())
                        .refunds(
                                List.of(
                                        RefundVO.builder()
                                                .refundId(1L)
                                                .amount(new BigDecimal("200.00"))
                                                .status(1)
                                                .build()))
                        .summary(
                                RefundSummaryVO.builder()
                                        .totalRefunded(new BigDecimal("200.00"))
                                        .remainingRefundable(new BigDecimal("800.00"))
                                        .hasRefund(true)
                                        .refundCount(1)
                                        .build())
                        .build();
        when(refundService.getTransactionRefunds(eq(testUserId), eq(1L))).thenReturn(response);

        mockMvc.perform(get("/api/v1/transactions/1/refunds"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.summary.totalRefunded").value(200))
                .andExpect(jsonPath("$.data.summary.hasRefund").value(true));
    }

    @Test
    @DisplayName("POST /api/v1/transactions/{id}/refunds - Create refund")
    public void testCreateRefund() throws Exception {
        RefundDTO request =
                RefundDTO.builder()
                        .transactionId(1L)
                        .amount(new BigDecimal("100.00"))
                        .occurredAt(LocalDateTime.now())
                        .note("Partial refund")
                        .build();

        RefundVO refundVO =
                RefundVO.builder()
                        .refundId(1L)
                        .transactionId(1L)
                        .amount(new BigDecimal("100.00"))
                        .status(1)
                        .build();

        when(refundService.createRefund(eq(testUserId), any(RefundDTO.class))).thenReturn(refundVO);

        mockMvc.perform(
                        post("/api/v1/transactions/1/refunds")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.refundId").value(1))
                .andExpect(jsonPath("$.data.amount").value(100));
    }

    @Test
    @DisplayName("DELETE /api/v1/transactions/{transactionId}/refunds/{refundId} - Cancel refund")
    public void testCancelRefund() throws Exception {
        RefundSummaryVO summary =
                RefundSummaryVO.builder()
                        .totalRefunded(BigDecimal.ZERO)
                        .remainingRefundable(new BigDecimal("1000.00"))
                        .hasRefund(false)
                        .refundCount(0)
                        .build();

        when(refundService.cancelRefund(eq(testUserId), eq(1L), eq(1L))).thenReturn(summary);

        mockMvc.perform(delete("/api/v1/transactions/1/refunds/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.hasRefund").value(false))
                .andExpect(jsonPath("$.data.refundCount").value(0));
    }

    private TransactionVO createTransactionVO(
            Long id, String type, BigDecimal amount, String note) {
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

    private TransactionDTO createTransactionDTO(
            String type, BigDecimal amount, Long accountId, Long categoryId) {
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
