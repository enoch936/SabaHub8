import { api, unwrapResponse } from "./client";

export type AIChatResponse = {
  answer?: string;
  message?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
};

export async function aiChatbotAssist(input: {
  prompt: string;
  contextType?: string;
  contextId?: string;
}) {
  const response = await api.post("/ai/chatbot/assist", input);
  return unwrapResponse(response, "Unable to get AI response") as AIChatResponse;
}
