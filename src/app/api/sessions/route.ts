import { NextResponse } from "next/server";
import { rpcCall } from "@/lib/gateway-rpc";

export async function GET() {
  try {
    const result = await rpcCall("sessions.list", {});
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 502 }
    );
  }
}
