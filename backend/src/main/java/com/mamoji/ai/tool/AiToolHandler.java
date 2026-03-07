package com.mamoji.ai.tool;

import java.util.Map;

public interface AiToolHandler {

    String name();

    AiToolResult execute(Long userId, Map<String, Object> params);
}

