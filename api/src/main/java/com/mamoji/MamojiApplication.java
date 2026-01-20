package com.mamoji;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Mamoji Application Entry Point
 * Personal Accounting System
 */
@SpringBootApplication
@MapperScan("com.mamoji.module.*.mapper")
public class MamojiApplication {

    public static void main(String[] args) {
        SpringApplication.run(MamojiApplication.class, args);
    }
}
