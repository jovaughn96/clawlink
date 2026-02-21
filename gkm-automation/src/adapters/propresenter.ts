import { env } from "../config/env.js";
import { resolveProPresenterTarget } from "../config/propresenter-instances.js";

function baseUrl(target?: string): string {
  const inst = resolveProPresenterTarget(target);
  return `http://${inst.host}:${inst.port}`;
}

function authHeaders(target?: string): Record<string, string> {
  const inst = resolveProPresenterTarget(target);
  const password = inst.password ?? env.propresenterPass;
  if (!password) return {};
  const token = Buffer.from(`operator:${password}`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

async function call(path: string, method = "GET", target?: string): Promise<void> {
  const res = await fetch(`${baseUrl(target)}${path}`, {
    method,
    headers: {
      ...authHeaders(target)
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ProPresenter request failed (${res.status}): ${text}`);
  }
}

export async function triggerPlaylistItem(
  playlistId: string,
  itemId: string,
  target?: string
): Promise<{ playlistId: string; itemId: string; target: string }> {
  const inst = resolveProPresenterTarget(target);
  await call(`/v1/presentation/playlist/${encodeURIComponent(playlistId)}/${encodeURIComponent(itemId)}/trigger`, "POST", target);
  return { playlistId, itemId, target: inst.name };
}

export async function nextSlide(target?: string): Promise<{ ok: true; target: string }> {
  const inst = resolveProPresenterTarget(target);
  await call("/v1/presentation/next", "POST", target);
  return { ok: true, target: inst.name };
}

export async function previousSlide(target?: string): Promise<{ ok: true; target: string }> {
  const inst = resolveProPresenterTarget(target);
  await call("/v1/presentation/previous", "POST", target);
  return { ok: true, target: inst.name };
}

export async function clearLayer(
  targetLayer: "all" | "slides" | "media" | "audio" = "all",
  target?: string
): Promise<{ targetLayer: string; target: string }> {
  const inst = resolveProPresenterTarget(target);
  const pathByTarget: Record<string, string> = {
    all: "/v1/clear/all",
    slides: "/v1/clear/slide",
    media: "/v1/clear/media",
    audio: "/v1/clear/audio"
  };

  await call(pathByTarget[targetLayer], "POST", target);
  return { targetLayer, target: inst.name };
}
