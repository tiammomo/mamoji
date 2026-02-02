/**
 * 项目名称: Mamoji 记账系统
 * 文件名: MamojiApplication.java
 * 功能描述: Spring Boot 应用入口类，负责启动整个应用程序
 *
 * 创建日期: 2024-01-01
 * 作者: tiammomo
 * 版本: 1.0.0
 */
package com.mamoji;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * Mamoji 记账系统入口类
 * 提供完整的个人/家庭记账功能，支持多账户管理、预算控制、收支分析
 * 技术栈: Spring Boot 3.5 + MyBatis-Plus 3.5 + MySQL + Redis
 */
@SpringBootApplication
@MapperScan({"com.mamoji.module.*.mapper", "com.mamoji.common.decorator"})
@EnableTransactionManagement
public class MamojiApplication {

    /**
     * 应用主入口方法
     *
     * @param args 命令行参数
     */
    public static void main(String[] args) {
        SpringApplication.run(MamojiApplication.class, args);
    }
}
