const REQUIRED_ENV_VARS = [
  "SESSION_SECRET",
  "OPENCLAW_GATEWAY_URL",
  "OPENCLAW_GATEWAY_TOKEN",
  "APP_PASSWORD",
] as const;

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number];

function readRequiredEnv(name: RequiredEnvVar): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function loadEnv() {
  const missing: RequiredEnvVar[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    const value = process.env[key];
    if (!value || value.trim().length === 0) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing
        .map((name) => `- ${name}`)
        .join("\n")}`
    );
  }

  return {
    SESSION_SECRET: readRequiredEnv("SESSION_SECRET"),
    OPENCLAW_GATEWAY_URL: readRequiredEnv("OPENCLAW_GATEWAY_URL"),
    OPENCLAW_GATEWAY_TOKEN: readRequiredEnv("OPENCLAW_GATEWAY_TOKEN"),
    APP_PASSWORD: readRequiredEnv("APP_PASSWORD"),
  };
}

export const env = loadEnv();
