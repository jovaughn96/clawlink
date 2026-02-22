const path = require("path");

module.exports = {
  // OpenClaw gateway
  gateway: {
    url: process.env.OPENCLAW_GATEWAY_URL || "ws://127.0.0.1:18789",
    // Keep empty by default; gateway issues/stores a device token per identity.
    // Use EDENCHAT_OPENCLAW_TOKEN only if explicitly needed.
    authToken: process.env.EDENCHAT_OPENCLAW_TOKEN || "",
  },

  // Firebase
  firebase: {
    projectId: "edenchat-jo",
    // Path to service account key JSON (download from Firebase Console)
    serviceAccountPath: process.env.FIREBASE_SA_PATH ||
      path.join(__dirname, "serviceAccountKey.json"),
  },

  // Reconnect settings (exponential backoff)
  reconnect: {
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    multiplier: 2,
  },

  // Bridge heartbeat interval
  heartbeatIntervalMs: 10000,
};
