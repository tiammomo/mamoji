package com.mamoji.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/** CORS (Cross-Origin Resource Sharing) Configuration */
@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // Allow specific origins (can be configured as needed)
        config.addAllowedOriginPattern("*");
        // Or for specific origins:
        // config.addAllowedOrigin("http://localhost:3000");
        // config.addAllowedOrigin("http://localhost:5173");

        // Allow credentials
        config.setAllowCredentials(true);

        // Allow specific headers
        config.addAllowedHeader("*");

        // Allow specific methods
        config.addAllowedMethod("GET");
        config.addAllowedMethod("POST");
        config.addAllowedMethod("PUT");
        config.addAllowedMethod("DELETE");
        config.addAllowedMethod("OPTIONS");
        config.addAllowedMethod("PATCH");

        // Expose headers
        config.addExposedHeader("Authorization");
        config.addExposedHeader("Content-Disposition");

        // Cache preflight response for 1 hour
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
