import { env } from "../config/env.js";
export function authMiddleware(req, res, next) {
    const incoming = req.header("x-api-key");
    if (!incoming || incoming !== env.apiKey) {
        res.status(401).json({ ok: false, error: "unauthorized" });
        return;
    }
    next();
}
