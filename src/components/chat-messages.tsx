"use client";

import { cn } from "@/lib/utils";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessages({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Send a message to start chatting
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={cn(
            "max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap",
            msg.role === "user"
              ? "ml-auto bg-primary text-primary-foreground"
              : "mr-auto bg-muted"
          )}
        >
          {msg.content}
        </div>
      ))}
    </div>
  );
}
