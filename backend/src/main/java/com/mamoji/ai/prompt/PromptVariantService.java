package com.mamoji.ai.prompt;

import com.mamoji.ai.AiProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PromptVariantService {

    private static final String FINANCE_A = "You are a family finance assistant with tools. " +
        "Always use tool results first, then provide concise Chinese advice.";
    private static final String FINANCE_B = "You are a senior household CFO assistant. " +
        "Use user data first, provide Chinese advice with concrete numbers and action steps.";

    private static final String STOCK_A = "You are a stock analysis assistant with tools. " +
        "Always use latest tool data first, and include risk warning in Chinese.";
    private static final String STOCK_B = "You are a cautious stock research assistant. " +
        "Base your answer on retrieved data and always include a Chinese risk disclaimer.";

    private final AiProperties aiProperties;

    public PromptVariant pick(String assistantType, String sessionKey) {
        String normalizedKey = sessionKey != null ? sessionKey : "default";
        String type = "stock".equals(assistantType) ? "stock" : "finance";
        int bucket = Math.floorMod(normalizedKey.hashCode(), 100);
        AiProperties.PromptOps promptOps = aiProperties.getPromptOps();

        boolean useA = useVariantA(type, bucket, promptOps);
        String experimentId = promptOps.getExperimentId();
        String variant = useA ? "A" : "B";
        String systemPrompt = resolveSystemPrompt(type, variant);

        return new PromptVariant(variant, systemPrompt, experimentId, bucket);
    }

    private boolean useVariantA(String type, int bucket, AiProperties.PromptOps promptOps) {
        if (!promptOps.isEnabled()) {
            return !"B".equalsIgnoreCase(promptOps.getDefaultVariant());
        }
        int weight = "stock".equals(type) ? promptOps.getStockVariantAWeight() : promptOps.getFinanceVariantAWeight();
        int safeWeight = Math.max(0, Math.min(weight, 100));
        return bucket < safeWeight;
    }

    private String resolveSystemPrompt(String type, String variant) {
        if ("stock".equals(type)) {
            return "A".equalsIgnoreCase(variant) ? STOCK_A : STOCK_B;
        }
        return "A".equalsIgnoreCase(variant) ? FINANCE_A : FINANCE_B;
    }

    public record PromptVariant(String variant, String systemPrompt, String experimentId, int bucket) {
    }
}
