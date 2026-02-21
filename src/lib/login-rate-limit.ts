import { NextRequest } from "next/server";

const WINDOW_MS = 10 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

interface AttemptState {
  failedAttempts: number[];
  lockoutUntil: number;
}

const attemptsByIp = new Map<string, AttemptState>();

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get("x-real-ip");
  return realIp && realIp.trim().length > 0 ? realIp : "unknown";
}

function getState(ip: string, now: number): AttemptState {
  const existing = attemptsByIp.get(ip) ?? { failedAttempts: [], lockoutUntil: 0 };

  const failedAttempts = existing.failedAttempts.filter(
    (attemptAt) => now - attemptAt <= WINDOW_MS
  );

  const lockoutUntil = existing.lockoutUntil > now ? existing.lockoutUntil : 0;
  const state: AttemptState = { failedAttempts, lockoutUntil };
  attemptsByIp.set(ip, state);
  return state;
}

export function isLoginLockedOut(req: NextRequest, now = Date.now()): boolean {
  const ip = getClientIp(req);
  const state = getState(ip, now);
  return state.lockoutUntil > now;
}

export function registerLoginFailure(req: NextRequest, now = Date.now()): boolean {
  const ip = getClientIp(req);
  const state = getState(ip, now);
  state.failedAttempts.push(now);

  if (state.failedAttempts.length >= MAX_FAILED_ATTEMPTS) {
    state.lockoutUntil = now + LOCKOUT_MS;
    state.failedAttempts = [];
  }

  attemptsByIp.set(ip, state);
  return state.lockoutUntil > now;
}

export function clearLoginFailures(req: NextRequest): void {
  const ip = getClientIp(req);
  attemptsByIp.delete(ip);
}
