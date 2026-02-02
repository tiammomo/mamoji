package com.mamoji.module.transaction.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * 交易查询请求 DTO
 * 用于分页查询交易记录的筛选条件
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionQueryDTO {

    /** 交易类型过滤：income（收入）、expense（支出） */
    private String type;

    /** 账户ID过滤 */
    private Long accountId;

    /** 分类ID过滤 */
    private Long categoryId;

    /** 查询开始日期 */
    private LocalDate startDate;

    /** 查询结束日期 */
    private LocalDate endDate;

    /** 当前页码，从1开始 */
    private Long current;

    /** 每页显示数量 */
    private Long size;
}
