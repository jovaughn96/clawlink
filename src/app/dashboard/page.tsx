"use client";

import useSWR from "swr";
import { Activity, Monitor, Clock, Bot } from "lucide-react";
import { StatCard, StatsGrid } from "@/components/stats-cards";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatUptime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m`;
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useSWR("/api/stats", fetcher, {
    refreshInterval: 15000,
  });

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Overview
      </h1>

      {isLoading && (
        <p className="font-mono text-sm text-muted-foreground">
          {"// loading stats..."}
        </p>
      )}

      {stats && !stats.error && (
        <StatsGrid>
          <StatCard
            title="Sessions"
            value={stats.activeSessions ?? 0}
            icon={Activity}
          />
          <StatCard
            title="Connected Devices"
            value={stats.connectedDevices ?? 0}
            icon={Monitor}
          />
          <StatCard
            title="Uptime"
            value={stats.uptime ? formatUptime(stats.uptime) : "N/A"}
            icon={Clock}
          />
          <StatCard
            title="Default Agent"
            value={stats.defaultAgent ?? "N/A"}
            icon={Bot}
          />
        </StatsGrid>
      )}

      {stats?.error && (
        <p className="font-mono text-sm text-destructive">
          Failed to load stats: {stats.error}
        </p>
      )}
    </div>
  );
}
