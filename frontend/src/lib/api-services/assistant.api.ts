import { api } from "../api.client";
import type { AIChatResponse } from "../api.types";

export const aiApi = {
  chat: (message: string, assistantType?: string) => api.post<AIChatResponse>("/ai/chat", { message, assistantType }),
};
