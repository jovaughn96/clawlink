import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { authMiddleware } from "./core/auth.js";
import { actionRouter } from "./api/action-router.js";
const app = express();
app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.get("/", (_req, res) => {
    res.json({ ok: true, name: "gkm-automation", version: "0.1.0" });
});
app.use(authMiddleware);
app.use("/api", actionRouter);
app.listen(env.port, env.host, () => {
    console.log(`[gkm-automation] listening on http://${env.host}:${env.port} dryRun=${env.dryRun} atemMock=${env.atemMock}`);
});
