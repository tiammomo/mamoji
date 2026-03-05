package com.mamoji.agent.tool;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 工具基类，提供统一的错误处理和工具方法
 */
@Slf4j
@RequiredArgsConstructor
public abstract class BaseTool {

    protected final ObjectMapper objectMapper;

    /**
     * 处理工具执行错误
     */
    protected String handleError(Exception e, String toolName) {
        log.error("Tool {} execution failed: {}", toolName, e.getMessage(), e);

        if (e instanceof NullPointerException) {
            return "数据不存在，请检查查询参数";
        } else if (e instanceof IllegalArgumentException) {
            return "参数错误: " + e.getMessage();
        } else if (e instanceof RuntimeException) {
            return "服务异常: " + e.getMessage();
        } else {
            return "查询失败: " + e.getMessage();
        }
    }

    /**
     * 将对象转换为 JSON 字符串
     */
    protected String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize object: {}", e.getMessage());
            return "{}";
        }
    }

    /**
     * 构建成功响应
     */
    protected String buildSuccess(Object data) {
        return toJson(data);
    }

    /**
     * 构建错误响应
     */
    protected String buildError(String message) {
        return toJson(new ToolResult(false, message, null));
    }

    /**
     * 工具结果内部类
     */
    public record ToolResult(boolean success, String message, Object data) {}
}
