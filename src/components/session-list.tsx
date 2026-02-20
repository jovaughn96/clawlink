"use client";

import useSWR from "swr";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Session {
  id: string;
  key?: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  updatedAt?: string;
  createdAt?: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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
        <Link key={session.id} href={`/dashboard/sessions/${session.id}`}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {session.key || session.id}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-xs text-muted-foreground">
                {session.model && <span>Model: {session.model}</span>}
                {session.tokensIn != null && (
                  <span>In: {session.tokensIn.toLocaleString()}</span>
                )}
                {session.tokensOut != null && (
                  <span>Out: {session.tokensOut.toLocaleString()}</span>
                )}
                {(session.updatedAt || session.createdAt) && (
                  <span>
                    {new Date(
                      session.updatedAt || session.createdAt!
                    ).toLocaleString()}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
