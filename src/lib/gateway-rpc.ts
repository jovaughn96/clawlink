import WebSocket from "ws";
import { env } from "@/lib/env";

const GATEWAY_URL = env.OPENCLAW_GATEWAY_URL;
const GATEWAY_TOKEN = env.OPENCLAW_GATEWAY_TOKEN;

const PROTOCOL_VERSION = 3;

interface GatewayFrame {
  type: "req" | "res" | "event";
  id?: string;
  method?: string;
  event?: string;
  ok?: boolean;
  payload?: unknown;
  error?: { code: string; message: string };
  params?: unknown;
}

interface HelloOkPayload {
  type: "hello-ok";
  protocol: number;
  snapshot?: {
    presence?: unknown[];
    health?: {
      sessions?: { count?: number; recent?: unknown[] };
      agents?: { agentId: string; sessions?: { count?: number; recent?: unknown[] } }[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Connect to the gateway, authenticate with password, and return the
 * hello-ok payload (which contains snapshot data for presence, health, sessions).
 */
export async function gatewayConnect(): Promise<HelloOkPayload> {
  const wsUrl = GATEWAY_URL.replace(/^https/, "wss").replace(/^http/, "ws");

  return new Promise((resolve, reject) => {
    const originUrl = GATEWAY_URL.replace(/^wss/, "https").replace(/^ws/, "http");
    const ws = new WebSocket(wsUrl, { headers: { Origin: originUrl } });
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Gateway connect timeout"));
    }, 15000);

    ws.on("open", () => {
      // Wait for challenge event before sending connect
    });

    ws.on("message", (data: WebSocket.Data) => {
      const msg: GatewayFrame = JSON.parse(data.toString());

      // Handle challenge event → send connect request
      if (msg.type === "event" && msg.event === "connect.challenge") {
        ws.send(
          JSON.stringify({
            type: "req",
            id: "connect-1",
            method: "connect",
            params: {
              minProtocol: PROTOCOL_VERSION,
              maxProtocol: PROTOCOL_VERSION,
              client: {
                id: "openclaw-control-ui",
                version: "1.0.0",
                platform: "web",
                mode: "ui",
              },
              caps: [],
              auth: { password: GATEWAY_TOKEN },
              role: "operator",
              scopes: ["operator.admin", "operator.read"],
            },
          })
        );
        return;
      }

      // Handle connect response
      if (msg.type === "res" && msg.id === "connect-1") {
        clearTimeout(timeout);
        ws.close();
        if (!msg.ok) {
          reject(
            new Error(
              `Gateway connect failed: ${msg.error?.message ?? "unknown error"}`
            )
          );
          return;
        }
        resolve(msg.payload as HelloOkPayload);
        return;
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

/**
 * Connect, authenticate, send a single RPC request, and return the result.
 */
export async function rpcCall(
  method: string,
  params: Record<string, unknown> = {}
): Promise<unknown> {
  const wsUrl = GATEWAY_URL.replace(/^https/, "wss").replace(/^http/, "ws");

  return new Promise((resolve, reject) => {
    const originUrl = GATEWAY_URL.replace(/^wss/, "https").replace(/^ws/, "http");
    const ws = new WebSocket(wsUrl, { headers: { Origin: originUrl } });
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("RPC timeout"));
    }, 15000);

    let authenticated = false;

    ws.on("message", (data: WebSocket.Data) => {
      const msg: GatewayFrame = JSON.parse(data.toString());

      // Handle challenge → send connect
      if (msg.type === "event" && msg.event === "connect.challenge") {
        ws.send(
          JSON.stringify({
            type: "req",
            id: "connect-1",
            method: "connect",
            params: {
              minProtocol: PROTOCOL_VERSION,
              maxProtocol: PROTOCOL_VERSION,
              client: {
                id: "openclaw-control-ui",
                version: "1.0.0",
                platform: "web",
                mode: "ui",
              },
              caps: [],
              auth: { password: GATEWAY_TOKEN },
              role: "operator",
              scopes: ["operator.admin", "operator.read"],
            },
          })
        );
        return;
      }

      // Handle connect response → send RPC
      if (msg.type === "res" && msg.id === "connect-1") {
        if (!msg.ok) {
          clearTimeout(timeout);
          ws.close();
          reject(new Error(`Auth failed: ${msg.error?.message}`));
          return;
        }
        authenticated = true;
        ws.send(
          JSON.stringify({
            type: "req",
            id: "rpc-1",
            method,
            params,
          })
        );
        return;
      }

      // Handle RPC response
      if (msg.type === "res" && msg.id === "rpc-1") {
        clearTimeout(timeout);
        ws.close();
        if (!msg.ok) {
          reject(new Error(msg.error?.message ?? "RPC error"));
        } else {
          resolve(msg.payload);
        }
        return;
      }
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    ws.on("close", () => {
      clearTimeout(timeout);
      if (!authenticated) {
        reject(new Error("Connection closed before auth"));
      }
    });
  });
}
