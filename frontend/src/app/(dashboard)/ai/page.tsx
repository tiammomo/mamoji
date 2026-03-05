"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { aiApi } from "@/lib/api";
import { Send, MessageCircle, TrendingUp, Wallet, Loader2 } from "lucide-react";

type AssistantType = "finance" | "stock";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const assistantConfig = {
  finance: {
    name: "财务助手",
    icon: Wallet,
    description: "分析您的收支情况",
    welcomeMessage: "您好！我是您的财务智能助手。我可以帮助您分析收支情况、查看预算执行进度、解答财务相关问题。请问有什么可以帮您的？",
    quickQuestions: [
      "我这个月支出情况怎么样？",
      "我的预算执行情况如何？",
      "哪个类别支出最多？",
      "给我一些理财建议",
    ],
  },
  stock: {
    name: "股票助手",
    icon: TrendingUp,
    description: "分析股票趋势和建议",
    welcomeMessage: "您好！我是您的股票智能助手。我可以为您提供股票行情分析、投资建议和市场趋势解读。请问有什么可以帮您的？（注：股市有风险，投资需谨慎）",
    quickQuestions: [
      "大盘今天怎么样？",
      "推荐几只消费股",
      "新能源板块前景如何？",
      "如何分散投资风险？",
    ],
  },
};

export default function AIPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [assistantType, setAssistantType] = useState<AssistantType>("finance");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConfig = assistantConfig[assistantType];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // 添加欢迎消息
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: currentConfig.welcomeMessage,
        timestamp: new Date(),
      },
    ]);
  }, [router, assistantType, currentConfig.welcomeMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (message?: string) => {
    const userMessage = message || input.trim();
    if (!userMessage || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await aiApi.chat(userMessage, assistantType);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "抱歉，我暂时无法回答您的问题。请稍后再试。",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAssistantChange = (type: AssistantType) => {
    setAssistantType(type);
    setMessages([]);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <MessageCircle className="w-7 h-7 text-indigo-600" />
          AI 助手
        </h1>
        <p className="text-gray-500 mt-1">智能分析助手</p>
      </div>

      {/* Assistant Type Selector */}
      <div className="flex gap-3 mb-6">
        {(Object.keys(assistantConfig) as AssistantType[]).map((type) => {
          const config = assistantConfig[type];
          const Icon = config.icon;
          return (
            <button
              key={type}
              onClick={() => handleAssistantChange(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                assistantType === type
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{config.name}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-2xl shadow-sm border flex flex-col h-[calc(100vh-18rem)]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.role === "user" ? "text-indigo-200" : "text-gray-400"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                  <span className="text-gray-500">思考中...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length <= 1 && (
          <div className="px-6 pb-4">
            <p className="text-sm text-gray-500 mb-2">试试这样问：</p>
            <div className="flex flex-wrap gap-2">
              {currentConfig.quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`问${currentConfig.name}...`}
              className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">发送</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
