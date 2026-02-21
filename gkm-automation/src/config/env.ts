import dotenv from "dotenv";

dotenv.config();

const required = ["API_KEY"] as const;
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const toBool = (value: string | undefined, fallback = false): boolean => {
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

export const env = {
  port: Number(process.env.PORT ?? 17816),
  host: process.env.HOST ?? "127.0.0.1",
  apiKey: process.env.API_KEY as string,
  dryRun: toBool(process.env.DRY_RUN, true),
  allowedActions: (process.env.ALLOWED_ACTIONS ?? "system.health")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  atemIp: process.env.ATEM_IP ?? "172.16.0.50",
  atemMock: toBool(process.env.ATEM_MOCK, true),
  sqlitePath: process.env.SQLITE_PATH ?? "./data/audit.db"
};
