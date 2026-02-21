import { env } from "../config/env.js";
import { resolveProPresenterTarget } from "../config/propresenter-instances.js";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

function authHeaders(target?: string): Record<string, string> {
  const inst = resolveProPresenterTarget(target);
  const password = inst.password ?? env.propresenterPass;
  if (!password) return {};
  const token = Buffer.from(`operator:${password}`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

function buildUrl(path: string, target?: string): string {
  const inst = resolveProPresenterTarget(target);
  return `http://${inst.host}:${inst.port}${path}`;
}

async function request(path: string, method: HttpMethod, target?: string): Promise<Response> {
  return fetch(buildUrl(path, target), {
    method,
    headers: {
      ...authHeaders(target)
    }
  });
}

async function callWithFallback(
  candidates: Array<{ path: string; method: HttpMethod }>,
  target?: string
): Promise<{ path: string; method: HttpMethod }> {
  let lastStatus = -1;
  let lastBody = "";

  for (const c of candidates) {
    const res = await request(c.path, c.method, target);
    if (res.ok) {
      return c;
    }

    lastStatus = res.status;
    lastBody = await res.text();

    // 404: try next candidate. 405: wrong method, also try next.
    if (res.status !== 404 && res.status !== 405) {
      throw new Error(`ProPresenter request failed (${res.status}) at ${c.method} ${c.path}: ${lastBody}`);
    }
  }

  throw new Error(
    `ProPresenter control endpoint not found for target (${target ?? "primary"}). Last status=${lastStatus}, body=${lastBody}`
  );
}

async function triggerMacro(uuid: string, target?: string): Promise<void> {
  await callWithFallback(
    [
      { method: "POST", path: `/v1/macros/${encodeURIComponent(uuid)}/trigger` },
      { method: "GET", path: `/v1/macros/${encodeURIComponent(uuid)}/trigger` },
      { method: "POST", path: `/v1/macro/${encodeURIComponent(uuid)}/trigger` },
      { method: "GET", path: `/v1/macro/${encodeURIComponent(uuid)}/trigger` }
    ],
    target
  );
}

export async function triggerPlaylistItem(
  playlistId: string,
  itemId: string,
  target?: string
): Promise<{ playlistId: string; itemId: string; target: string }> {
  const inst = resolveProPresenterTarget(target);
  await callWithFallback(
    [
      {
        method: "POST",
        path: `/v1/presentation/playlist/${encodeURIComponent(playlistId)}/${encodeURIComponent(itemId)}/trigger`
      },
      {
        method: "GET",
        path: `/v1/presentation/playlist/${encodeURIComponent(playlistId)}/${encodeURIComponent(itemId)}/trigger`
      }
    ],
    target
  );

  return { playlistId, itemId, target: inst.name };
}

export async function nextSlide(target?: string): Promise<{ ok: true; target: string; mode: string }> {
  const inst = resolveProPresenterTarget(target);

  try {
    const hit = await callWithFallback(
      [
        { method: "POST", path: "/v1/presentation/next" },
        { method: "GET", path: "/v1/presentation/next" },
        { method: "POST", path: "/v1/presentation/active/next" },
        { method: "GET", path: "/v1/presentation/active/next" }
      ],
      target
    );
    return { ok: true, target: inst.name, mode: `${hit.method} ${hit.path}` };
  } catch (error) {
    const macroId = inst.macroFallbacks?.next;
    if (!macroId) throw error;
    await triggerMacro(macroId, target);
    return { ok: true, target: inst.name, mode: `macro:${macroId}` };
  }
}

export async function previousSlide(target?: string): Promise<{ ok: true; target: string; mode: string }> {
  const inst = resolveProPresenterTarget(target);

  try {
    const hit = await callWithFallback(
      [
        { method: "POST", path: "/v1/presentation/previous" },
        { method: "GET", path: "/v1/presentation/previous" },
        { method: "POST", path: "/v1/presentation/active/previous" },
        { method: "GET", path: "/v1/presentation/active/previous" }
      ],
      target
    );
    return { ok: true, target: inst.name, mode: `${hit.method} ${hit.path}` };
  } catch (error) {
    const macroId = inst.macroFallbacks?.previous;
    if (!macroId) throw error;
    await triggerMacro(macroId, target);
    return { ok: true, target: inst.name, mode: `macro:${macroId}` };
  }
}

export async function clearLayer(
  targetLayer: "all" | "slides" | "media" | "audio" = "all",
  target?: string
): Promise<{ targetLayer: string; target: string; mode: string }> {
  const inst = resolveProPresenterTarget(target);

  const pathByTarget: Record<string, string[]> = {
    all: ["/v1/clear/all", "/v1/clear"],
    slides: ["/v1/clear/slide", "/v1/clear/slides"],
    media: ["/v1/clear/media"],
    audio: ["/v1/clear/audio"]
  };

  try {
    const candidates = pathByTarget[targetLayer].flatMap((path) => [
      { method: "POST" as const, path },
      { method: "GET" as const, path }
    ]);

    const hit = await callWithFallback(candidates, target);
    return { targetLayer, target: inst.name, mode: `${hit.method} ${hit.path}` };
  } catch (error) {
    const macroIdByLayer = {
      all: inst.macroFallbacks?.clearAll,
      slides: inst.macroFallbacks?.clearSlides,
      media: inst.macroFallbacks?.clearMedia,
      audio: inst.macroFallbacks?.clearAudio
    } as const;

    const macroId = macroIdByLayer[targetLayer];
    if (!macroId) throw error;

    await triggerMacro(macroId, target);
    return { targetLayer, target: inst.name, mode: `macro:${macroId}` };
  }
}
