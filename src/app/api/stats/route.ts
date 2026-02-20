import { NextResponse } from "next/server";
import { rpcCall } from "@/lib/gateway-rpc";

export async function GET() {
  try {
    const presence = await rpcCall("system-presence", {});
    return NextResponse.json(presence);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 502 }
    );
  }
}
