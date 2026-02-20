import WebSocket from "ws";

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL!;
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN!;

interface RpcResponse {
  id: string;
  result?: unknown;
  error?: { code: number; message: string };
}

export async function rpcCall(
  method: string,
  params: Record<string, unknown> = {}
): Promise<unknown> {
  const wsUrl = GATEWAY_URL.replace(/^https/, "wss").replace(/^http/, "ws");

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("RPC timeout"));
    }, 15000);

    let authenticated = false;

    ws.on("open", () => {
      // Send connect handshake
      ws.send(
        JSON.stringify({
          jsonrpc: "2.0",
          method: "connect",
          params: {
            token: GATEWAY_TOKEN,
            role: "operator",
            client: "clawlink-web",
          },
          id: "auth-1",
        })
      );
    });

    ws.on("message", (data: WebSocket.Data) => {
      const msg = JSON.parse(data.toString());

      // Handle challenge-based auth
      if (msg.method === "challenge") {
        ws.send(
          JSON.stringify({
            jsonrpc: "2.0",
            method: "authenticate",
            params: {
              token: GATEWAY_TOKEN,
            },
            id: "auth-2",
          })
        );
        return;
      }

      // Handle hello/connect ack
      if (msg.id === "auth-1" || msg.id === "auth-2") {
        if (msg.error) {
          clearTimeout(timeout);
          ws.close();
          reject(new Error(`Auth failed: ${msg.error.message}`));
          return;
        }
        authenticated = true;
        // Now send the actual RPC request
        ws.send(
          JSON.stringify({
            jsonrpc: "2.0",
            method,
            params,
            id: "rpc-1",
          })
        );
        return;
      }

      // Handle RPC response
      if (msg.id === "rpc-1") {
        clearTimeout(timeout);
        ws.close();
        const rpcMsg = msg as RpcResponse;
        if (rpcMsg.error) {
          reject(new Error(rpcMsg.error.message));
        } else {
          resolve(rpcMsg.result);
        }
        return;
      }

      // Ignore notifications / other messages
      if (!authenticated && !msg.id) {
        // Server might send a welcome message, ignore
      }
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    ws.on("close", () => {
      clearTimeout(timeout);
    });
  });
}
