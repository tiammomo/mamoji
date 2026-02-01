package com.mamoji.module.ledger.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 创建账本请求
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLedgerRequest {

    @NotBlank(message = "账本名称不能为空")
    @Size(min = 1, max = 100, message = "账本名称长度必须在1-100之间")
    private String name;

    @Size(max = 500, message = "描述长度不能超过500")
    private String description;

    private String currency;
}
