package com.mamoji;

import com.mamoji.ai.AiProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AiProperties.class)
public class MamojiApplication {

    public static void main(String[] args) {
        SpringApplication.run(MamojiApplication.class, args);
    }
}
