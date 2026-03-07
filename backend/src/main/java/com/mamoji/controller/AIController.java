package com.mamoji.controller;

import com.mamoji.agent.ReActAgentService;
import com.mamoji.ai.AiClientService;
import com.mamoji.ai.model.StructuredAiResponse;
import com.mamoji.dto.AIChatRequest;
import com.mamoji.dto.AIChatResponse;
import com.mamoji.entity.User;
import com.mamoji.security.AuthenticationUser;
import com.mamoji.service.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;
    private final ReActAgentService reActAgentService;
    private final AiClientService aiClientService;

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody AIChatRequest request, @AuthenticationUser User user) {
        String reply = reActAgentService.processMessage(
            user.getId(),
            request.getMessage(),
            request.getAssistantType(),
            request.getSessionId()
        );
        return ResponseEntity.ok(wrapSuccess(new AIChatResponse(reply)));
    }

    @PostMapping("/chat/v2")
    public ResponseEntity<Map<String, Object>> chatV2(@RequestBody AIChatRequest request, @AuthenticationUser User user) {
        StructuredAiResponse response = reActAgentService.processMessageStructured(
            user.getId(),
            request.getMessage(),
            request.getAssistantType(),
            request.getSessionId()
        );
        return ResponseEntity.ok(wrapSuccess(response));
    }

    @PostMapping("/chat/legacy")
    public ResponseEntity<Map<String, Object>> chatLegacy(@RequestBody AIChatRequest request, @AuthenticationUser User user) {
        AIChatResponse response = aiService.chat(user.getId(), request.getMessage(), request.getAssistantType());
        return ResponseEntity.ok(wrapSuccess(response));
    }

    @PostMapping(path = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<Map<String, Object>>> chatStream(@RequestBody AIChatRequest request, @AuthenticationUser User user) {
        String assistantType = request.getAssistantType() == null || request.getAssistantType().isBlank()
            ? "finance"
            : request.getAssistantType();

        String systemPrompt = "stock".equals(assistantType)
            ? "You are a stock analyst assistant. Reply in Chinese and include risk warning."
            : "You are a family finance assistant. Reply in Chinese with practical suggestions.";

        String userPrompt = "userId=" + user.getId() + "\nquestion=" + request.getMessage();

        return aiClientService.streamChat(systemPrompt, userPrompt)
            .map(chunk -> ServerSentEvent.<Map<String, Object>>builder()
                .event("chunk")
                .data(Map.of("content", chunk))
                .build())
            .concatWithValues(ServerSentEvent.<Map<String, Object>>builder()
                .event("done")
                .data(Map.of("done", true))
                .build());
    }

    private Map<String, Object> wrapSuccess(Object data) {
        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", data);
        return result;
    }
}
