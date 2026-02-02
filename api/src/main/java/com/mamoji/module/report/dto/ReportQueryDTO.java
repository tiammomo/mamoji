package com.mamoji.module.report.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * 报表查询请求 DTO
 * 用于查询报表数据的请求参数
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportQueryDTO {

    /** 查询开始日期 */
    private LocalDate startDate;

    /** 查询结束日期 */
    private LocalDate endDate;

    /** 分组方式：day（按天）、week（按周）、month（按月） */
    private String groupBy;
}
