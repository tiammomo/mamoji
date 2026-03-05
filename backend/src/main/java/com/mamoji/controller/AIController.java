package com.mamoji.controller;

import com.mamoji.agent.ReActAgentService;
import com.mamoji.dto.AIChatRequest;
import com.mamoji.dto.AIChatResponse;
import com.mamoji.entity.User;
import com.mamoji.security.AuthenticationUser;
import com.mamoji.service.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;
    private final ReActAgentService reActAgentService;

    /**
     * 聊天接口 - 使用 ReAct Agent
     */
    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(
            @RequestBody AIChatRequest request,
            @AuthenticationUser User user) {

        // 使用 ReAct Agent 处理
        String reply = reActAgentService.processMessage(
                user.getId(),
                request.getMessage(),
                request.getAssistantType());

        AIChatResponse response = new AIChatResponse(reply);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", response);

        return ResponseEntity.ok(result);
    }

    /**
     * 聊天接口 - 使用传统方式（保留兼容性）
     */
    @PostMapping("/chat/legacy")
    public ResponseEntity<Map<String, Object>> chatLegacy(
            @RequestBody AIChatRequest request,
            @AuthenticationUser User user) {

        AIChatResponse response = aiService.chat(user.getId(), request.getMessage(), request.getAssistantType());

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", response);

        return ResponseEntity.ok(result);
    }
}
