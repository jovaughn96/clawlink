import { NextResponse } from "next/server";
import { gatewayConnect } from "@/lib/gateway-rpc";

export async function GET() {
  try {
    const helloOk = await gatewayConnect();
    const snapshot = helloOk.snapshot;

    const presence = snapshot?.presence ?? [];
    const health = snapshot?.health;
    const agents = Array.isArray(health?.agents) ? health.agents : [];
    const mainAgent = agents[0];

    return NextResponse.json({
      presence,
      activeSessions: health?.sessions?.count ?? mainAgent?.sessions?.count ?? 0,
      recentSessions: health?.sessions?.recent ?? mainAgent?.sessions?.recent ?? [],
      connectedDevices: Array.isArray(presence)
        ? presence.filter(
            (p) => (p as Record<string, unknown>).reason !== "disconnect"
          ).length
        : 0,
      health: {
        ok: health?.ok,
        channels: health?.channelOrder,
      },
      defaultAgent: health?.defaultAgentId,
      uptime: snapshot?.uptimeMs,
      authMode: snapshot?.authMode,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 502 }
    );
  }
}
