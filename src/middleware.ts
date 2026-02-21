import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  // Skip auth endpoints
  if (req.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return redirectToLogin(req);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return redirectToLogin(req);
  }

  return NextResponse.next();
}

function redirectToLogin(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
