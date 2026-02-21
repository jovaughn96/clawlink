import { companionBaseUrl, companionConfig } from "../config/companion.js";

type Method = "GET" | "POST";

async function req(path: string, method: Method, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (companionConfig.token) headers.Authorization = `Bearer ${companionConfig.token}`;

  return fetch(`${companionBaseUrl()}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
}

async function firstOk(
  candidates: Array<{ path: string; method: Method; body?: unknown }>
): Promise<{ via: string; data: unknown }> {
  let last = "";
  for (const c of candidates) {
    const r = await req(c.path, c.method, c.body);
    const t = await r.text();
    if (r.ok) {
      let data: unknown = t;
      try {
        data = JSON.parse(t);
      } catch {
        // leave as text
      }
      return { via: `${c.method} ${c.path}`, data };
    }
    last = `${r.status} ${c.method} ${c.path} ${t}`;
  }
  throw new Error(`Companion endpoint failed. Last attempt: ${last}`);
}

export async function companionInfo(): Promise<{ via: string; data: unknown }> {
  return firstOk([
    { method: "GET", path: "/version" },
    { method: "GET", path: "/api/version" },
    { method: "GET", path: "/api/system" }
  ]);
}

export async function companionButtons(): Promise<{ via: string; data: unknown }> {
  return firstOk([
    // v4+ endpoints
    { method: "GET", path: "/api/location" },
    // older fallback probes
    { method: "GET", path: "/api/buttons" },
    { method: "GET", path: "/api/v2/buttons" },
    { method: "GET", path: "/api/pagebank" }
  ]);
}

/**
 * Press by StreamDeck location coords (v4 style): page is 1-indexed, row/column are 0-indexed.
 */
export async function companionPressLocation(
  page: number,
  row: number,
  column: number
): Promise<{ via: string; data: unknown }> {
  return firstOk([
    { method: "POST", path: `/api/location/${page}/${row}/${column}/press` },
    { method: "GET", path: `/api/location/${page}/${row}/${column}/press` }
  ]);
}

/**
 * Press by legacy bank number (1..32 on StreamDeck XL) for backward compatibility.
 */
export async function companionPressBank(page: number, bank: number): Promise<{ via: string; data: unknown }> {
  const row = Math.floor((bank - 1) / 8);
  const column = (bank - 1) % 8;

  return firstOk([
    // v4 preferred
    { method: "POST", path: `/api/location/${page}/${row}/${column}/press` },
    // legacy/deprecated fallbacks
    { method: "POST", path: `/press/bank/${page}/${bank}` },
    { method: "GET", path: `/press/bank/${page}/${bank}` },
    { method: "POST", path: "/api/button/press", body: { page, bank } },
    { method: "POST", path: "/api/v2/button/press", body: { page, bank } }
  ]);
}
