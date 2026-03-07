package com.mamoji.ai.tool;

public record AiToolResult(
    boolean success,
    String toolName,
    String payload,
    String error
) {

    public static AiToolResult ok(String toolName, String payload) {
        return new AiToolResult(true, toolName, payload, null);
    }

    public static AiToolResult fail(String toolName, String error) {
        return new AiToolResult(false, toolName, null, error);
    }
}

