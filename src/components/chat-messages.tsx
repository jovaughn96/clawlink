"use client";

import { useEffect, useRef, useState } from "react";
import { FadeInUp } from "@/components/motion-primitives";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { cn } from "@/lib/utils";
import { ChevronRight, Wrench } from "lucide-react";

export interface ToolCall {
  action: string;
  result: string;
}

export interface Message {
  role: "user" | "assistant" | "tool_group";
  content: string;
  tools?: ToolCall[];
}

interface ChatMessagesProps {
  messages: Message[];
  streaming?: boolean;
}

function ToolGroup({ tools }: { tools: ToolCall[] }) {
  const [open, setOpen] = useState(false);

  // Summary: "read, edit, exec" etc.
  const actions = tools.map((t) => t.action);
  const uniqueActions = [...new Set(actions)];
  const summary = uniqueActions.join(", ");

  return (
    <div className="my-2 rounded-md border border-border/60 bg-card/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-mono text-muted-foreground hover:text-foreground transition-colors min-h-[36px]"
      >
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 transition-transform",
            open && "rotate-90"
          )}
        />
        <Wrench className="size-3 shrink-0 opacity-50" />
        <span>
          {tools.length} tool {tools.length === 1 ? "call" : "calls"}
          <span className="ml-1.5 text-muted-foreground/60">
            ({summary})
          </span>
        </span>
      </button>

      {open && (
        <div className="border-t border-border/40 px-3 py-2 space-y-2">
          {tools.map((tool, j) => (
            <div key={j} className="text-xs font-mono">
              <div className="flex items-center gap-1.5 text-claw-cyan mb-1">
                <span className="font-semibold">$ {tool.action}</span>
              </div>
              {tool.result && (
                <pre className="overflow-x-auto rounded bg-background/80 p-2 text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap break-words max-h-48 scroll-contain">
                  {tool.result.length > 1500
                    ? tool.result.slice(0, 1500) + "\n... (truncated)"
                    : tool.result}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChatMessages({ messages, streaming }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center pb-safe">
        <span className="font-mono text-sm text-primary/60">
          {"// awaiting input..."}
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 scroll-contain p-4 pb-safe">
      <div className="mx-auto max-w-3xl space-y-4">
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          const isAssistant = msg.role === "assistant";
          const isToolGroup = msg.role === "tool_group";
          const isLast = i === messages.length - 1;
          const showCursor = streaming && isAssistant && isLast;

          if (isToolGroup && msg.tools) {
            return (
              <FadeInUp key={i} delay={0}>
                <ToolGroup tools={msg.tools} />
              </FadeInUp>
            );
          }

          return (
            <FadeInUp key={i} delay={0}>
              {isUser ? (
                /* User messages — terminal-style plain text */
                <div className="font-mono text-sm leading-relaxed break-words whitespace-pre-wrap">
                  <span className="select-none font-bold mr-2 text-primary">
                    {">"}
                  </span>
                  <span className="text-foreground/90">{msg.content}</span>
                </div>
              ) : (
                /* Assistant messages — rendered markdown */
                <div className="group">
                  <div className="flex items-start gap-2">
                    <span className="select-none font-mono font-bold text-sm text-claw-cyan mt-0.5">
                      {"#"}
                    </span>
                    <div className={cn("min-w-0 flex-1", showCursor && "streaming-msg")}>
                      <MarkdownRenderer content={msg.content} />
                      {showCursor && (
                        <span className="ml-0.5 inline-block w-2 h-4 bg-claw-cyan align-text-bottom animate-cursor-blink" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </FadeInUp>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
