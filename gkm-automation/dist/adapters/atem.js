import { env } from "../config/env.js";
export async function setProgramInput(input) {
    if (env.atemMock) {
        return { target: env.atemIp, input };
    }
    // Placeholder for live ATEM integration.
    // Suggested next step: integrate Blackmagic ATEM library and call setProgramInput on live bus.
    throw new Error("ATEM live mode not wired yet. Set ATEM_MOCK=true for now.");
}
export async function runMacro(macroId) {
    if (env.atemMock) {
        return { target: env.atemIp, macroId };
    }
    throw new Error("ATEM live macro mode not wired yet. Set ATEM_MOCK=true for now.");
}
