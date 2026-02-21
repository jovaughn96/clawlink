import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { runMacro, setProgramInput } from "../adapters/atem.js";
import { writeAudit } from "../core/audit.js";
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
        action: z.literal("system.health"),
        payload: z.object({}).default({}),
        requestId: z.string().optional(),
        source: z.string().optional()
    })
]);
function ensureAllowed(action) {
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
        let result;
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
    }
    catch (error) {
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
