export const companionConfig = {
  host: process.env.COMPANION_HOST ?? "172.16.14.199",
  port: Number(process.env.COMPANION_PORT ?? 8888),
  token: process.env.COMPANION_TOKEN ?? ""
};

export function companionBaseUrl(): string {
  return `http://${companionConfig.host}:${companionConfig.port}`;
}
