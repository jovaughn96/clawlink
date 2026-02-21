"use client";

import React, { useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Check, Copy, Terminal } from "lucide-react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label="Copy code"
    >
      {copied ? (
        <>
          <Check className="size-3" />
          copied
        </>
      ) : (
        <>
          <Copy className="size-3" />
          copy
        </>
      )}
    </button>
  );
}

const components: Components = {
  // Fenced code blocks
  pre({ children }) {
    return <>{children}</>;
  },

  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const lang = match?.[1];
    const codeString = String(children).replace(/\n$/, "");

    // Inline code (no language class, short content, no newlines)
    const isInline = !className && !String(children).includes("\n");
    if (isInline) {
      return (
        <code
          className="rounded bg-accent px-1.5 py-0.5 font-mono text-[0.85em] text-primary"
          {...props}
        >
          {children}
        </code>
      );
    }

    // Fenced code block
    return (
      <div className="group my-3 overflow-hidden rounded-md border border-border bg-background">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-border bg-accent/30 px-3 py-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
            <Terminal className="size-3" />
            {lang || "code"}
          </div>
          <CopyButton text={codeString} />
        </div>
        {/* Code content */}
        <pre className="overflow-x-auto p-3">
          <code
            className={cn(
              "block font-mono text-xs leading-relaxed text-foreground/90",
              className
            )}
            {...props}
          >
            {children}
          </code>
        </pre>
      </div>
    );
  },

  // Headings
  h1({ children }) {
    return (
      <h1 className="mt-4 mb-2 font-display text-xl font-bold text-foreground">
        {children}
      </h1>
    );
  },
  h2({ children }) {
    return (
      <h2 className="mt-3 mb-2 font-display text-lg font-bold text-foreground">
        {children}
      </h2>
    );
  },
  h3({ children }) {
    return (
      <h3 className="mt-3 mb-1 font-display text-base font-semibold text-foreground">
        {children}
      </h3>
    );
  },

  // Paragraphs
  p({ children }) {
    return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
  },

  // Lists
  ul({ children }) {
    return <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>;
  },
  ol({ children }) {
    return (
      <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>
    );
  },
  li({ children }) {
    return <li className="leading-relaxed">{children}</li>;
  },

  // Bold / italic
  strong({ children }) {
    return <strong className="font-bold text-foreground">{children}</strong>;
  },
  em({ children }) {
    return <em className="italic text-foreground/80">{children}</em>;
  },

  // Links
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:text-primary/80"
      >
        {children}
      </a>
    );
  },

  // Blockquotes
  blockquote({ children }) {
    return (
      <blockquote className="my-2 border-l-2 border-primary/50 pl-3 text-muted-foreground italic">
        {children}
      </blockquote>
    );
  },

  // Horizontal rule
  hr() {
    return <hr className="my-3 border-border" />;
  },

  // Tables
  table({ children }) {
    return (
      <div className="my-3 overflow-x-auto rounded-md border border-border">
        <table className="w-full text-xs">{children}</table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="bg-accent/30">{children}</thead>;
  },
  th({ children }) {
    return (
      <th className="border-b border-border px-3 py-1.5 text-left font-semibold text-foreground">
        {children}
      </th>
    );
  },
  td({ children }) {
    return (
      <td className="border-b border-border/50 px-3 py-1.5 text-muted-foreground">
        {children}
      </td>
    );
  },
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("text-sm text-foreground/90", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
