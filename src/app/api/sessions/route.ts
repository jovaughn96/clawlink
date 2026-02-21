import { NextResponse } from "next/server";
import { gatewayConnect } from "@/lib/gateway-rpc";

export async function GET() {
  try {
    const helloOk = await gatewayConnect();
    const health = helloOk.snapshot?.health;
    const agents = Array.isArray(health?.agents) ? health.agents : [];
    const mainAgent = agents[0];

    const sessions = health?.sessions?.recent ?? mainAgent?.sessions?.recent ?? [];

    return NextResponse.json(sessions);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 502 }
    );
  }
}
