import { NextRequest, NextResponse } from "next/server";
import { signToken, COOKIE_NAME } from "@/lib/auth";
import { env } from "@/lib/env";
import {
  clearLoginFailures,
  isLoginLockedOut,
  registerLoginFailure,
} from "@/lib/login-rate-limit";

const AUTH_FAILURE_DELAY_MS = 300;
const INVALID_CREDENTIALS_MESSAGE = "Invalid credentials";
const LOCKED_OUT_MESSAGE = "Too many attempts. Try again later.";

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  if (isLoginLockedOut(req)) {
    await delay(AUTH_FAILURE_DELAY_MS);
    return NextResponse.json({ error: LOCKED_OUT_MESSAGE }, { status: 429 });
  }

  let password = "";
  try {
    const body = await req.json();
    if (body && typeof body.password === "string") {
      password = body.password;
    }
  } catch {
    // Keep auth failures generic.
  }

  if (password !== env.APP_PASSWORD) {
    const lockedOut = registerLoginFailure(req);
    await delay(AUTH_FAILURE_DELAY_MS);
    return NextResponse.json(
      { error: lockedOut ? LOCKED_OUT_MESSAGE : INVALID_CREDENTIALS_MESSAGE },
      { status: lockedOut ? 429 : 401 }
    );
  }

  clearLoginFailures(req);

  const token = await signToken({ authenticated: true });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24h
  });

  return res;
}
