import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header("x-api-key");
  if (!incoming || incoming !== env.apiKey) {
    res.status(401).json({ ok: false, error: "unauthorized" });
    return;
  }
  next();
}
