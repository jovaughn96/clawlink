"use client";

import useSWR from "swr";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Session {
  key: string;
  updatedAt?: number;
  age?: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatAge(ageMs: number): string {
  const seconds = Math.floor(ageMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function sessionLabel(key: string): string {
  // "agent:main:openai:uuid" → show a shortened version
  const parts = key.split(":");
  if (parts.length >= 4) {
    const uuid = parts[3];
    return `${parts[1]} / ${uuid.slice(0, 8)}`;
  }
  return key;
}

export function SessionList() {
  const { data, error, isLoading } = useSWR<Session[]>("/api/sessions", fetcher, {
    refreshInterval: 30000,
  });

  if (isLoading) {
    return <div className="p-4 text-muted-foreground">Loading sessions...</div>;
  }

  if (error) {
    return <div className="p-4 text-destructive">Failed to load sessions</div>;
  }

  const sessions = Array.isArray(data) ? data : [];

  if (sessions.length === 0) {
    return <div className="p-4 text-muted-foreground">No sessions found</div>;
  }

  return (
    <div className="grid gap-3 p-4">
      {sessions.map((session) => (
        <Link
          key={session.key}
          href={`/dashboard/sessions/${encodeURIComponent(session.key)}`}
        >
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium font-mono">
                {sessionLabel(session.key)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-xs text-muted-foreground">
                {session.updatedAt && (
                  <span>
                    Updated: {new Date(session.updatedAt).toLocaleString()}
                  </span>
                )}
                {session.age != null && (
                  <span>{formatAge(session.age)}</span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
