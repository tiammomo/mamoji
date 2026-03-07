package com.mamoji.ai;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "ai")
public class AiProperties {

    /**
     * Provider base URL, e.g. https://api.minimaxi.com
     */
    private String baseUrl = "https://api.minimaxi.com";

    /**
     * API token for the upstream model provider.
     */
    private String apiKey;

    /**
     * Default model name.
     */
    private String model = "abab6.5s-chat";

    private int maxTokens = 1024;

    private double temperature = 0.7;

    /**
     * Request timeout in seconds.
     */
    private int timeoutSeconds = 30;

    /**
     * Max retry attempts for transient failures.
     */
    private int maxRetries = 2;
}

