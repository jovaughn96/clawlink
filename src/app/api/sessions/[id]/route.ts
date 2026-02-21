import { NextRequest, NextResponse } from "next/server";
import { rpcCall } from "@/lib/gateway-rpc";

interface PreviewItem {
  role: string;
  text: string;
}

interface PreviewEntry {
  key: string;
  status: string;
  items: PreviewItem[];
}

interface ToolCall {
  action: string;
  result: string;
}

interface ParsedMessage {
  role: "user" | "assistant" | "tool_group";
  content: string;
  tools?: ToolCall[];
}

/**
 * Extract the actual user message from the gateway's bundled format.
 *
 * The gateway bundles context like:
 *   [Chat messages since your last reply - for context]
 *   Assistant: [[reply_to_current]]...
 *   [Current message - respond to this]
 *   User: actual message
 *
 * We extract only the text after the last "User: " in the
 * "[Current message - respond to this]" section.
 */
function extractUserMessage(text: string): string {
  const currentMarker = "[Current message - respond to this]";
  const idx = text.indexOf(currentMarker);
  if (idx !== -1) {
    const after = text.slice(idx + currentMarker.length).trim();
    // Strip the "User: " prefix if present
    const userPrefix = /^User:\s*/i;
    return after.replace(userPrefix, "").trim();
  }
  // No bundled format — return as-is
  return text;
}

/**
 * Strip the [[reply_to_current]] prefix from assistant text.
 */
function cleanAssistantText(text: string): string {
  return text.replace(/^\[\[reply_to_current\]\]\s*/i, "");
}

/**
 * Parse raw gateway preview items into clean separated messages.
 * Groups consecutive tool items into tool_group messages.
 */
function parsePreviewItems(items: PreviewItem[]): ParsedMessage[] {
  const messages: ParsedMessage[] = [];
  let i = 0;

  while (i < items.length) {
    const item = items[i];

    if (item.role === "user") {
      messages.push({
        role: "user",
        content: extractUserMessage(item.text),
      });
      i++;
    } else if (item.role === "assistant") {
      messages.push({
        role: "assistant",
        content: cleanAssistantText(item.text),
      });
      i++;
    } else if (item.role === "tool") {
      // Group consecutive tool items into call/result pairs
      const tools: ToolCall[] = [];
      while (i < items.length && items[i].role === "tool") {
        const text = items[i].text;
        // "call read", "call write", "call edit", "call exec" etc.
        const callMatch = text.match(/^call\s+(\w+)$/);
        if (callMatch) {
          const action = callMatch[1];
          // Next item (if tool) is the result
          const hasResult =
            i + 1 < items.length && items[i + 1].role === "tool";
          const resultItem = hasResult ? items[i + 1] : null;

          // Skip results that are just large file dumps (noisy)
          const resultText = resultItem?.text ?? "";
          tools.push({ action, result: resultText });
          i += hasResult ? 2 : 1;
        } else {
          // Standalone tool output without a preceding "call" — treat as result
          tools.push({ action: "output", result: text });
          i++;
        }
      }
      if (tools.length > 0) {
        messages.push({
          role: "tool_group",
          content: "",
          tools,
        });
      }
    } else {
      // Unknown role — skip
      i++;
    }
  }

  return messages;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = (await rpcCall("sessions.preview", {
      keys: [id],
      limit: 50,
      maxChars: 5000,
    })) as { previews: PreviewEntry[] };

    const preview = result.previews?.[0];
    if (!preview || preview.status === "missing") {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const messages = parsePreviewItems(preview.items);
    return NextResponse.json(messages);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 502 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Try known RPC method names — gateways vary on the exact name
  const methods = ["sessions.destroy", "session.destroy", "sessions.delete"];

  for (const method of methods) {
    try {
      await rpcCall(method, { key: id });
      return NextResponse.json({ ok: true });
    } catch (err) {
      const msg = (err as Error).message ?? "";
      // If the error is about an unknown method, try the next one
      if (
        msg.includes("unknown") ||
        msg.includes("not found") ||
        msg.includes("unsupported") ||
        msg.includes("no such")
      ) {
        continue;
      }
      // Any other error (auth, timeout, etc.) — bail immediately
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  return NextResponse.json(
    { error: "Gateway does not support session deletion" },
    { status: 501 }
  );
}
