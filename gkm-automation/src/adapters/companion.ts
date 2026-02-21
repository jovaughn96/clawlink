import { companionBaseUrl, companionConfig } from "../config/companion.js";

type Method = "GET" | "POST";

async function req(path: string, method: Method, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (companionConfig.token) headers.Authorization = `Bearer ${companionConfig.token}`;

  return fetch(`${companionBaseUrl()}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {})
  });
}

async function firstOk(candidates: Array<{ path: string; method: Method; body?: unknown }>): Promise<{ via: string; data: unknown }> {
  let last = "";
  for (const c of candidates) {
    const r = await req(c.path, c.method, c.body);
    const t = await r.text();
    if (r.ok) {
      let data: unknown = t;
      try {
        data = JSON.parse(t);
      } catch {
        // keep text
      }
      return { via: `${c.method} ${c.path}`, data };
    }
    last = `${r.status} ${c.method} ${c.path} ${t}`;
  }
  throw new Error(`Companion endpoint failed. Last attempt: ${last}`);
}

export async function companionInfo(): Promise<{ via: string; data: unknown }> {
  return firstOk([
    { method: "GET", path: "/api/location" },
    { method: "GET", path: "/api/version" },
    { method: "GET", path: "/api/system" }
  ]);
}

export async function companionButtons(): Promise<{ via: string; data: unknown }> {
  return firstOk([
    { method: "GET", path: "/api/buttons" },
    { method: "GET", path: "/api/v2/buttons" },
    { method: "GET", path: "/api/pagebank" }
  ]);
}

export async function companionPress(page: number, bank: number): Promise<{ via: string; data: unknown }> {
  return firstOk([
    { method: "POST", path: "/api/button/press", body: { page, bank } },
    { method: "GET", path: `/api/button/press?page=${page}&bank=${bank}` },
    { method: "POST", path: "/api/v2/button/press", body: { page, bank } }
  ]);
}
