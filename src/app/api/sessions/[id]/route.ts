import { NextRequest, NextResponse } from "next/server";
import { rpcCall } from "@/lib/gateway-rpc";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await rpcCall("sessions.history", { sessionId: id });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 502 }
    );
  }
}
