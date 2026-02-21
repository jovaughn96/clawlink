import { inputAliases, meAliases, scenePresets } from "../config/profile.js";
import type { ActionRequest } from "../types/actions.js";

type ParsedCommand = {
  actionRequests: ActionRequest[];
  normalized: string;
};

function norm(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function resolveMe(token?: string): 1 | 2 | undefined {
  if (!token) return undefined;
  if (token === "me1") return 1;
  if (token === "me2") return 2;
  return meAliases[token] ?? undefined;
}

export function parseCommand(command: string): ParsedCommand {
  const normalized = norm(command);

  // Church shorthand intents
  if (normalized === "go live" || normalized === "sermon mode") {
    return {
      normalized,
      actionRequests: [
        {
          action: "atem.scene.compose",
          payload: {
            scene: "sermon-wide",
            me: 1,
            overlays: { usk1: true, usk2: false }
          }
        }
      ]
    };
  }

  if (normalized === "clear keys" || normalized === "clear overlays") {
    return {
      normalized,
      actionRequests: [
        { action: "atem.overlay.set", payload: { me: 1, layer: "usk1", enabled: false } },
        { action: "atem.overlay.set", payload: { me: 1, layer: "usk2", enabled: false } },
        { action: "atem.overlay.set", payload: { me: 2, layer: "usk1", enabled: false } },
        { action: "atem.overlay.set", payload: { me: 2, layer: "usk2", enabled: false } }
      ]
    };
  }

  if (normalized === "lobby mirror on") {
    return {
      normalized,
      actionRequests: [{ action: "atem.feed.mirror", payload: { fromMe: 1, toMe: 2 } }]
    };
  }

  if (normalized === "lobby mirror off") {
    return {
      normalized,
      actionRequests: [{ action: "atem.scene.take", payload: { scene: "auditorium-wide", me: 2 } }]
    };
  }

  const companionPressMatch = normalized.match(/^companion press (\d+) (\d+)$/);
  if (companionPressMatch) {
    return {
      normalized,
      actionRequests: [
        {
          action: "companion.button.press",
          payload: { page: Number(companionPressMatch[1]), bank: Number(companionPressMatch[2]) }
        }
      ]
    };
  }

  const companionLocationMatch = normalized.match(/^companion press location (\d+) (\d+) (\d+)$/);
  if (companionLocationMatch) {
    return {
      normalized,
      actionRequests: [
        {
          action: "companion.button.press",
          payload: {
            page: Number(companionLocationMatch[1]),
            row: Number(companionLocationMatch[2]),
            column: Number(companionLocationMatch[3])
          }
        }
      ]
    };
  }

  const ppNext = normalized.match(/^next slide(?: on ([a-z0-9\- ]+))?$/);
  if (ppNext) {
    return {
      normalized,
      actionRequests: [{ action: "propresenter.next", payload: ppNext[1] ? { target: ppNext[1].trim() } : {} }]
    };
  }

  const ppPrev = normalized.match(/^previous slide(?: on ([a-z0-9\- ]+))?$/);
  if (ppPrev) {
    return {
      normalized,
      actionRequests: [{ action: "propresenter.previous", payload: ppPrev[1] ? { target: ppPrev[1].trim() } : {} }]
    };
  }

  const ppClear = normalized.match(/^clear (all|slides|media|audio)(?: on ([a-z0-9\- ]+))?$/);
  if (ppClear) {
    return {
      normalized,
      actionRequests: [
        {
          action: "propresenter.clear",
          payload: { target: ppClear[1] as "all" | "slides" | "media" | "audio", ...(ppClear[2] ? { instance: ppClear[2].trim() } : {}) }
        }
      ]
    };
  }

  const mirrorMatch = normalized.match(/^(mirror)\s+(\w+)\s+to\s+(\w+)(?:\s+with\s+overlays)?$/);
  if (mirrorMatch) {
    const fromMe = resolveMe(mirrorMatch[2]);
    const toMe = resolveMe(mirrorMatch[3]);
    if (!fromMe || !toMe) throw new Error("Unknown ME alias in mirror command");
    return {
      normalized,
      actionRequests: [
        {
          action: "atem.feed.mirror",
          payload: { fromMe, toMe, includeOverlays: normalized.includes("with overlays") }
        }
      ]
    };
  }

  const sceneMatch = normalized.match(
    /^take\s+([a-z0-9\-]+)(?:\s+to\s+(\w+|me1|me2))?(?:\s+with\s+propresenter\s+(on|off),?\s+gfx\s+(on|off))?$/
  );
  if (sceneMatch) {
    const scene = sceneMatch[1];
    if (!scenePresets[scene as keyof typeof scenePresets]) {
      throw new Error(`Unknown scene preset: ${scene}`);
    }

    const me = resolveMe(sceneMatch[2]);
    const pp = sceneMatch[3];
    const gfx = sceneMatch[4];
    const overlays =
      pp || gfx
        ? {
            ...(pp ? { usk1: pp === "on" } : {}),
            ...(gfx ? { usk2: gfx === "on" } : {})
          }
        : undefined;

    return {
      normalized,
      actionRequests: [
        {
          action: "atem.scene.compose",
          payload: { scene, ...(me ? { me } : {}), ...(overlays ? { overlays } : {}) }
        }
      ]
    };
  }

  const meProgramMatch = normalized.match(/^take\s+([a-z0-9\-]+)\s+on\s+(me1|me2|\w+)$/);
  if (meProgramMatch) {
    const inputToken = meProgramMatch[1];
    const me = resolveMe(meProgramMatch[2]);
    const input = inputAliases[inputToken as keyof typeof inputAliases];
    if (!me) throw new Error("Unknown ME alias");
    if (!input) throw new Error("Unknown input alias");
    return {
      normalized,
      actionRequests: [
        {
          action: "atem.me.program.set",
          payload: { input, me }
        }
      ]
    };
  }

  const overlayMatch = normalized.match(
    /^(turn)\s+(usk1|usk2|propresenter|gfx)\s+(on|off)(?:\s+on\s+(me1|me2|\w+))?$/
  );
  if (overlayMatch) {
    const layerToken = overlayMatch[2];
    const layer: "usk1" | "usk2" =
      layerToken === "propresenter" ? "usk1" : layerToken === "gfx" ? "usk2" : layerToken === "usk1" ? "usk1" : "usk2";
    const enabled = overlayMatch[3] === "on";
    const me = resolveMe(overlayMatch[4]) ?? 1;
    return {
      normalized,
      actionRequests: [
        {
          action: "atem.overlay.set",
          payload: { me, layer, enabled }
        }
      ]
    };
  }

  throw new Error(
    "Could not parse command. Try: 'take sermon-wide to broadcast with propresenter on, gfx off' or 'mirror broadcast to auditorium'."
  );
}
