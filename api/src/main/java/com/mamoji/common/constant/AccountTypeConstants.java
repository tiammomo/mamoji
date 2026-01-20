package com.mamoji.common.constant;

/**
 * 账户类型常量
 */
public final class AccountTypeConstants {

    private AccountTypeConstants() {
        // 私有构造函数，防止实例化
    }

    // 资产账户类型
    public static final String TYPE_BANK = "bank";
    public static final String TYPE_CASH = "cash";
    public static final String TYPE_ALIPAY = "alipay";
    public static final String TYPE_WECHAT = "wechat";

    // 信用账户类型
    public static final String TYPE_CREDIT = "credit";

    // 投资账户类型
    public static final String TYPE_GOLD = "gold";
    public static final String TYPE_FUND_ACCUMULATION = "fund_accumulation";
    public static final String TYPE_FUND = "fund";
    public static final String TYPE_STOCK = "stock";

    // 负债账户类型
    public static final String TYPE_TOPUP = "topup";
    public static final String TYPE_DEBT = "debt";

    // 信用卡子类型
    public static final String SUB_TYPE_CREDIT_CARD = "credit_card";

    // 银行卡子类型
    public static final String SUB_TYPE_BANK_PRIMARY = "bank_primary";
    public static final String SUB_TYPE_BANK_SECONDARY = "bank_secondary";
}
