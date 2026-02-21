"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SendHorizonal } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-t border-border p-3 sm:p-4"
      style={{ paddingBottom: `max(0.75rem, env(safe-area-inset-bottom))` }}
    >
      <span className="select-none font-mono text-base font-bold text-primary">
        {">"}
      </span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="type a message..."
        disabled={disabled}
        autoFocus
        className="flex-1 bg-transparent font-mono text-base text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled || !value.trim()}
        className="size-11 shrink-0"
      >
        <SendHorizonal className="size-5" />
      </Button>
    </form>
  );
}
