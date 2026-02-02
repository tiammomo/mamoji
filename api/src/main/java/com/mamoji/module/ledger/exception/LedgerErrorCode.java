package com.mamoji.module.ledger.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 账本模块错误码枚举
 * 定义账本相关的所有业务错误码及其描述信息
 */
@Getter
@AllArgsConstructor
public enum LedgerErrorCode {

    /** 账本不存在 */
    LEDGER_NOT_FOUND("LEDGER_001", "账本不存在"),
    /** 无权访问该账本 */
    NO_ACCESS("LEDGER_002", "无权访问该账本"),
    /** 账本名称已存在 */
    LEDGER_NAME_EXISTS("LEDGER_003", "账本名称已存在"),
    /** 账本还有其他成员，无法删除 */
    CANNOT_DELETE_LEDGER_WITH_MEMBERS("LEDGER_004", "账本还有其他成员，无法删除"),
    /** 不能修改账本所有者的角色 */
    CANNOT_MODIFY_OWNER_ROLE("LEDGER_005", "不能修改账本所有者的角色"),
    /** 不能移除账本所有者 */
    CANNOT_REMOVE_OWNER("LEDGER_006", "不能移除账本所有者"),
    /** 账本所有者不能退出，请先转让账本 */
    CANNOT_QUIT_OWNER("LEDGER_007", "账本所有者不能退出，请先转让账本"),

    /** 邀请码不存在 */
    INVITATION_NOT_FOUND("INVITE_001", "邀请码不存在"),
    /** 邀请码已禁用 */
    INVITATION_DISABLED("INVITE_002", "邀请码已禁用"),
    /** 邀请码已过期 */
    INVITATION_EXPIRED("INVITE_003", "邀请码已过期"),
    /** 邀请码已达到使用次数上限 */
    INVITATION_MAX_USES_REACHED("INVITE_004", "邀请码已达到使用次数上限"),
    /** 已是账本成员 */
    ALREADY_MEMBER("INVITE_005", "已是账本成员"),

    /** 权限不足 */
    NO_PERMISSION("PERM_001", "权限不足");

    private final String code;
    private final String message;
}
