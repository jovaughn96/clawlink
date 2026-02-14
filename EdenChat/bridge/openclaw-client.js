const WebSocket = require("ws");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { EventEmitter } = require("events");
const config = require("./config");

const IDENTITY_PATH = path.join(__dirname, ".device-identity.json");

class OpenClawClient extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.connected = false;
    this.reconnectDelay = config.reconnect.initialDelayMs;
    this.reconnectTimer = null;
    this.pendingRequests = new Map();
    this.activeRuns = new Map(); // runId → accumulated text
    this.identity = null; // { deviceId, publicKeyPem, privateKeyPem }
    this.deviceToken = null;
  }

  /**
   * Connect to the OpenClaw gateway.
   */
  connect() {
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
    }

    this._loadOrCreateIdentity();

    const url = config.gateway.url;
    console.log(`[openclaw] Connecting to ${url}...`);
    this.ws = new WebSocket(url);

    this.ws.on("open", () => {
      console.log("[openclaw] WebSocket open, waiting for challenge...");
    });

    this.ws.on("message", (data) => {
      let msg;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        console.error("[openclaw] Failed to parse message:", data.toString());
        return;
      }
      this._handleMessage(msg);
    });

    this.ws.on("close", (code, reason) => {
      console.log(`[openclaw] Connection closed (${code}): ${reason}`);
      this.connected = false;
      this.emit("disconnected");
      this._scheduleReconnect();
    });

    this.ws.on("error", (err) => {
      console.error("[openclaw] WebSocket error:", err.message);
    });
  }

  /**
   * Send a chat message and return a promise that resolves with the full
   * response text. Emits 'delta' events during streaming.
   */
  sendMessage(text, conversationId) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        return reject(new Error("Not connected to gateway"));
      }

      const reqId = this._reqId();
      const idempotencyKey = `${conversationId}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

      const req = {
        type: "req",
        id: reqId,
        method: "chat.send",
        params: {
          sessionKey: "main",
          message: text,
          idempotencyKey,
        },
      };

      this.pendingRequests.set(reqId, { resolve, reject, conversationId });
      this._send(req);
    });
  }

  disconnect() {
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  // --- Device Identity ---

  _loadOrCreateIdentity() {
    if (this.identity) return;

    if (fs.existsSync(IDENTITY_PATH)) {
      this.identity = JSON.parse(fs.readFileSync(IDENTITY_PATH, "utf8"));
      if (this.identity.deviceToken) {
        this.deviceToken = this.identity.deviceToken;
      }
      console.log(`[openclaw] Loaded device identity: ${this.identity.deviceId.substring(0, 12)}...`);
      return;
    }

    // Generate new Ed25519 keypair
    const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
    const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();
    const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

    // Derive device ID (SHA256 fingerprint of raw public key)
    const spki = publicKey.export({ type: "spki", format: "der" });
    const rawPublicKey = spki.subarray(12); // Strip Ed25519 SPKI prefix (12 bytes)
    const deviceId = crypto.createHash("sha256").update(rawPublicKey).digest("hex");

    this.identity = { deviceId, publicKeyPem, privateKeyPem };
    fs.writeFileSync(IDENTITY_PATH, JSON.stringify(this.identity, null, 2), { mode: 0o600 });
    console.log(`[openclaw] Created new device identity: ${deviceId.substring(0, 12)}...`);
  }

  _signAuthPayload(nonce) {
    const { deviceId, privateKeyPem } = this.identity;
    const clientId = "gateway-client";
    const clientMode = "backend";
    const role = "operator";
    const scopes = ["operator.read", "operator.write"];
    const signedAt = Date.now();

    const token = config.gateway.authToken || this.deviceToken || "";
    const payload = [
      "v2",
      deviceId,
      clientId,
      clientMode,
      role,
      scopes.join(","),
      String(signedAt),
      token,
      nonce || "",
    ].join("|");

    const signature = crypto.sign(null, Buffer.from(payload), privateKeyPem);
    const signatureB64Url = signature
      .toString("base64")
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replace(/=+$/g, "");

    // Raw public key as base64url
    const spki = crypto.createPublicKey(this.identity.publicKeyPem).export({ type: "spki", format: "der" });
    const rawPubKey = spki.subarray(12);
    const publicKeyB64Url = rawPubKey
      .toString("base64")
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replace(/=+$/g, "");

    return { signatureB64Url, publicKeyB64Url, signedAt };
  }

  // --- Connect Flow ---

  _sendConnect(nonce) {
    const { signatureB64Url, publicKeyB64Url, signedAt } = this._signAuthPayload(nonce);
    const reqId = this._reqId();

    const req = {
      type: "req",
      id: reqId,
      method: "connect",
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: "gateway-client",
          version: "1.0.0",
          platform: "macos",
          mode: "backend",
        },
        role: "operator",
        scopes: ["operator.read", "operator.write"],
        caps: [],
        commands: [],
        permissions: {},
        auth: { token: config.gateway.authToken || this.deviceToken || "" },
        locale: "en-US",
        userAgent: "edenchat-bridge/1.0.0",
        device: {
          id: this.identity.deviceId,
          publicKey: publicKeyB64Url,
          signature: signatureB64Url,
          signedAt,
          nonce: nonce || "",
        },
      },
    };

    this.pendingRequests.set(reqId, {
      resolve: () => {},
      reject: (err) => console.error("[openclaw] Connect failed:", err),
      isConnect: true,
    });

    this._send(req);
  }

  // --- Message Handling ---

  _handleMessage(msg) {
    if (msg.type === "res") {
      this._handleResponse(msg);
    } else if (msg.type === "event") {
      this._handleEvent(msg);
    }
  }

  _handleResponse(msg) {
    const pending = this.pendingRequests.get(msg.id);
    if (!pending) return;

    if (pending.isConnect) {
      this.pendingRequests.delete(msg.id);
      if (msg.ok) {
        console.log("[openclaw] Connected successfully");
        this.connected = true;
        this.reconnectDelay = config.reconnect.initialDelayMs;

        // Store device token if issued
        if (msg.payload?.auth?.deviceToken) {
          this.deviceToken = msg.payload.auth.deviceToken;
          this.identity.deviceToken = this.deviceToken;
          fs.writeFileSync(IDENTITY_PATH, JSON.stringify(this.identity, null, 2), { mode: 0o600 });
          console.log("[openclaw] Device token stored");
        }

        this.emit("connected");
      } else {
        const errMsg = typeof msg.error === "string"
          ? msg.error
          : (msg.error?.message || JSON.stringify(msg.error) || "Connect rejected");
        console.error("[openclaw] Connect rejected:", errMsg);
        pending.reject(new Error(errMsg));
      }
      return;
    }

    // chat.send acknowledgment
    console.log("[openclaw] chat.send response:", JSON.stringify(msg).substring(0, 300));
    if (msg.ok) {
      // Try to find runId in payload or use the idempotency-based one
      const runId = msg.payload?.runId || msg.payload?.id;
      if (runId) {
        this.activeRuns.set(runId, {
          text: "",
          reqId: msg.id,
          conversationId: pending.conversationId,
        });
      }
      // Also store by reqId so agent events can find it
      this._lastReqForConversation = this._lastReqForConversation || new Map();
      this._lastReqForConversation.set(pending.conversationId, msg.id);
    } else if (!msg.ok) {
      this.pendingRequests.delete(msg.id);
      const errMsg = typeof msg.error === "string"
        ? msg.error
        : (msg.error?.message || JSON.stringify(msg.error) || "Request failed");
      console.error("[openclaw] chat.send error:", errMsg, JSON.stringify(msg));
      pending.reject(new Error(errMsg));
    }
  }

  _handleEvent(msg) {
    if (msg.event === "connect.challenge") {
      const nonce = msg.payload?.nonce;
      console.log("[openclaw] Received challenge, sending signed connect...");
      this._sendConnect(nonce);
    } else if (msg.event === "chat") {
      this._handleChatEvent(msg.payload);
    } else if (msg.event === "agent") {
      this._handleAgentEvent(msg);
    }
  }

  _handleAgentEvent(msg) {
    const payload = msg.payload || msg;
    const { runId, stream, data } = payload;
    if (!runId || !data) return;

    let run = this.activeRuns.get(runId);

    // If no active run found by runId, try to match by pending request
    // The runId from agent events uses the idempotencyKey as prefix
    if (!run) {
      for (const [rId, r] of this.activeRuns) {
        if (runId.startsWith(r.conversationId)) {
          run = r;
          // Re-key the run with the actual runId
          this.activeRuns.delete(rId);
          this.activeRuns.set(runId, run);
          break;
        }
      }
    }

    // If still no run, create one from pending requests
    if (!run) {
      for (const [reqId, pending] of this.pendingRequests) {
        if (pending.conversationId && !pending.isConnect) {
          run = { text: "", reqId, conversationId: pending.conversationId };
          this.activeRuns.set(runId, run);
          break;
        }
      }
    }

    if (!run) return;

    if (stream === "assistant" && data.delta) {
      run.text += data.delta;
      this.emit("delta", {
        runId,
        conversationId: run.conversationId,
        delta: data.delta,
        accumulated: run.text,
      });
    }

    if (stream === "lifecycle" && data.phase === "end") {
      const finalText = run.text;
      const pending = this.pendingRequests.get(run.reqId);
      this.activeRuns.delete(runId);

      this.emit("response", {
        runId,
        conversationId: run.conversationId,
        text: finalText,
      });

      if (pending) {
        this.pendingRequests.delete(run.reqId);
        pending.resolve(finalText);
      }
    }

    if (stream === "lifecycle" && data.phase === "error") {
      const pending = this.pendingRequests.get(run.reqId);
      this.activeRuns.delete(runId);
      if (pending) {
        this.pendingRequests.delete(run.reqId);
        pending.reject(new Error(data.error || "Agent error"));
      }
      this.emit("error", { runId, error: data.error });
    }
  }

  _handleChatEvent(payload) {
    if (!payload) return;
    const { runId } = payload;

    // Error event
    if (payload.error) {
      const run = this.activeRuns.get(runId);
      if (run) {
        const pending = this.pendingRequests.get(run.reqId);
        this.activeRuns.delete(runId);
        if (pending) {
          this.pendingRequests.delete(run.reqId);
          pending.reject(new Error(payload.error));
        }
      }
      this.emit("error", { runId, error: payload.error });
      return;
    }

    const message = payload.message;
    if (!message || message.role !== "assistant") return;
    const content = message.content;
    if (!content) return;

    const run = this.activeRuns.get(runId);
    if (!run) return;

    // Streaming delta
    if (content.delta) {
      run.text += content.delta;
      this.emit("delta", {
        runId,
        conversationId: run.conversationId,
        delta: content.delta,
        accumulated: run.text,
      });
    }

    // Stream complete
    if (content.done) {
      const finalText = run.text;
      const pending = this.pendingRequests.get(run.reqId);
      this.activeRuns.delete(runId);

      this.emit("response", {
        runId,
        conversationId: run.conversationId,
        text: finalText,
      });

      if (pending) {
        this.pendingRequests.delete(run.reqId);
        pending.resolve(finalText);
      }
    }
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    console.log(`[openclaw] Reconnecting in ${this.reconnectDelay}ms...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(
        this.reconnectDelay * config.reconnect.multiplier,
        config.reconnect.maxDelayMs,
      );
      this.connect();
    }, this.reconnectDelay);
  }

  _send(obj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  _reqId() {
    return `req-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  }
}

module.exports = OpenClawClient;
