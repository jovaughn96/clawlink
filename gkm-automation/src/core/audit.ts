import Database from "better-sqlite3";
import { env } from "../config/env.js";

const db = new Database(env.sqlitePath);

db.exec(`
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  source TEXT,
  request_id TEXT,
  action TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  result_ok INTEGER NOT NULL,
  result_message TEXT NOT NULL,
  result_json TEXT
);
`);

const insertStmt = db.prepare(`
INSERT INTO audit_log (ts, source, request_id, action, payload_json, result_ok, result_message, result_json)
VALUES (@ts, @source, @request_id, @action, @payload_json, @result_ok, @result_message, @result_json)
`);

export function writeAudit(entry: {
  ts: string;
  source?: string;
  requestId?: string;
  action: string;
  payload: unknown;
  resultOk: boolean;
  resultMessage: string;
  resultData?: unknown;
}): void {
  insertStmt.run({
    ts: entry.ts,
    source: entry.source ?? null,
    request_id: entry.requestId ?? null,
    action: entry.action,
    payload_json: JSON.stringify(entry.payload ?? {}),
    result_ok: entry.resultOk ? 1 : 0,
    result_message: entry.resultMessage,
    result_json: entry.resultData ? JSON.stringify(entry.resultData) : null
  });
}
