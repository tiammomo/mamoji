package com.mamoji.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;

/**
 * Swagger/OpenAPI Configuration for API documentation.
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI mamojiOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Mamoji 记账系统 API")
                        .description("个人记账管理系统的后端 API 接口文档")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Mamoji Team")
                                .email("support@mamoji.com"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .addServersItem(new Server()
                        .url("http://localhost:48080")
                        .description("本地开发环境"))
                .addServersItem(new Server()
                        .url("https://api.mamoji.com")
                        .description("生产环境"));
    }
}
