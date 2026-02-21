import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { runMacro, setProgramInput } from "../adapters/atem.js";
import { clearLayer, nextSlide, previousSlide, triggerPlaylistItem } from "../adapters/propresenter.js";
import { writeAudit } from "../core/audit.js";
import type { ActionName, ActionResult } from "../types/actions.js";

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("atem.program.set"),
    payload: z.object({ input: z.number().int().min(1).max(20) }),
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

export const actionRouter = Router();

actionRouter.get("/health", (_req, res) => {
  res.json({ ok: true, service: "gkm-automation", ts: new Date().toISOString() });
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
