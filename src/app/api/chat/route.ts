import { NextRequest } from "next/server";
import { chatCompletion } from "@/lib/gateway-http";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { messages, agentId, user } = await req.json();

  const upstream = await chatCompletion(messages, agentId, user);

  if (!upstream.ok) {
    const text = await upstream.text();
    return new Response(text, { status: upstream.status });
  }

  // Pipe the SSE stream through as raw bytes
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
