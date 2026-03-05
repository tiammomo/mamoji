package com.mamoji.agent.tool.stock;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mamoji.agent.tool.BaseTool;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * 股票助手工具集
 * 提供股票查询、大盘分析、板块分析等功能
 */
@Slf4j
@Component
public class StockTools extends BaseTool {

    private final WebClient.Builder webClientBuilder;

    public StockTools(ObjectMapper objectMapper, WebClient.Builder webClientBuilder) {
        super(objectMapper);
        this.webClientBuilder = webClientBuilder;
    }

    /**
     * 查询股票行情
     * @param stockCode 股票代码，如 600519（上海）、000001（深圳）
     * @return 股票名称、当前价、涨跌幅、开盘价、收盘价、最高价、最低价、成交量
     */
    public String queryStockQuote(String stockCode) {

        try {
            String normalizedCode = normalizeStockCode(stockCode);
            String data = fetchStockData(normalizedCode);

            if (data == null || data.isEmpty()) {
                return toJson(Map.of("error", "未找到股票数据"));
            }

            return data;
        } catch (Exception e) {
            return handleError(e, "query_stock_quote");
        }
    }

    /**
     * 查询大盘指数
     * @return 上证指数、深证成指、创业板指的实时行情
     */
    public String queryMarketIndex() {

        try {
            StringBuilder result = new StringBuilder();

            // 上证指数
            String shData = fetchStockData("sh000001");
            if (shData != null) result.append(shData).append("\n");

            // 深证成指
            String szData = fetchStockData("sz399001");
            if (szData != null) result.append(szData).append("\n");

            // 创业板指
            String cyData = fetchStockData("sz399006");
            if (cyData != null) result.append(cyData).append("\n");

            return result.toString();
        } catch (Exception e) {
            return handleError(e, "query_market_index");
        }
    }

    /**
     * 搜索股票
     * @param keyword 股票名称或代码关键词
     * @return 匹配的股票列表及代码
     */
    public String searchStock(String keyword) {

        try {
            // 预定义股票映射
            Map<String, String> stockMap = new HashMap<>();
            stockMap.put("茅台", "sh600519");
            stockMap.put("贵州茅台", "sh600519");
            stockMap.put("平安", "sh601318");
            stockMap.put("中国平安", "sh601318");
            stockMap.put("腾讯", "sz00700");
            stockMap.put("阿里巴巴", "sz09988");
            stockMap.put("美团", "sz03690");
            stockMap.put("宁德时代", "sz300750");
            stockMap.put("比亚迪", "sz002594");
            stockMap.put("华为", "sz000888");
            stockMap.put("工商银行", "sh601398");
            stockMap.put("建设银行", "sh601939");
            stockMap.put("农业银行", "sh601288");
            stockMap.put("中国银行", "sh601988");
            stockMap.put("招商银行", "sh600036");
            stockMap.put("浦发银行", "sh600000");
            stockMap.put("兴业银行", "sh601166");
            stockMap.put("万科", "sz000002");
            stockMap.put("格力电器", "sz000651");
            stockMap.put("美的", "sz000333");
            stockMap.put("海螺水泥", "sh600585");
            stockMap.put("中石油", "sh601857");
            stockMap.put("中石化", "sh600028");
            stockMap.put("中国移动", "sh600941");
            stockMap.put("中国电信", "sh601728");

            List<Map<String, String>> results = stockMap.entrySet().stream()
                    .filter(e -> e.getKey().contains(keyword) || e.getValue().contains(keyword))
                    .map(e -> Map.of("name", e.getKey(), "code", e.getValue()))
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("keyword", keyword);
            response.put("count", results.size());
            response.put("results", results);

            return toJson(response);
        } catch (Exception e) {
            return handleError(e, "search_stock");
        }
    }

    /**
     * 获取股票新闻
     * @param stockCode 股票代码，可选
     * @return 相关新闻列表
     */
    public String getStockNews(String stockCode) {

        try {
            // 模拟新闻数据
            List<Map<String, String>> news = List.of(
                Map.of("title", "A股三大指数今日震荡上行", "time", "今日", "source", "财经网"),
                Map.of("title", "央行：保持流动性合理充裕", "time", "昨日", "source", "央行官网"),
                Map.of("title", "多家券商看好后市行情", "time", "昨日", "source", "证券日报")
            );

            if (stockCode != null && !stockCode.isEmpty()) {
                news = List.of(
                    Map.of("title", "相关股票新闻动态", "time", "今日", "source", "财经网")
                );
            }

            return toJson(Map.of("news", news));
        } catch (Exception e) {
            return handleError(e, "get_stock_news");
        }
    }

    /**
     * 股票代码标准化
     */
    private String normalizeStockCode(String code) {
        if (code == null || code.isEmpty()) {
            return "sh000001"; // 默认返回上证指数
        }

        // 如果已经是标准格式，直接返回
        if (code.startsWith("sh") || code.startsWith("sz")) {
            return code;
        }

        // 6位数字代码
        if (code.matches("\\d{6}")) {
            if (code.startsWith("6")) {
                return "sh" + code;
            } else {
                return "sz" + code;
            }
        }

        return code;
    }

    /**
     * 获取股票数据
     */
    private String fetchStockData(String stockCode) {
        try {
            String url = "https://hq.sinajs.cn/list=" + stockCode;

            WebClient client = webClientBuilder
                    .baseUrl(url)
                    .defaultHeader("Referer", "https://finance.sina.com.cn/")
                    .build();

            String response = client.get()
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (response != null && response.contains("=")) {
                String data = response.substring(response.indexOf("=") + 1);
                data = data.replace("\"", "").replace(";", "");

                String[] parts = data.split(",");
                if (parts.length >= 32) {
                    String name = parts[0];
                    String open = parts[1];
                    String close = parts[2];
                    String current = parts[3];
                    String high = parts[4];
                    String low = parts[5];
                    String volume = parts[8];

                    // 计算涨跌幅
                    double currentPrice = parseDoubleSafe(current);
                    double closePrice = parseDoubleSafe(close);
                    double change = 0;
                    if (closePrice > 0) {
                        change = ((currentPrice - closePrice) / closePrice) * 100;
                    }

                    Map<String, Object> result = new HashMap<>();
                    result.put("name", name);
                    result.put("code", stockCode);
                    result.put("currentPrice", currentPrice);
                    result.put("changePercent", String.format("%.2f%%", change));
                    result.put("open", open);
                    result.put("close", close);
                    result.put("high", high);
                    result.put("low", low);
                    result.put("volume", formatVolume(parseDoubleSafe(volume)));

                    return toJson(result);
                }
            }
        } catch (Exception e) {
            log.error("获取股票数据失败: {}", stockCode, e);
        }
        return null;
    }

    private double parseDoubleSafe(String value) {
        try {
            return value != null && !value.isEmpty() ? Double.parseDouble(value) : 0;
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private String formatVolume(double volume) {
        if (volume >= 100000000) {
            return String.format("%.2f亿", volume / 100000000);
        } else if (volume >= 10000) {
            return String.format("%.2f万", volume / 10000);
        }
        return String.format("%.0f", volume);
    }
}
