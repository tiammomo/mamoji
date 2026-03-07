package com.mamoji.ai;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

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

    /**
     * Optional fallback model used when primary model request fails.
     */
    private String fallbackModel;

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

    private final PromptOps promptOps = new PromptOps();
    private final ToolOps toolOps = new ToolOps();
    private final MemoryOps memoryOps = new MemoryOps();
    private final RagOps ragOps = new RagOps();

    @Getter
    @Setter
    public static class PromptOps {
        /**
         * Whether prompt experiment is enabled.
         */
        private boolean enabled = true;

        /**
         * Default variant when experiment is disabled.
         */
        private String defaultVariant = "A";

        /**
         * Experiment id for tracking.
         */
        private String experimentId = "prompt-exp-v1";

        /**
         * Percentage(0-100) of finance traffic assigned to variant A.
         */
        private int financeVariantAWeight = 50;

        /**
         * Percentage(0-100) of stock traffic assigned to variant A.
         */
        private int stockVariantAWeight = 50;
    }

    @Getter
    @Setter
    public static class ToolOps {
        /**
         * Whether tool guard (policy + rate limit) is enabled.
         */
        private boolean enabled = true;

        /**
         * Max allowed calls per user+tool in a rolling 1-minute window.
         */
        private int perUserToolPerMinute = 30;

        /**
         * Denied tool names, case-insensitive exact match.
         */
        private List<String> blockedTools = new ArrayList<>();
    }

    @Getter
    @Setter
    public static class MemoryOps {
        /**
         * Use Redis-backed memory store instead of in-memory map.
         */
        private boolean redisEnabled = false;

        /**
         * Max turns kept per session.
         */
        private int maxStoredTurns = 40;

        /**
         * Session TTL in seconds for Redis memory.
         */
        private int ttlSeconds = 86400;
    }

    @Getter
    @Setter
    public static class RagOps {
        /**
         * Whether to enable file-based knowledge retrieval.
         */
        private boolean fileEnabled = true;

        /**
         * Knowledge file path, supports classpath: and file:.
         */
        private String knowledgePath = "classpath:ai/knowledge-base.json";
    }
}
