package com.mamoji.ai;

import com.mamoji.ai.metrics.AiMetricsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.stereotype.Service;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import reactor.core.publisher.Flux;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnClass(ChatClient.class)
@ConditionalOnBean(ChatModel.class)
public class SpringAiGateway implements AiGateway {

    private static final String FALLBACK_ERROR_MESSAGE = "Sorry, AI service is temporarily unavailable. Please try again later.";

    private final ChatModel chatModel;
    private final AiMetricsService metricsService;

    @Override
    public String chat(String systemPrompt, String userPrompt, String modelOverride, String assistantType) {
        long start = System.currentTimeMillis();
        try {
            String prompt = buildPrompt(systemPrompt, userPrompt, modelOverride);
            String result = ChatClient.create(chatModel)
                .prompt(prompt)
                .call()
                .content();
            long elapsed = System.currentTimeMillis() - start;
            metricsService.recordRequest("spring-ai", true, elapsed, estimateTokens(prompt, result));
            metricsService.recordModelRoute(assistantType, modelOverride != null ? modelOverride : "spring-ai-default");
            return result != null ? result : "AI service returned empty response";
        } catch (Exception ex) {
            long elapsed = System.currentTimeMillis() - start;
            log.error("Spring AI request failed elapsedMs={} error={}", elapsed, ex.getMessage(), ex);
            metricsService.recordRequest("spring-ai", false, elapsed, estimateTokens(systemPrompt, userPrompt));
            return FALLBACK_ERROR_MESSAGE;
        }
    }

    @Override
    public Flux<String> streamChat(String systemPrompt, String userPrompt, String modelOverride, String assistantType) {
        return chunkText(chat(systemPrompt, userPrompt, modelOverride, assistantType));
    }

    private String buildPrompt(String systemPrompt, String userPrompt, String modelOverride) {
        StringBuilder prompt = new StringBuilder();
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            prompt.append("System:\n").append(systemPrompt.trim()).append("\n\n");
        }
        if (modelOverride != null && !modelOverride.isBlank()) {
            prompt.append("Preferred model: ").append(modelOverride.trim()).append("\n");
        }
        prompt.append("User:\n").append(userPrompt != null ? userPrompt : "");
        return prompt.toString();
    }

    private Flux<String> chunkText(String fullText) {
        if (fullText == null || fullText.isEmpty()) {
            return Flux.just("");
        }
        int chunkSize = 24;
        int count = (fullText.length() + chunkSize - 1) / chunkSize;
        return Flux.range(0, count)
            .map(i -> {
                int start = i * chunkSize;
                int end = Math.min(start + chunkSize, fullText.length());
                return fullText.substring(start, end);
            });
    }

    private int estimateTokens(String input, String output) {
        int chars = 0;
        chars += input != null ? input.length() : 0;
        chars += output != null ? output.length() : 0;
        return Math.max(1, chars / 4);
    }
}
