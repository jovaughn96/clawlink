"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ChatMessages, Message } from "@/components/chat-messages";
import { ChatInput } from "@/components/chat-input";
import { useSession } from "@/components/session-context";

const CHAT_USER_STORAGE_KEY = "clawlink:chat:user";
const POLL_INTERVAL_MS = 5000;

function getOrCreateChatUser(): string {
  const existing = window.localStorage.getItem(CHAT_USER_STORAGE_KEY);
  if (existing && existing.trim().length > 0) {
    return existing;
  }

  const created = `clawlink-${crypto.randomUUID()}`;
  window.localStorage.setItem(CHAT_USER_STORAGE_KEY, created);
  return created;
}

interface RawMessage {
  role: string;
  content: string;
  tools?: { action: string; result: string }[];
}

function mapApiMessages(data: RawMessage[]): Message[] {
  return data
    .filter(
      (m) =>
        m.role === "user" ||
        m.role === "assistant" ||
        m.role === "tool_group"
    )
    .map((m) => ({
      role: m.role as "user" | "assistant" | "tool_group",
      content: m.content,
      ...(m.tools ? { tools: m.tools } : {}),
    }));
}

export default function ChatPage() {
  const { activeSessionKey } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [chatUser, setChatUser] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const prevSessionRef = useRef<string | null>(null);
  const streamingRef = useRef(false);

  // Keep streamingRef in sync so the poll interval can check it
  useEffect(() => {
    streamingRef.current = streaming;
  }, [streaming]);

  // Initialize chat user
  useEffect(() => {
    setChatUser(getOrCreateChatUser());
  }, []);

  // Fetch transcript for a given session key
  const fetchTranscript = useCallback(
    async (key: string, signal?: AbortSignal): Promise<Message[] | null> => {
      try {
        const res = await fetch(
          `/api/sessions/${encodeURIComponent(key)}`,
          signal ? { signal } : undefined
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (!Array.isArray(data)) return null;
        return mapApiMessages(data);
      } catch {
        return null;
      }
    },
    []
  );

  // Load transcript on session change + set up polling
  useEffect(() => {
    // Initial load when session changes
    if (activeSessionKey === prevSessionRef.current) return;
    prevSessionRef.current = activeSessionKey;

    if (activeSessionKey === null) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setLoadingSession(true);

    fetchTranscript(activeSessionKey, controller.signal).then((result) => {
      if (cancelled) return;
      if (result) {
        setMessages(result);
      } else {
        setMessages([
          {
            role: "assistant",
            content: "Error: Failed to load session transcript.",
          },
        ]);
      }
      setLoadingSession(false);
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [activeSessionKey, fetchTranscript]);

  // Poll for updates while a session is active
  useEffect(() => {
    if (!activeSessionKey) return;

    const interval = setInterval(async () => {
      // Don't poll while we're streaming a response locally
      if (streamingRef.current) return;

      const result = await fetchTranscript(activeSessionKey);
      if (result && result.length > 0) {
        setMessages((prev) => {
          // Only update if the message count changed (avoids flicker)
          if (result.length !== prev.length) return result;
          // Also check if the last message content differs
          const lastNew = result[result.length - 1];
          const lastOld = prev[prev.length - 1];
          if (lastNew?.content !== lastOld?.content) return result;
          return prev;
        });
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [activeSessionKey, fetchTranscript]);

  const handleSend = useCallback(
    async (text: string) => {
      const userMsg: Message = { role: "user", content: text };
      const updated = [...messages, userMsg];
      setMessages(updated);
      setStreaming(true);

      const assistantMsg: Message = { role: "assistant", content: "" };
      setMessages([...updated, assistantMsg]);

      try {
        abortRef.current = new AbortController();
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updated
              .filter((m) => m.role === "user" || m.role === "assistant")
              .map((m) => ({
                role: m.role,
                content: m.content,
              })),
            user: chatUser,
            sessionKey: activeSessionKey,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          throw new Error(`Chat failed: ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let accumulated = "";
        let sseBuffer = "";
        let receivedDone = false;

        while (!receivedDone) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          sseBuffer = sseBuffer.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

          let boundaryIndex = sseBuffer.indexOf("\n\n");
          while (boundaryIndex !== -1) {
            const rawEvent = sseBuffer.slice(0, boundaryIndex);
            sseBuffer = sseBuffer.slice(boundaryIndex + 2);

            const dataLines: string[] = [];
            for (const line of rawEvent.split("\n")) {
              if (!line.startsWith("data:")) continue;
              const value = line.slice(5);
              dataLines.push(value.startsWith(" ") ? value.slice(1) : value);
            }

            if (dataLines.length === 0) {
              boundaryIndex = sseBuffer.indexOf("\n\n");
              continue;
            }

            const data = dataLines.join("\n");
            if (data === "[DONE]") {
              receivedDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (!delta) {
                boundaryIndex = sseBuffer.indexOf("\n\n");
                continue;
              }

              accumulated += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: accumulated,
                };
                return copy;
              });
            } catch {
              // skip malformed SSE data payloads
            }

            boundaryIndex = sseBuffer.indexOf("\n\n");
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = {
              role: "assistant",
              content: `Error: ${(err as Error).message}`,
            };
            return copy;
          });
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, chatUser, activeSessionKey]
  );

  return (
    <div className="flex h-full flex-col">
      {loadingSession ? (
        <div className="flex flex-1 items-center justify-center">
          <span className="font-mono text-sm text-muted-foreground">
            {"// loading session..."}
          </span>
        </div>
      ) : (
        <ChatMessages messages={messages} streaming={streaming} />
      )}
      <ChatInput
        onSend={handleSend}
        disabled={streaming || !chatUser || loadingSession}
      />
    </div>
  );
}
