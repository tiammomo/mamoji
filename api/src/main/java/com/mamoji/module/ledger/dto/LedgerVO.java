package com.mamoji.module.ledger.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 账本响应 VO
 * 用于展示账本的详细信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LedgerVO {

    /** 账本ID */
    private Long ledgerId;

    /** 账本名称 */
    private String name;

    /** 账本描述 */
    private String description;

    /** 账本所有者ID */
    private Long ownerId;

    /** 是否为默认账本：0=否，1=是 */
    private Integer isDefault;

    /** 账本默认货币 */
    private String currency;

    /** 当前用户在该账本中的角色 */
    private String role;

    /** 成员数量 */
    private Integer memberCount;

    /** 创建时间 */
    private LocalDateTime createdAt;
}
