package com.mamoji.module.ledger.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 创建账本请求 DTO
 * 用于创建新账本的请求参数
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLedgerRequest {

    /** 账本名称，必填，长度1-100字符 */
    @NotBlank(message = "账本名称不能为空")
    @Size(min = 1, max = 100, message = "账本名称长度必须在1-100之间")
    private String name;

    /** 账本描述，可选，最大500字符 */
    @Size(max = 500, message = "描述长度不能超过500")
    private String description;

    /** 账本默认货币，可选 */
    private String currency;
}
