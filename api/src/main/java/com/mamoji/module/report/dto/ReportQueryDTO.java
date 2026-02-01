package com.mamoji.module.report.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/** Report Query Request DTO */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportQueryDTO {

    /** Start date */
    private LocalDate startDate;

    /** End date */
    private LocalDate endDate;

    /** Group by: day, week, month */
    private String groupBy;
}
