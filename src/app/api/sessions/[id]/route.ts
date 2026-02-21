import { NextRequest, NextResponse } from "next/server";
import { rpcCall } from "@/lib/gateway-rpc";

interface PreviewItem {
  role: string;
  text: string;
}

interface PreviewEntry {
  key: string;
  status: string;
  items: PreviewItem[];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = (await rpcCall("sessions.preview", {
      keys: [id],
      limit: 50,
      maxChars: 2000,
    })) as { previews: PreviewEntry[] };

    const preview = result.previews?.[0];
    if (!preview || preview.status === "missing") {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Transform { role, text } items into the format the frontend expects
    const messages = preview.items.map((item) => ({
      role: item.role,
      content: item.text,
    }));

    return NextResponse.json(messages);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 502 }
    );
  }
}
