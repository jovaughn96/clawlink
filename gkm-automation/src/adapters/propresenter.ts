import { env } from "../config/env.js";

function baseUrl(): string {
  return `http://${env.propresenterHost}:${env.propresenterPort}`;
}

function authHeaders(): Record<string, string> {
  if (!env.propresenterPass) return {};
  const token = Buffer.from(`operator:${env.propresenterPass}`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

async function call(path: string, method = "GET"): Promise<void> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      ...authHeaders()
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ProPresenter request failed (${res.status}): ${text}`);
  }
}

export async function triggerPlaylistItem(playlistId: string, itemId: string): Promise<{ playlistId: string; itemId: string }> {
  await call(`/v1/presentation/playlist/${encodeURIComponent(playlistId)}/${encodeURIComponent(itemId)}/trigger`, "POST");
  return { playlistId, itemId };
}

export async function nextSlide(): Promise<{ ok: true }> {
  await call("/v1/presentation/next", "POST");
  return { ok: true };
}

export async function previousSlide(): Promise<{ ok: true }> {
  await call("/v1/presentation/previous", "POST");
  return { ok: true };
}

export async function clearLayer(target: "all" | "slides" | "media" | "audio" = "all"): Promise<{ target: string }> {
  const pathByTarget: Record<string, string> = {
    all: "/v1/clear/all",
    slides: "/v1/clear/slide",
    media: "/v1/clear/media",
    audio: "/v1/clear/audio"
  };

  await call(pathByTarget[target], "POST");
  return { target };
}
