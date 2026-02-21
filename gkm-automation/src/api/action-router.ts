import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { keyLayers, meAliases, scenePresets, inputAliases } from "../config/profile.js";
import {
  getProgramInputForMe,
  runMacro,
  setOverlayForMe,
  setProgramInput,
  setProgramInputForMe
} from "../adapters/atem.js";
import { clearLayer, nextSlide, previousSlide, triggerPlaylistItem } from "../adapters/propresenter.js";
import { writeAudit } from "../core/audit.js";
import { parseCommand } from "../core/command-parser.js";
import type { ActionName, ActionRequest, ActionResult } from "../types/actions.js";

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("atem.program.set"),
    payload: z.object({ input: z.number().int().min(1).max(20) }),
    requestId: z.string().optional(),
    source: z.string().optional()
  }),
  z.object({
    action: z.literal("atem.me.program.set"),
    payload: z.object({
      input: z.number().int().min(1).max(20),
      me: z.union([z.literal(1), z.literal(2)])
    }),
    requestId: z.string().optional(),
    source: z.string().optional()
  }),
  z.object({
    action: z.literal("atem.scene.take"),
    payload: z.object({
      scene: z.string().min(1),
      me: z.union([z.literal(1), z.literal(2)]).optional()
    }),
    requestId: z.string().optional(),
    source: z.string().optional()
  }),
  z.object({
    action: z.literal("atem.overlay.set"),
    payload: z.object({
      me: z.union([z.literal(1), z.literal(2)]),
      layer: z.enum(["usk1", "usk2"]),
      enabled: z.boolean()
    }),
    requestId: z.string().optional(),
    source: z.string().optional()
  }),
  z.object({
    action: z.literal("atem.scene.compose"),
    payload: z.object({
      scene: z.string().min(1),
      me: z.union([z.literal(1), z.literal(2)]).optional(),
      overlays: z
        .object({
          usk1: z.boolean().optional(),
          usk2: z.boolean().optional()
        })
        .optional()
    }),
    requestId: z.string().optional(),
    source: z.string().optional()
  }),
  z.object({
    action: z.literal("atem.feed.mirror"),
    payload: z.object({
      fromMe: z.union([z.literal(1), z.literal(2)]),
      toMe: z.union([z.literal(1), z.literal(2)]),
      includeOverlays: z.boolean().optional()
    }),
    requestId: z.string().optional(),
    source: z.string().optional()
  }),
  z.object({
    action: z.literal("atem.macro.run"),
    payload: z.object({ macroId: z.number().int().min(1).max(1000) }),
    requestId: z.string().optional(),
    source: z.string().optional()
  }),
  z.object({
    action: z.literal("propresenter.trigger"),
    payload: z.object({
      playlistId: z.string().min(1),
      itemId: z.string().min(1)
    }),
    requestId: z.string().optional(),
    source: z.string().optional()
  }),
  z.object({
    action: z.literal("propresenter.next"),
    payload: z.object({}).default({}),
    requestId: z.string().optional(),
    source: z.string().optional()
  }),
  z.object({
    action: z.literal("propresenter.previous"),
    payload: z.object({}).default({}),
    requestId: z.string().optional(),
    source: z.string().optional()
  }),
  z.object({
    action: z.literal("propresenter.clear"),
    payload: z.object({
      target: z.enum(["all", "slides", "media", "audio"]).optional()
    }),
    requestId: z.string().optional(),
    source: z.string().optional()
  }),
  z.object({
    action: z.literal("system.profile.get"),
    payload: z.object({}).default({}),
    requestId: z.string().optional(),
    source: z.string().optional()
  }),
  z.object({
    action: z.literal("system.health"),
    payload: z.object({}).default({}),
    requestId: z.string().optional(),
    source: z.string().optional()
  })
]);

function ensureAllowed(action: ActionName): void {
  if (!env.allowedActions.includes(action)) {
    throw new Error(`Action not allowed by policy: ${action}`);
  }
}

function resolveScene(scene: string): { input: number; me: 1 | 2; scene: string } {
  const preset = scenePresets[scene as keyof typeof scenePresets];
  if (!preset) {
    throw new Error(`Unknown scene preset: ${scene}`);
  }

  const input = inputAliases[preset.input as keyof typeof inputAliases];
  return { input, me: preset.defaultMe, scene };
}

export const actionRouter = Router();

actionRouter.get("/health", (_req, res) => {
  res.json({ ok: true, service: "gkm-automation", ts: new Date().toISOString() });
});

const commandSchema = z.object({
  command: z.string().min(3),
  requestId: z.string().optional(),
  source: z.string().optional()
});

actionRouter.post("/action", async (req, res) => {
  const ts = new Date().toISOString();
  const parsed = actionSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "invalid_request", details: parsed.error.flatten() });
    return;
  }

  const body = parsed.data;

  try {
    ensureAllowed(body.action);

    let result: ActionResult;

    switch (body.action) {
      case "system.profile.get": {
        result = {
          ok: true,
          action: body.action,
          dryRun: env.dryRun,
          requestId: body.requestId,
          message: "Profile loaded",
          data: {
            inputs: inputAliases,
            mes: meAliases,
            keyLayers,
            scenePresets
          },
          timestamp: ts
        };
        break;
      }
      case "system.health": {
        result = {
          ok: true,
          action: body.action,
          dryRun: env.dryRun,
          requestId: body.requestId,
          message: "Service healthy",
          data: {
            atem: { ip: env.atemIp, mock: env.atemMock },
            propresenter: {
              host: env.propresenterHost,
              port: env.propresenterPort,
              configuredAuth: Boolean(env.propresenterPass)
            },
            profile: {
              scenes: Object.keys(scenePresets).length,
              inputs: Object.keys(inputAliases).length
            },
            dryRun: env.dryRun
          },
          timestamp: ts
        };
        break;
      }
      case "atem.program.set": {
        const data = env.dryRun
          ? { target: env.atemIp, input: body.payload.input, simulated: true }
          : await setProgramInput(body.payload.input);
        result = {
          ok: true,
          action: body.action,
          dryRun: env.dryRun,
          requestId: body.requestId,
          message: `ATEM program set -> input ${body.payload.input}`,
          data,
          timestamp: ts
        };
        break;
      }
      case "atem.me.program.set": {
        const data = env.dryRun
          ? {
              target: env.atemIp,
              input: body.payload.input,
              me: body.payload.me,
              simulated: true
            }
          : await setProgramInputForMe(body.payload.input, body.payload.me);
        result = {
          ok: true,
          action: body.action,
          dryRun: env.dryRun,
          requestId: body.requestId,
          message: `ATEM ME${body.payload.me} program set -> input ${body.payload.input}`,
          data,
          timestamp: ts
        };
        break;
      }
      case "atem.scene.take": {
        const resolved = resolveScene(body.payload.scene);
        const me = body.payload.me ?? resolved.me;
        const data = env.dryRun
          ? {
              target: env.atemIp,
              scene: body.payload.scene,
              input: resolved.input,
              me,
              simulated: true
            }
          : await setProgramInputForMe(resolved.input, me);
        result = {
          ok: true,
          action: body.action,
          dryRun: env.dryRun,
          requestId: body.requestId,
          message: `ATEM scene ${body.payload.scene} -> input ${resolved.input} on ME${me}`,
          data,
          timestamp: ts
        };
        break;
      }
      case "atem.overlay.set": {
        const data = env.dryRun
          ? {
              target: env.atemIp,
              me: body.payload.me,
              layer: body.payload.layer,
              enabled: body.payload.enabled,
              simulated: true
            }
          : await setOverlayForMe(body.payload.me, body.payload.layer, body.payload.enabled);
        result = {
          ok: true,
          action: body.action,
          dryRun: env.dryRun,
          requestId: body.requestId,
          message: `ATEM ${body.payload.layer.toUpperCase()} on ME${body.payload.me} -> ${body.payload.enabled ? "ON" : "OFF"}`,
          data,
          timestamp: ts
        };
        break;
      }
      case "atem.scene.compose": {
        const resolved = resolveScene(body.payload.scene);
        const me = body.payload.me ?? resolved.me;

        if (!env.dryRun) {
          await setProgramInputForMe(resolved.input, me);
          if (body.payload.overlays?.usk1 !== undefined) {
            await setOverlayForMe(me, "usk1", body.payload.overlays.usk1);
          }
          if (body.payload.overlays?.usk2 !== undefined) {
            await setOverlayForMe(me, "usk2", body.payload.overlays.usk2);
          }
        }

        result = {
          ok: true,
          action: body.action,
          dryRun: env.dryRun,
          requestId: body.requestId,
          message: `ATEM composed scene ${body.payload.scene} on ME${me}`,
          data: {
            target: env.atemIp,
            scene: body.payload.scene,
            input: resolved.input,
            me,
            overlays: body.payload.overlays ?? {},
            simulated: env.dryRun
          },
          timestamp: ts
        };
        break;
      }
      case "atem.feed.mirror": {
        if (body.payload.fromMe === body.payload.toMe) {
          throw new Error("fromMe and toMe must be different");
        }

        const sourceInput = env.dryRun ? 0 : await getProgramInputForMe(body.payload.fromMe);

        if (!env.dryRun) {
          await setProgramInputForMe(sourceInput, body.payload.toMe);
          if (body.payload.includeOverlays) {
            throw new Error("Overlay mirroring is not implemented yet; use explicit atem.overlay.set");
          }
        }

        result = {
          ok: true,
          action: body.action,
          dryRun: env.dryRun,
          requestId: body.requestId,
          message: `Mirrored ME${body.payload.fromMe} program to ME${body.payload.toMe}`,
          data: {
            target: env.atemIp,
            fromMe: body.payload.fromMe,
            toMe: body.payload.toMe,
            input: sourceInput,
            includeOverlays: body.payload.includeOverlays ?? false,
            simulated: env.dryRun
          },
          timestamp: ts
        };
        break;
      }
      case "atem.macro.run": {
        const data = env.dryRun
          ? { target: env.atemIp, macroId: body.payload.macroId, simulated: true }
          : await runMacro(body.payload.macroId);
        result = {
          ok: true,
          action: body.action,
          dryRun: env.dryRun,
          requestId: body.requestId,
          message: `ATEM macro run -> ${body.payload.macroId}`,
          data,
          timestamp: ts
        };
        break;
      }
      case "propresenter.trigger": {
        const data = env.dryRun
          ? { playlistId: body.payload.playlistId, itemId: body.payload.itemId, simulated: true }
          : await triggerPlaylistItem(body.payload.playlistId, body.payload.itemId);
        result = {
          ok: true,
          action: body.action,
          dryRun: env.dryRun,
          requestId: body.requestId,
          message: `ProPresenter triggered playlist item ${body.payload.itemId}`,
          data,
          timestamp: ts
        };
        break;
      }
      case "propresenter.next": {
        const data = env.dryRun ? { simulated: true } : await nextSlide();
        result = {
          ok: true,
          action: body.action,
          dryRun: env.dryRun,
          requestId: body.requestId,
          message: "ProPresenter next slide",
          data,
          timestamp: ts
        };
        break;
      }
      case "propresenter.previous": {
        const data = env.dryRun ? { simulated: true } : await previousSlide();
        result = {
          ok: true,
          action: body.action,
          dryRun: env.dryRun,
          requestId: body.requestId,
          message: "ProPresenter previous slide",
          data,
          timestamp: ts
        };
        break;
      }
      case "propresenter.clear": {
        const data = env.dryRun
          ? { target: body.payload.target ?? "all", simulated: true }
          : await clearLayer(body.payload.target ?? "all");
        result = {
          ok: true,
          action: body.action,
          dryRun: env.dryRun,
          requestId: body.requestId,
          message: `ProPresenter clear ${body.payload.target ?? "all"}`,
          data,
          timestamp: ts
        };
        break;
      }
      default:
        throw new Error("Unsupported action");
    }

    writeAudit({
      ts,
      source: body.source,
      requestId: body.requestId,
      action: body.action,
      payload: body.payload,
      resultOk: result.ok,
      resultMessage: result.message,
      resultData: result.data
    });

    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    writeAudit({
      ts,
      source: body.source,
      requestId: body.requestId,
      action: body.action,
      payload: body.payload,
      resultOk: false,
      resultMessage: message
    });

    res.status(500).json({ ok: false, error: "action_failed", message, timestamp: ts });
  }
});

actionRouter.post("/command", async (req, res) => {
  const parsed = commandSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "invalid_command", details: parsed.error.flatten() });
    return;
  }

  try {
    const commandResult = parseCommand(parsed.data.command);
    const actionRequests: ActionRequest[] = commandResult.actionRequests.map((req, idx) => ({
      ...req,
      requestId: parsed.data.requestId ? `${parsed.data.requestId}-${idx + 1}` : undefined,
      source: parsed.data.source ?? "natural-command"
    }));

    const results: unknown[] = [];
    for (const actionReq of actionRequests) {
      const actionResponse = await fetch(`http://${env.host}:${env.port}/api/action`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.apiKey
        },
        body: JSON.stringify(actionReq)
      });

      const result = await actionResponse.json();
      if (!actionResponse.ok) {
        res.status(actionResponse.status).json({
          ok: false,
          error: "command_action_failed",
          failedAction: actionReq,
          partialResults: results,
          result
        });
        return;
      }
      results.push({ action: actionReq.action, result });
    }

    res.json({
      ok: true,
      command: parsed.data.command,
      normalized: commandResult.normalized,
      parsedActions: actionRequests,
      results
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ ok: false, error: "command_parse_failed", message });
  }
});
