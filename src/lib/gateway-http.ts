import { env } from "@/lib/env";

const GATEWAY_URL = env.OPENCLAW_GATEWAY_URL;
const GATEWAY_TOKEN = env.OPENCLAW_GATEWAY_TOKEN;

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function chatCompletion(
  messages: ChatMessage[],
  agentId?: string,
  user?: string,
  sessionKey?: string
): Promise<Response> {
  const body: Record<string, unknown> = {
    model: "openclaw",
    messages,
    stream: true,
  };
  if (agentId) {
    body.agent_id = agentId;
  }
  if (user) {
    body.user = user;
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${GATEWAY_TOKEN}`,
  };
  if (sessionKey) {
    headers["x-openclaw-session-key"] = sessionKey;
  }

  return fetch(`${GATEWAY_URL}/v1/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}
