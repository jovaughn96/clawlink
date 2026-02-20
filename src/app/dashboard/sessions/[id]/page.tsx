"use client";

import { use } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TranscriptMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, error, isLoading } = useSWR<TranscriptMessage[] | { error: string }>(
    `/api/sessions/${id}`,
    fetcher
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Link href="/dashboard/sessions">
          <Button variant="ghost" size="sm">
            &larr; Back
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">Session {id.slice(0, 8)}...</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <p className="text-muted-foreground">Loading transcript...</p>
        )}
        {error && <p className="text-destructive">Failed to load transcript</p>}
        {data && "error" in data && (
          <p className="text-destructive">{data.error}</p>
        )}
        {data && Array.isArray(data) && (
          <div className="flex flex-col gap-4">
            {data.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap",
                  msg.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : msg.role === "system"
                    ? "mr-auto bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100"
                    : "mr-auto bg-muted"
                )}
              >
                <div className="mb-1 text-xs font-medium opacity-70">
                  {msg.role}
                  {msg.timestamp && (
                    <span className="ml-2">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                {msg.content}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
