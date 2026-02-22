"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, SendHorizonal } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const toDataUrl = (blob: Blob) =>
      new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ""));
        r.onerror = reject;
        r.readAsDataURL(blob);
      });

    const img = await createImageBitmap(file);
    const max = 1280;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, w, h);

    const compressedBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.72)
    );

    if (!compressedBlob) return;
    const dataUrl = await toDataUrl(compressedBlob);

    const caption = value.trim();
    const content = `${caption ? `${caption}\n\n` : ""}![uploaded image](${dataUrl})`;
    onSend(content);
    setValue("");
    if (fileRef.current) fileRef.current.value = "";
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
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <Button
        type="button"
        size="icon"
        disabled={disabled}
        className="size-11 shrink-0"
        onClick={() => fileRef.current?.click()}
      >
        <ImagePlus className="size-5" />
      </Button>
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
