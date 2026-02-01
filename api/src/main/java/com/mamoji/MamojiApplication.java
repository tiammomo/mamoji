package com.mamoji;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/** Mamoji 记账系统入口类 */
@SpringBootApplication
@MapperScan({"com.mamoji.module.*.mapper", "com.mamoji.common.decorator"})
@EnableTransactionManagement
public class MamojiApplication {

    public static void main(String[] args) {
        SpringApplication.run(MamojiApplication.class, args);
    }
}
