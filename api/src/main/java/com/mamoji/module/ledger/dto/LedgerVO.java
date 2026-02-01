package com.mamoji.module.ledger.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 账本响应
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LedgerVO {

    private Long ledgerId;

    private String name;

    private String description;

    private Long ownerId;

    private Integer isDefault;

    private String currency;

    private String role;

    private Integer memberCount;

    private LocalDateTime createdAt;
}
