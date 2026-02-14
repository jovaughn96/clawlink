const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const config = require("./config");
const OpenClawClient = require("./openclaw-client");
const FirestoreWatcher = require("./firestore-watcher");

// --- Initialize Firebase Admin ---
const saPath = config.firebase.serviceAccountPath;
let firebaseConfig;

if (fs.existsSync(saPath)) {
  firebaseConfig = { credential: cert(require(saPath)) };
  console.log("[bridge] Using service account key from", saPath);
} else {
  // Falls back to GOOGLE_APPLICATION_CREDENTIALS or default credentials
  firebaseConfig = { projectId: config.firebase.projectId };
  console.log("[bridge] Using default credentials for project", config.firebase.projectId);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Initialize OpenClaw Client ---
const openclawClient = new OpenClawClient();

// --- Initialize Firestore Watcher ---
const watcher = new FirestoreWatcher(db, openclawClient);

// --- Start ---
openclawClient.on("connected", () => {
  console.log("[bridge] OpenClaw connected — starting Firestore watcher");
  watcher.start();
});

openclawClient.on("disconnected", () => {
  console.log("[bridge] OpenClaw disconnected — stopping watcher");
  watcher.stop();
});

// Graceful shutdown
const shutdown = () => {
  console.log("\n[bridge] Shutting down...");
  watcher.stop();
  openclawClient.disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Go
console.log("[bridge] EdenChat Bridge starting...");
openclawClient.connect();
