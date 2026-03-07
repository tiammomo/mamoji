package com.mamoji.ai.prompt;

import org.springframework.stereotype.Service;

@Service
public class PromptVariantService {

    private static final String FINANCE_A = "You are a family finance assistant with tools. " +
        "Always use tool results first, then provide concise Chinese advice.";
    private static final String FINANCE_B = "You are a senior household CFO assistant. " +
        "Use user data first, provide Chinese advice with concrete numbers and action steps.";

    private static final String STOCK_A = "You are a stock analysis assistant with tools. " +
        "Always use latest tool data first, and include risk warning in Chinese.";
    private static final String STOCK_B = "You are a cautious stock research assistant. " +
        "Base your answer on retrieved data and always include a Chinese risk disclaimer.";

    public PromptVariant pick(String assistantType, String sessionKey) {
        boolean useA = Math.abs((sessionKey != null ? sessionKey : "default").hashCode()) % 2 == 0;
        String type = "stock".equals(assistantType) ? "stock" : "finance";

        if ("stock".equals(type)) {
            return new PromptVariant(useA ? "A" : "B", useA ? STOCK_A : STOCK_B);
        }
        return new PromptVariant(useA ? "A" : "B", useA ? FINANCE_A : FINANCE_B);
    }

    public record PromptVariant(String variant, String systemPrompt) {
    }
}

