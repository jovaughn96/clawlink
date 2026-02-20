"use client";

import useSWR from "swr";
import { StatCard, StatsGrid } from "@/components/stats-cards";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const { data: stats, isLoading } = useSWR("/api/stats", fetcher, {
    refreshInterval: 15000,
  });

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-lg font-semibold">Overview</h1>

      {isLoading && (
        <p className="text-muted-foreground">Loading stats...</p>
      )}

      {stats && !stats.error && (
        <StatsGrid>
          <StatCard
            title="Active Sessions"
            value={stats.sessions?.active ?? stats.activeSessions ?? 0}
          />
          <StatCard
            title="Connected Devices"
            value={stats.clients?.length ?? stats.connectedDevices ?? 0}
          />
          <StatCard
            title="Tokens In"
            value={
              (stats.tokens?.in ?? stats.tokensIn ?? 0).toLocaleString()
            }
          />
          <StatCard
            title="Tokens Out"
            value={
              (stats.tokens?.out ?? stats.tokensOut ?? 0).toLocaleString()
            }
          />
        </StatsGrid>
      )}

      {stats?.error && (
        <p className="text-destructive">
          Failed to load stats: {stats.error}
        </p>
      )}
    </div>
  );
}
