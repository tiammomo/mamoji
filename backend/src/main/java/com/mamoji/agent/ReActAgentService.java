package com.mamoji.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mamoji.agent.tool.finance.FinanceTools;
import com.mamoji.agent.tool.stock.StockTools;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

/**
 * ReAct Agent 服务
 * 实现 Reasoning + Acting 模式，让 AI 能够调用工具获取实时数据
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReActAgentService {

    private final FinanceTools financeTools;
    private final StockTools stockTools;
    private final ObjectMapper objectMapper;

    @Value("${ai.api-key}")
    private String apiKey;

    // 财务助手 System Prompt
    private static final String FINANCE_SYSTEM_PROMPT = """
        You are a professional family finance assistant with the ability to call tools.

        Your capabilities:
        - You can query user's income and expense data
        - You can check budget execution status
        - You can retrieve transaction records
        - You can analyze category-based spending statistics

        When to use tools:
        - If user asks about income/expense → use query_income_expense
        - If user asks about budget → use query_budget
        - If user asks about transactions → use query_transactions
        - If user asks about category spending → use query_category_stats

        Response format:
        1. First call the appropriate tool(s) to get data
        2. Then analyze the data and provide professional advice
        3. Reply in Chinese, be friendly and helpful

        Important: Always call tools first before giving advice when user asks about their financial data.
        """;

    // 股票助手 System Prompt
    private static final String STOCK_SYSTEM_PROMPT = """
        You are a professional stock market analyst assistant with the ability to call tools.

        Your capabilities:
        - You can query stock quotes for specific stocks
        - You can get market index data (Shanghai, Shenzhen, ChiNext)
        - You can search for stock information
        - You can get stock news

        When to use tools:
        - If user asks about specific stock price → use query_stock_quote
        - If user asks about market index → use query_market_index
        - If user wants to search stocks → use search_stock
        - If user asks about news → use get_stock_news

        Response format:
        1. First call the appropriate tool(s) to get data
        2. Then analyze and provide professional advice
        3. Always remind users about investment risks
        4. Reply in Chinese

        Important: Always call tools first before giving advice about stocks.
        """;

    /**
     * 处理用户消息
     */
    public String processMessage(Long userId, String message, String assistantType) {
        try {
            // 设置用户ID（用于财务工具）
            financeTools.setUserId(userId);

            // 根据助手类型选择 System Prompt
            String systemPrompt = "finance".equals(assistantType)
                    ? FINANCE_SYSTEM_PROMPT
                    : STOCK_SYSTEM_PROMPT;

            // 构建初始提示
            String userPrompt = "用户问题: " + message + "\n\n请先分析是否需要调用工具，如果需要请调用合适的工具获取数据。";

            // 第一次调用 LLM，判断是否需要调用工具
            String llmResponse = callLLMWithTools(userPrompt, systemPrompt, assistantType);

            // 解析 LLM 响应，检测工具调用（传入原始消息用于关键词匹配）
            String toolResult = parseAndExecuteTools(llmResponse, assistantType, message);

            if (toolResult != null) {
                // 如果需要调用工具，执行工具后再次调用 LLM
                String finalPrompt = buildFinalPrompt(message, toolResult);
                return callLLM(finalPrompt, systemPrompt);
            }

            // 如果不需要调用工具，直接返回 LLM 响应
            return llmResponse;

        } catch (Exception e) {
            log.error("ReAct Agent 处理失败: {}", e.getMessage(), e);
            return "抱歉，处理您的请求时发生错误: " + e.getMessage();
        }
    }

    /**
     * 解析 LLM 响应并执行工具
     * @param llmResponse LLM的响应
     * @param assistantType 助手类型
     * @param originalMessage 原始用户消息，用于更准确的关键词匹配
     */
    private String parseAndExecuteTools(String llmResponse, String assistantType, String originalMessage) {
        // 检测是否包含工具调用请求
        // 简单实现：基于关键词判断是否需要调用工具
        boolean needsTool = false;
        String toolName = null;
        Map<String, Object> toolParams = new HashMap<>();

        String lowerResponse = llmResponse.toLowerCase();
        String lowerOriginal = originalMessage != null ? originalMessage.toLowerCase() : "";

        if ("finance".equals(assistantType)) {
            // 财务助手关键词检测 - 优先检查原始消息
            if (lowerOriginal.contains("分类") || lowerOriginal.contains("类别") || lowerOriginal.contains("哪类")
                    || lowerOriginal.contains("最多") || lowerOriginal.contains("支出统计")) {
                toolName = "query_category_stats";
                needsTool = true;
            } else if (lowerOriginal.contains("收支") || lowerOriginal.contains("收入") || lowerOriginal.contains("支出") || lowerOriginal.contains("开销")) {
                toolName = "query_income_expense";
                needsTool = true;
            } else if (lowerOriginal.contains("预算")) {
                toolName = "query_budget";
                needsTool = true;
            } else if (lowerOriginal.contains("交易") || lowerOriginal.contains("记录")) {
                toolName = "query_transactions";
                toolParams.put("startDate", "");
                toolParams.put("endDate", "");
                needsTool = true;
            }
            // 备用：检查LLM响应
            else if (lowerResponse.contains("分类") || lowerResponse.contains("类别")) {
                toolName = "query_category_stats";
                needsTool = true;
            } else if (lowerResponse.contains("收支") || lowerResponse.contains("收入") || lowerResponse.contains("支出")) {
                toolName = "query_income_expense";
                needsTool = true;
            } else if (lowerResponse.contains("预算")) {
                toolName = "query_budget";
                needsTool = true;
            }
        } else if ("stock".equals(assistantType)) {
            // 股票助手关键词检测 - 优先检查原始消息
            if (lowerOriginal.contains("上证") || lowerOriginal.contains("深证") || lowerOriginal.contains("指数") || lowerOriginal.contains("大盘")) {
                toolName = "query_market_index";
                needsTool = true;
            } else if (lowerOriginal.contains("股票") || lowerOriginal.contains("行情") || lowerOriginal.contains("价格") || lowerOriginal.contains("查询")) {
                toolName = "query_stock_quote";
                // 优先从原始消息提取股票代码
                String code = extractStockCode(originalMessage);
                // 如果原始消息没有代码，尝试从LLM响应提取
                if (code == null || code.isEmpty()) {
                    code = extractStockCode(llmResponse);
                }
                toolParams.put("stockCode", code != null ? code : "000001");
                needsTool = true;
            } else if (lowerOriginal.contains("搜索") || lowerOriginal.contains("查找")) {
                toolName = "search_stock";
                needsTool = true;
            }
            // 备用：检查LLM响应
            else if (lowerResponse.contains("上证") || lowerResponse.contains("深证") || lowerResponse.contains("指数") || lowerResponse.contains("大盘")) {
                toolName = "query_market_index";
                needsTool = true;
            } else if (lowerResponse.contains("股票") || lowerResponse.contains("行情") || lowerResponse.contains("价格")) {
                toolName = "query_stock_quote";
                String code = extractStockCode(llmResponse);
                toolParams.put("stockCode", code != null ? code : "000001");
                needsTool = true;
            }
        }

        if (needsTool && toolName != null) {
            return executeTool(toolName, toolParams);
        }

        return null;
    }

    /**
     * 从文本中提取股票代码
     */
    private String extractStockCode(String text) {
        if (text == null || text.isEmpty()) {
            return null;
        }

        // 股票名称到代码的映射
        Map<String, String> stockNameToCode = new HashMap<>();
        stockNameToCode.put("茅台", "600519");
        stockNameToCode.put("贵州茅台", "600519");
        stockNameToCode.put("平安", "601318");
        stockNameToCode.put("中国平安", "601318");
        stockNameToCode.put("腾讯", "00700");
        stockNameToCode.put("阿里巴巴", "09988");
        stockNameToCode.put("美团", "03690");
        stockNameToCode.put("宁德时代", "300750");
        stockNameToCode.put("比亚迪", "002594");
        stockNameToCode.put("华为", "000888");
        stockNameToCode.put("工商银行", "601398");
        stockNameToCode.put("建设银行", "601939");
        stockNameToCode.put("农业银行", "601288");
        stockNameToCode.put("中国银行", "601988");
        stockNameToCode.put("招商银行", "600036");
        stockNameToCode.put("万科", "000002");
        stockNameToCode.put("格力电器", "000651");
        stockNameToCode.put("美的", "000333");
        stockNameToCode.put("海螺水泥", "600585");
        stockNameToCode.put("中石油", "601857");
        stockNameToCode.put("中石化", "600028");
        stockNameToCode.put("中国移动", "600941");
        stockNameToCode.put("中国电信", "601728");

        // 先检查是否包含中文股票名称
        for (Map.Entry<String, String> entry : stockNameToCode.entrySet()) {
            if (text.contains(entry.getKey())) {
                return entry.getValue();
            }
        }

        // 匹配6位数字股票代码
        if (text.matches(".*\\d{6}.*")) {
            return text.replaceAll(".*(\\d{6}).*", "$1");
        }

        return null; // 未找到
    }

    /**
     * 执行工具
     */
    private String executeTool(String toolName, Map<String, Object> params) {
        try {
            log.info("执行工具: {}, 参数: {}", toolName, params);

            return switch (toolName) {
                case "query_income_expense" -> financeTools.queryIncomeExpense(
                        (String) params.getOrDefault("startDate", null),
                        (String) params.getOrDefault("endDate", null));

                case "query_budget" -> financeTools.queryBudget(
                        (Long) params.getOrDefault("budgetId", null));

                case "query_transactions" -> financeTools.queryTransactions(
                        (String) params.getOrDefault("startDate", null),
                        (String) params.getOrDefault("endDate", null),
                        (Long) params.getOrDefault("categoryId", null),
                        (Integer) params.getOrDefault("type", null));

                case "query_category_stats" -> financeTools.queryCategoryStats(
                        (String) params.getOrDefault("startDate", null),
                        (String) params.getOrDefault("endDate", null),
                        (Integer) params.getOrDefault("type", 2));

                case "query_market_index" -> stockTools.queryMarketIndex();

                case "query_stock_quote" -> stockTools.queryStockQuote(
                        (String) params.getOrDefault("stockCode", "000001"));

                case "search_stock" -> stockTools.searchStock(
                        (String) params.getOrDefault("keyword", ""));

                case "get_stock_news" -> stockTools.getStockNews(
                        (String) params.getOrDefault("stockCode", null));

                default -> "未知工具: " + toolName;
            };
        } catch (Exception e) {
            log.error("工具执行失败: {}", toolName, e);
            return "工具执行失败: " + e.getMessage();
        }
    }

    /**
     * 构建最终提示（包含工具结果）
     */
    private String buildFinalPrompt(String message, String toolResult) {
        return String.format("""
            用户问题: %s

            工具执行结果:
            %s

            请根据以上工具返回的数据，分析并回答用户的问题。
            """, message, toolResult);
    }

    /**
     * 调用 LLM（带工具版本，当前为简化实现）
     */
    @SuppressWarnings("unchecked")
    private String callLLMWithTools(String userPrompt, String systemPrompt, String assistantType) {
        try {
            // 这里使用简化实现：先构建上下文，然后判断是否需要工具
            // 完整的实现应该使用 Spring AI 的 ChatClient

            // 对于财务助手，直接获取数据
            if ("finance".equals(assistantType)) {
                String data = financeTools.queryIncomeExpense(null, null);
                return String.format("我需要查询您的财务数据来回答这个问题。\n\n查询结果: %s\n\n请基于以上数据给出分析和建议。", data);
            }

            // 对于股票助手，获取大盘数据
            if ("stock".equals(assistantType)) {
                String data = stockTools.queryMarketIndex();
                return String.format("我需要查询股票市场数据来回答这个问题。\n\n查询结果: %s\n\n请基于以上数据给出分析和建议。", data);
            }

            return callLLM(userPrompt, systemPrompt);
        } catch (Exception e) {
            log.error("LLM 调用失败: {}", e.getMessage(), e);
            return "抱歉，处理您的请求时出现问题。";
        }
    }

    /**
     * 调用 LLM
     */
    @SuppressWarnings("unchecked")
    private String callLLM(String prompt, String systemPrompt) {
        try {
            String apiUrl = "https://api.minimaxi.com/v1/text/chatcompletion_v2";

            WebClient client = WebClient.builder()
                    .baseUrl(apiUrl)
                    .defaultHeader("Authorization", "Bearer " + apiKey)
                    .defaultHeader("Content-Type", "application/json")
                    .build();

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "abab6.5s-chat");
            requestBody.put("max_tokens", 1024);
            requestBody.put("temperature", 0.7);

            Map<String, String> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", systemPrompt);

            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", prompt);

            requestBody.put("messages", new Object[]{systemMessage, userMessage});

            Map<String, Object> response = client.post()
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            log.info("AI API 响应: {}", response);

            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    if (choice.containsKey("message")) {
                        Map<String, Object> message = (Map<String, Object>) choice.get("message");
                        Object content = message.get("content");
                        if (content != null) {
                            return content.toString();
                        }
                    }
                }
            }

            return "抱歉，我暂时无法回答这个问题。";
        } catch (Exception e) {
            log.error("AI API 调用失败: {}", e.getMessage(), e);
            return "抱歉，AI 服务暂时不可用。";
        }
    }
}
